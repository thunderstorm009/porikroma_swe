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
        if (response?.data?.forecast) {
          return response.data.forecast.map((item) => {
            const dateStr = item.dt_txt ? item.dt_txt.split(' ')[0] : 'Unknown';
            return {
              day: dateStr,
              icon: item.weather?.[0]?.icon?.includes('d') ? '☀️' : '🌧️',
              temp: Math.round(item.main?.temp || 0),
              rain: item.main?.humidity || 0,
              label: item.weather?.[0]?.description || 'Clear'
            };
          });
        }
      } catch (err) {
        console.warn('Weather service backend request failed, using fallback:', err);
      }
    }
    return MOCK_WEATHER[location?.id] || MOCK_WEATHER.default;
  }
};


