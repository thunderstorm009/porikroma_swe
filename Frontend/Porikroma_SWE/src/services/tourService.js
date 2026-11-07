import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const MOCK_TOURS = [
  {
    id: 'tour-1',
    title: 'Cox’s Bazar Beach & Sunset Retreat',
    description: 'Guided beach tour, seafood dining experiences, and island hopping.',
    price: 18500,
    duration_days: 3,
    status: 'published'
  },
  {
    id: 'tour-2',
    title: 'Sylhet Tea Gardens & Swamp Forest Exploration',
    description: 'Explore Ratargul Swamp Forest, Jaflong, and luxury tea estate stays.',
    price: 22000,
    duration_days: 4,
    status: 'published'
  }
];

// In production every method talks to the API and lets errors propagate; showing a
// mock tour (or the wrong tour) as if it were bookable would mislead travelers.
export const tourService = {
  getTours: async (params = {}) => {
    if (useMock) return MOCK_TOURS;
    const response = await apiClient.get('/api/v1/tours', params);
    return Array.isArray(response?.data) ? response.data : [];
  },

  getTour: async (tourId) => {
    if (useMock) return MOCK_TOURS.find((t) => t.id === tourId) || null;
    const response = await apiClient.get(`/api/v1/tours/${tourId}`);
    return response?.data || null;
  },

  getDepartures: async (tourId) => {
    if (useMock) return [];
    const response = await apiClient.get(`/api/v1/tours/${tourId}/departures`);
    return Array.isArray(response?.data) ? response.data : [];
  },

  getCheckoutLink: async (tourId) => {
    if (useMock) return null;
    try {
      const response = await apiClient.get(`/api/v1/tours/${tourId}/checkout-link`);
      return response?.data || null;
    } catch (err) {
      if (err?.status === 404) return null; // tour has no external checkout link
      throw err;
    }
  },

  createReservation: async (tourId, departureId, travelerCount = 1) => {
    if (useMock) return { id: `res-${Date.now()}`, status: 'requested', traveler_count: travelerCount };
    const response = await apiClient.post(`/api/v1/tours/${tourId}/reservation-requests`, {
      departure_id: departureId,
      traveler_count: travelerCount
    });
    return response.data;
  },

  getMyReservations: async () => {
    if (useMock) return [];
    const response = await apiClient.get('/api/v1/reservation-requests');
    return Array.isArray(response?.data) ? response.data : [];
  },

  cancelReservation: async (requestId) => {
    if (useMock) return { cancelled: true };
    const response = await apiClient.delete(`/api/v1/reservation-requests/${requestId}`);
    return response.data;
  }
};
