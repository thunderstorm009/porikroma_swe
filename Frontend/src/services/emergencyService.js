import { MOCK_EMERGENCY_LOCATIONS } from '../data/travelData';
import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Backend categories are snake_case ("fire_station"); the UI uses labels ("Fire Station").
const CATEGORY_LABELS = { hospital: 'Hospital', pharmacy: 'Pharmacy', police: 'Police', fire_station: 'Fire Station' };

const toUiLocation = (item) => ({
  ...item,
  category: CATEGORY_LABELS[item.category] || item.category,
  latitude: Number(item.latitude),
  longitude: Number(item.longitude),
});

export const emergencyService = {
  // Real locations only: emergency information must never be invented. In production a
  // failure is thrown so the page can say so instead of showing someone else's hospitals.
  getEmergencyLocations: async (lat, lng, category) => {
    if (useMock) {
      const categoryFilter = category && category !== 'All' ? category.toLowerCase() : null;
      return MOCK_EMERGENCY_LOCATIONS.filter((item) => !categoryFilter || item.category.toLowerCase().includes(categoryFilter));
    }
    if (lat == null || lng == null) return [];
    const params = { latitude: lat, longitude: lng, radius: 50 };
    if (category && category !== 'All') params.category = category;
    const response = await apiClient.get('/api/v1/emergency/nearby', params);
    return (Array.isArray(response?.data) ? response.data : []).map(toUiLocation);
  },
  getHospitals: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Hospital'),
  getPharmacies: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Pharmacy'),
  getPoliceStations: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Police'),
  getFireStations: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Fire Station')
};
