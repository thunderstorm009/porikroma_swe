import { MOCK_WEATHER } from '../data/travelData';
import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const weatherService = {
  getWeather: async (location) => {
    if (!useMock && location?.latitude && location?.longitude) {
      try {
        const response = await apiClient.get('/api/v1/weather', {
          latitude: location.latitude,
          longitude: location.longitude
        });
        if (response?.data) return response.data;
      } catch (err) {
        console.warn('Weather service backend request failed, using fallback:', err);
      }
    }
    return MOCK_WEATHER[location?.id] || MOCK_WEATHER.default;
  }
};


