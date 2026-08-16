import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
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
  let response = await requestWithSession(endpoint, options, session);

  // A token can expire between getSession() and fetch(). Refresh once and retry
  // with the new Supabase-managed token; never reuse a manually cached token.
  if (response.status === 401 && session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session?.access_token && refreshed.data.session.access_token !== session.access_token) {
      session = refreshed.data.session;
      response = await requestWithSession(endpoint, options, session);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.detail || 'An error occurred',
      data: errorData
    };
  }

  if (response.status === 204) return { data: null };
  return response.json();
}

export const apiClient = {
  get: (endpoint, params = {}) => fetchWithAuth(endpoint, { method: 'GET', params }),
  post: (endpoint, body) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => fetchWithAuth(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
