import { MOCK_WEATHER } from '../data/travelData';
import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const getWeatherIcon = (main) => {
  switch ((main || '').toLowerCase()) {
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      return '🌧️';
    case 'clouds':
      return '⛅';
    case 'clear':
      return '☀️';
    case 'fog':
    case 'mist':
    case 'haze':
      return '🌫️';
    default:
      return '☀️';
  }
};

export const weatherService = {
  getWeather: async (location) => {
    if (!useMock && location?.latitude && location?.longitude) {
      try {
        const response = await apiClient.get('/api/v1/weather', {
          latitude: location.latitude,
          longitude: location.longitude
        });
        const forecastList = response?.data?.forecast;
        if (Array.isArray(forecastList) && forecastList.length > 0) {
          return forecastList.map((item, idx) => ({
            day: item.dt_txt
              ? new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : `Day ${idx + 1}`,
            temp: Math.round(item.main?.temp ?? 28),
            rain: item.main?.humidity ? Math.min(100, Math.round(item.main.humidity * 0.7)) : 20,
            icon: getWeatherIcon(item.weather?.[0]?.main),
            label: item.weather?.[0]?.description || item.weather?.[0]?.main || 'Clear'
          }));
        }
      } catch (err) {
        console.warn('Weather service backend request failed, using fallback:', err);
      }
    }
    return MOCK_WEATHER[location?.id] || MOCK_WEATHER.default;
  }
};
