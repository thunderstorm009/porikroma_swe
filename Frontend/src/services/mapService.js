import { DESTINATIONS, MOCK_ATTRACTIONS, MOCK_EMERGENCY_LOCATIONS, MOCK_HOTELS, MOCK_RESTAURANTS } from '../data/travelData';

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 220));

export const mapService = {
  searchLocation: (query = '') => wait(DESTINATIONS.filter((location) => `${location.name} ${location.country}`.toLowerCase().includes(query.toLowerCase()))),
  getLocationDetails: (id) => wait(DESTINATIONS.find((location) => location.id === id) || DESTINATIONS[0]),
  getNearbyLocations: (location, category = 'All') => {
    const name = location?.name || "Cox's Bazar";
    const attractions = MOCK_ATTRACTIONS.filter((item) => item.location === name).map((item) => ({ ...item, markerCategory: 'Attraction' }));
    const hotels = MOCK_HOTELS.filter((item) => item.location === name).map((item, index) => ({ ...item, markerCategory: 'Hotel', latitude: (location?.latitude || 21.4272) + index * 0.008, longitude: (location?.longitude || 92.0058) - index * 0.006 }));
    const restaurants = MOCK_RESTAURANTS.filter((item) => item.location === name).map((item, index) => ({ ...item, markerCategory: 'Restaurant', latitude: (location?.latitude || 21.4272) - index * 0.006, longitude: (location?.longitude || 92.0058) + index * 0.007 }));
    const emergency = MOCK_EMERGENCY_LOCATIONS.filter((item) => item.latitude && Math.abs(item.latitude - (location?.latitude || 21.4272)) < 4).map((item) => ({ ...item, markerCategory: 'Emergency' }));
    const all = [...hotels, ...attractions, ...restaurants, ...emergency];
    return category === 'All' ? all : category === 'Emergency' ? emergency : all.filter((item) => item.markerCategory === category);
  }
};
