import { MOCK_WEATHER } from '../data/travelData';

export const weatherService = {
  getWeather: (location) => Promise.resolve(MOCK_WEATHER[location?.id] || MOCK_WEATHER.default)
};

