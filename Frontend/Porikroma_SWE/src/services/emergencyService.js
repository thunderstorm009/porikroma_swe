import { MOCK_EMERGENCY_LOCATIONS } from '../data/travelData';
import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const emergencyService = {
  getEmergencyLocations: async (lat = 21.4272, lng = 92.0058, category) => {
    if (!useMock) {
      try {
        const params = { latitude: lat, longitude: lng };
        if (category && category !== 'All') params.category = category;
        const response = await apiClient.get('/api/v1/emergency/nearby', params);
        if (Array.isArray(response?.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('Emergency backend request failed, using fallback:', err);
      }
    }
    const categoryFilter = category && category !== 'All' ? category.toLowerCase() : null;
    return MOCK_EMERGENCY_LOCATIONS.filter((item) => !categoryFilter || item.category.toLowerCase().includes(categoryFilter));
  },
  getHospitals: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Hospital'),
  getPharmacies: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Pharmacy'),
  getPoliceStations: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Police'),
  getFireStations: (lat, lng) => emergencyService.getEmergencyLocations(lat, lng, 'Fire Station')
};


