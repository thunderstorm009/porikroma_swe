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

export const tourService = {
  getTours: async (params = {}) => {
    if (!useMock) {
      try {
        const response = await apiClient.get('/api/v1/tours', params);
        if (Array.isArray(response?.data)) return response.data;
      } catch (err) {
        console.warn('Tour service backend request failed, using fallback:', err);
      }
    }
    return MOCK_TOURS;
  },

  getTour: async (tourId) => {
    if (!useMock && tourId) {
      try {
        const response = await apiClient.get(`/api/v1/tours/${tourId}`);
        if (response?.data) return response.data;
      } catch (err) {
        console.warn('Get tour backend request failed, using fallback:', err);
      }
    }
    return MOCK_TOURS.find((t) => t.id === tourId) || MOCK_TOURS[0];
  },

  getDepartures: async (tourId) => {
    if (!useMock && tourId) {
      try {
        const response = await apiClient.get(`/api/v1/tours/${tourId}/departures`);
        if (Array.isArray(response?.data)) return response.data;
      } catch (err) {
        console.warn('Get departures backend request failed:', err);
      }
    }
    return [];
  },

  getCheckoutLink: async (tourId) => {
    if (!useMock && tourId) {
      try {
        const response = await apiClient.get(`/api/v1/tours/${tourId}/checkout-link`);
        if (response?.data) return response.data;
      } catch (err) {
        console.warn('Checkout link backend request failed:', err);
      }
    }
    return null;
  },

  createReservation: async (tourId, departureId, travelerCount = 1) => {
    if (!useMock) {
      const response = await apiClient.post(`/api/v1/tours/${tourId}/reservation-requests`, {
        departure_id: departureId,
        traveler_count: travelerCount
      });
      return response.data;
    }
    return { id: `res-${Date.now()}`, status: 'requested', traveler_count: travelerCount };
  },

  getMyReservations: async () => {
    if (!useMock) {
      try {
        const response = await apiClient.get('/api/v1/reservation-requests');
        if (Array.isArray(response?.data)) return response.data;
      } catch (err) {
        console.warn('My reservations backend request failed:', err);
      }
    }
    return [];
  },

  cancelReservation: async (requestId) => {
    if (!useMock) {
      const response = await apiClient.delete(`/api/v1/reservation-requests/${requestId}`);
      return response.data;
    }
    return { cancelled: true };
  }
};
