import { apiClient } from './apiClient';
import { BANGLADESH_TRIPS } from '../mockData';

const wait = (value, ms = 280) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const JOIN_REQUEST_STATUSES = ['approved', 'rejected', 'cancelled'];

const KNOWN_DESTINATIONS = {
  'cox\'s bazar': '10000000-0000-4000-8000-000000000001',
  'sajek valley': '10000000-0000-4000-8000-000000000002',
  'sreemangal': '10000000-0000-4000-8000-000000000003',
  'bandarban': '10000000-0000-4000-8000-000000000004',
  'sylhet': '10000000-0000-4000-8000-000000000005',
  'sundarbans': '10000000-0000-4000-8000-000000000006',
  'saint martin\'s island': '10000000-0000-4000-8000-000000000007',
  'saint martin': '10000000-0000-4000-8000-000000000007'
};

const findDestinationId = (destName) => {
  if (!destName) return null;
  if (/^[0-9a-fA-F-]{36}$/.test(destName)) return destName;
  const lower = String(destName).toLowerCase();
  for (const [name, uuid] of Object.entries(KNOWN_DESTINATIONS)) {
    if (lower.includes(name)) return uuid;
  }
  return null;
};

const parseDateString = (d) => {
  if (!d) return null;
  if (typeof d === 'string') {
    const match = d.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  } catch {}
  return null;
};

// "2026-10-01 — 2026-10-05", "2026-10-01 to 2026-10-05", ... ISO dates contain '-',
// so pull the dates out with a regex instead of splitting on separators.
const parseDatesRange = (datesStr) => {
  if (!datesStr || typeof datesStr !== 'string') return { start_date: null, end_date: null };
  const isoDates = datesStr.match(/\d{4}-\d{2}-\d{2}/g);
  if (isoDates?.length) return { start_date: isoDates[0], end_date: isoDates[1] || isoDates[0] };
  const parts = datesStr.split(/\s+(?:—|–|to)\s+|\s*[—–]\s*/i).map((part) => part.trim()).filter(Boolean);
  const start = parseDateString(parts[0]);
  const end = parseDateString(parts[1]) || start;
  return { start_date: start, end_date: end };
};

const normalizeTripPayload = (data) => {
  const title = (data.title || (typeof data.destination === 'string' ? data.destination : data.destination?.name) || 'Bangladesh Trip').trim();
  const rawType = (data.travel_type || (data.type?.toLowerCase() === 'group' ? 'group' : 'solo')).toLowerCase();
  const travelType = rawType === 'group' ? 'group' : 'solo';
  
  let travelerCount = Number(data.traveler_count || (Array.isArray(data.members) ? data.members.length : 1)) || 1;
  if (travelType === 'solo') {
    travelerCount = 1;
  } else if (travelerCount < 2) {
    travelerCount = 2;
  }

  const budget = typeof data.budget === 'number'
    ? Math.max(0, data.budget)
    : Math.max(0, parseFloat(String(data.budget || '0').replace(/[^0-9.]/g, '')) || 0);

  let status = (data.status || 'planning').toLowerCase();
  if (!['planning', 'active', 'completed', 'cancelled'].includes(status)) {
    status = 'planning';
  }

  let startDate = parseDateString(data.start_date || data.startDate);
  let endDate = parseDateString(data.end_date || data.endDate);
  if (!startDate && data.dates) {
    const parsed = parseDatesRange(data.dates);
    startDate = parsed.start_date;
    endDate = parsed.end_date;
  }

  if (startDate && endDate && endDate < startDate) {
    endDate = startDate;
  }

  const destId = data.destination_id && /^[0-9a-fA-F-]{36}$/.test(data.destination_id)
    ? data.destination_id
    : findDestinationId(typeof data.destination === 'string' ? data.destination : (data.destination?.name || title));

  const payload = {
    title: title.slice(0, 200),
    description: data.description || '',
    travel_type: travelType,
    traveler_count: travelerCount,
    budget,
    status,
    visibility: data.visibility || (travelType === 'group' ? 'public' : 'private')
  };

  if (startDate) payload.start_date = startDate;
  if (endDate) payload.end_date = endDate;
  if (destId) payload.destination_id = destId;

  return payload;
};

const normalizeTripUpdatePayload = (data) => {
  const payload = {};
  if (data.title || data.destination) {
    payload.title = (data.title || (typeof data.destination === 'string' ? data.destination : data.destination?.name) || '').trim().slice(0, 200);
  }
  if (data.description !== undefined) payload.description = data.description;
  if (data.travel_type || data.type) {
    const rawType = (data.travel_type || (data.type?.toLowerCase() === 'group' ? 'group' : 'solo')).toLowerCase();
    payload.travel_type = rawType === 'group' ? 'group' : 'solo';
  }
  if (data.traveler_count !== undefined) {
    payload.traveler_count = Math.max(1, Number(data.traveler_count) || 1);
  }
  if (data.budget !== undefined) {
    payload.budget = typeof data.budget === 'number'
      ? Math.max(0, data.budget)
      : Math.max(0, parseFloat(String(data.budget || '0').replace(/[^0-9.]/g, '')) || 0);
  }
  if (data.status) {
    const s = String(data.status).toLowerCase();
    if (['planning', 'active', 'completed', 'cancelled'].includes(s)) payload.status = s;
  }
  if (data.visibility) {
    const v = String(data.visibility).toLowerCase();
    if (['private', 'public'].includes(v)) payload.visibility = v;
  }

  const startDate = parseDateString(data.start_date || data.startDate);
  const endDate = parseDateString(data.end_date || data.endDate);
  if (startDate) payload.start_date = startDate;
  if (endDate) payload.end_date = endDate;
  if (!startDate && !endDate && data.dates) {
    const parsed = parseDatesRange(data.dates);
    if (parsed.start_date) payload.start_date = parsed.start_date;
    if (parsed.end_date) payload.end_date = parsed.end_date;
  }

  if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
    payload.end_date = payload.start_date;
  }

  const destId = data.destination_id && /^[0-9a-fA-F-]{36}$/.test(data.destination_id)
    ? data.destination_id
    : (data.destination ? findDestinationId(typeof data.destination === 'string' ? data.destination : data.destination?.name) : null);
  if (destId) payload.destination_id = destId;

  return payload;
};

export const tripService = {
  getTrips: () => useMock ? wait(BANGLADESH_TRIPS) : apiClient.get('/api/v1/trips').then((response) => response.data?.items || []),
  getDiscoverTrips: (travelType) => useMock ? wait(BANGLADESH_TRIPS) : apiClient.get('/api/v1/trips', { discover: true, travel_type: travelType }).then((response) => response.data?.items || []),
  getTrip: (id) => useMock ? wait(BANGLADESH_TRIPS.find((trip) => String(trip.id) === String(id)) || null) : apiClient.get(`/api/v1/trips/${id}`).then((response) => response.data),
  createTrip: (data) => useMock ? wait({ ...data, id: Date.now(), status: 'Planning' }) : apiClient.post('/api/v1/trips', normalizeTripPayload(data)).then((response) => response.data),
  updateTrip: (id, data) => useMock ? wait({ ...data, id }) : apiClient.patch(`/api/v1/trips/${id}`, normalizeTripUpdatePayload(data)).then((response) => response.data),
  deleteTrip: (id) => useMock ? wait({ id, deleted: true }) : apiClient.delete(`/api/v1/trips/${id}`).then((response) => response.data),

  getJoinRequests: (tripId) => useMock ? wait([]) : apiClient.get(`/api/v1/trips/${tripId}/join-requests`).then((response) => response.data || []),
  createJoinRequest: (tripId, message = 'Request to join group') => useMock ? wait({ id: `req-${Date.now()}`, status: 'pending' }) : apiClient.post(`/api/v1/trips/${tripId}/join-requests`, { message: typeof message === 'string' ? message : message?.message || 'Request to join group' }).then((response) => response.data),
  updateJoinRequest: (tripId, requestId, status) => {
    const normalizedStatus = String(status).toLowerCase();
    if (!JOIN_REQUEST_STATUSES.includes(normalizedStatus)) {
      // Never guess: an unknown value must not turn into an approval.
      return Promise.reject(new Error(`Unsupported join request status: ${status}`));
    }
    return useMock
      ? wait({ id: requestId, status: normalizedStatus })
      : apiClient.patch(`/api/v1/trips/${tripId}/join-requests/${requestId}`, { status: normalizedStatus }).then((response) => response.data);
  },
  getItinerary: (tripId) => useMock ? wait([]) : apiClient.get(`/api/v1/trips/${tripId}/itinerary`).then((response) => response.data || []),
  leaveTrip: (tripId, userId) => useMock ? wait({ id: tripId, left: true }) : apiClient.delete(`/api/v1/trips/${tripId}/members/${userId}`)
};
