import { apiClient } from './apiClient';
import { BANGLADESH_TRIPS } from '../mockData';

const wait = (value, ms = 280) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const tripService = {
  getTrips: () => useMock ? wait(BANGLADESH_TRIPS) : apiClient.get('/api/v1/trips').then((response) => response.data?.items || []),
  getTrip: (id) => useMock ? wait(BANGLADESH_TRIPS.find((trip) => String(trip.id) === String(id)) || null) : apiClient.get(`/api/v1/trips/${id}`).then((response) => response.data),
  createTrip: (data) => useMock ? wait({ ...data, id: Date.now(), status: 'Planning' }) : apiClient.post('/api/v1/trips', data).then((response) => response.data),
  updateTrip: (id, data) => useMock ? wait({ ...data, id }) : apiClient.patch(`/api/v1/trips/${id}`, data).then((response) => response.data),
  deleteTrip: (id) => useMock ? wait({ id, deleted: true }) : apiClient.delete(`/api/v1/trips/${id}`)
};
