import { MOCK_EMERGENCY_LOCATIONS } from '../data/travelData';

export const emergencyService = {
  getEmergencyLocations: () => Promise.resolve(MOCK_EMERGENCY_LOCATIONS),
  getHospitals: () => Promise.resolve(MOCK_EMERGENCY_LOCATIONS.filter((item) => item.category === 'Hospital')),
  getPharmacies: () => Promise.resolve(MOCK_EMERGENCY_LOCATIONS.filter((item) => item.category === 'Pharmacy')),
  getPoliceStations: () => Promise.resolve(MOCK_EMERGENCY_LOCATIONS.filter((item) => item.category === 'Police')),
  getFireStations: () => Promise.resolve(MOCK_EMERGENCY_LOCATIONS.filter((item) => item.category === 'Fire Station'))
};

