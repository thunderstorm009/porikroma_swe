import { supabase } from './supabase';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// FastAPI returns `detail` as a string for HTTPException and as an array of
// {loc, msg} objects for request validation (422). Turn both into readable text.
function errorMessage(status, errorData) {
  const detail = errorData?.detail;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status >= 500) return 'Server error. Please try again.';
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
        const msg = String(item?.msg || 'Invalid value').replace(/^Value error, /, '');
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }
  return 'An error occurred';
}

const connectionError = (error) => (
  error instanceof TypeError ? new ApiError(0, 'Cannot connect to Porikroma server.') : error
);

async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  let session = data.session;
  // Do not cache tokens ourselves. If the current session is close to expiry,
  // ask Supabase Auth for a refreshed session before sending the request.
  if (session?.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 30) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session) session = refreshed.data.session;
  }
  return session;
}

async function requestWithSession(endpoint, options, session) {
  // Content-Type only when there is a body: on a GET it would force an extra CORS preflight.
  const headers = { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const { params, ...requestOptions } = options;
  const query = params ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString() : '';
  return fetch(`${API_BASE_URL}${endpoint}${query ? `?${query}` : ''}`, {
    ...requestOptions,
    headers
  });
}

async function fetchWithAuth(endpoint, options = {}) {
  let session = await getCurrentSession();
  let response;
  try {
    response = await requestWithSession(endpoint, options, session);
  } catch (error) {
    throw connectionError(error);
  }

  // A token can expire between getSession() and fetch(). Refresh once and retry
  // with the new Supabase-managed token; never reuse a manually cached token.
  if (response.status === 401 && session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session?.access_token && refreshed.data.session.access_token !== session.access_token) {
      session = refreshed.data.session;
      try {
        response = await requestWithSession(endpoint, options, session);
      } catch (error) {
        throw connectionError(error);
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorMessage(response.status, errorData), errorData);
  }

  if (response.status === 204) return { data: null };
  return response.json();
}

export const apiClient = {
  get: (endpoint, params = {}) => fetchWithAuth(endpoint, { method: 'GET', params }),
  post: (endpoint, body) => fetchWithAuth(endpoint, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
  patch: (endpoint, body) => fetchWithAuth(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
