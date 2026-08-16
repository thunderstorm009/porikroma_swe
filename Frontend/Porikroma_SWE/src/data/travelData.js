export const MOCK_USERS = [
  { id: 'u1', name: 'Sarah Jenkins', initials: 'SJ', role: 'Trip owner', color: 'teal' },
  { id: 'u2', name: 'Abrar Hossain', initials: 'AH', role: 'Admin', color: 'amber' },
  { id: 'u3', name: 'Huzaifa Rahman', initials: 'HR', role: 'Member', color: 'blue' },
  { id: 'u4', name: 'Faizul Karim', initials: 'FK', role: 'Member', color: 'purple' },
  { id: 'u5', name: 'Munzeer Ahmed', initials: 'MA', role: 'Member', color: 'rose' },
  { id: 'u6', name: 'Nusrat Jahan', initials: 'NJ', role: 'Member', color: 'slate' }
];

export const DESTINATIONS = [
  { id: 'cox', name: "Cox's Bazar", country: 'Bangladesh', latitude: 21.4272, longitude: 92.0058, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop', description: 'Long beaches, seafood and an easy coastal rhythm.', estimatedBudget: 18000, recommendedDays: 3, categories: ['beach', 'photography', 'food'] },
  { id: 'sajek', name: 'Sajek Valley', country: 'Bangladesh', latitude: 23.3815, longitude: 92.2938, image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=900&auto=format&fit=crop', description: 'Cloud trails, hill villages and slow mornings above the valley.', estimatedBudget: 14500, recommendedDays: 4, categories: ['hiking', 'nature', 'photography'] },
  { id: 'sreemangal', name: 'Sreemangal', country: 'Bangladesh', latitude: 24.3065, longitude: 91.7296, image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=900&auto=format&fit=crop', description: 'Tea gardens, rainforest walks and a restorative green escape.', estimatedBudget: 12500, recommendedDays: 3, categories: ['nature', 'food', 'wellness'] },
  { id: 'bandarban', name: 'Bandarban', country: 'Bangladesh', latitude: 22.1953, longitude: 92.2184, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop', description: 'Mountain trails and riverside stays for curious explorers.', estimatedBudget: 16000, recommendedDays: 4, categories: ['hiking', 'adventure', 'nature'] },
  { id: 'sylhet', name: 'Sylhet', country: 'Bangladesh', latitude: 24.8949, longitude: 91.8687, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=900&auto=format&fit=crop', description: 'Waterfalls, tea estates and a generous food culture.', estimatedBudget: 13500, recommendedDays: 3, categories: ['nature', 'food', 'culture'] },
  { id: 'sundarbans', name: 'Sundarbans', country: 'Bangladesh', latitude: 21.9497, longitude: 89.1833, image: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=900&auto=format&fit=crop', description: 'A wild mangrove corridor made for patient, immersive travel.', estimatedBudget: 24000, recommendedDays: 4, categories: ['wildlife', 'nature', 'photography'] },
  { id: 'saint-martin', name: "Saint Martin's Island", country: 'Bangladesh', latitude: 20.6275, longitude: 92.3228, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=900&auto=format&fit=crop', description: 'Clear water, quiet shorelines and a compact island pace.', estimatedBudget: 21000, recommendedDays: 3, categories: ['beach', 'food', 'photography'] }
];

export const MOCK_HOTELS = [
  { id: 'hotel-1', name: 'Sayeman Beach Resort', location: "Cox's Bazar", price: 9500, rating: 4.7, tags: ['Beachfront', 'Pool'] },
  { id: 'hotel-2', name: 'Long Beach Hotel', location: "Cox's Bazar", price: 7200, rating: 4.4, tags: ['Central', 'Breakfast'] },
  { id: 'hotel-3', name: 'Grand Sultan Tea Resort', location: 'Sreemangal', price: 14500, rating: 4.8, tags: ['Garden', 'Spa'] },
  { id: 'hotel-4', name: 'Megh Machang', location: 'Sajek Valley', price: 6800, rating: 4.6, tags: ['Valley view', 'Breakfast'] },
  { id: 'hotel-5', name: 'The Palace Luxury Resort', location: 'Sylhet', price: 18500, rating: 4.9, tags: ['Luxury', 'Lake'] },
  { id: 'hotel-6', name: 'Hill View Cottage', location: 'Bandarban', price: 5400, rating: 4.3, tags: ['Quiet', 'Trekking'] },
  { id: 'hotel-7', name: 'Nokrek Eco Lodge', location: 'Sundarbans', price: 7600, rating: 4.2, tags: ['Eco stay', 'Guide'] },
  { id: 'hotel-8', name: 'Blue Coral Resort', location: "Saint Martin's Island", price: 8300, rating: 4.5, tags: ['Sea view', 'Island'] }
];

export const MOCK_RESTAURANTS = [
  { id: 'rest-1', name: 'Mermaid Cafe', location: "Cox's Bazar", cuisine: 'Seafood', price: '৳৳', rating: 4.6 },
  { id: 'rest-2', name: 'Rupchanda BBQ', location: "Cox's Bazar", cuisine: 'Local', price: '৳৳', rating: 4.5 },
  { id: 'rest-3', name: 'Panshi Restaurant', location: 'Sylhet', cuisine: 'Bengali', price: '৳', rating: 4.7 },
  { id: 'rest-4', name: 'Seven Layer Tea Cabin', location: 'Sreemangal', cuisine: 'Tea & snacks', price: '৳', rating: 4.4 },
  { id: 'rest-5', name: 'Balishira Dining', location: 'Sreemangal', cuisine: 'Contemporary', price: '৳৳', rating: 4.5 },
  { id: 'rest-6', name: 'Hill View Kitchen', location: 'Bandarban', cuisine: 'Hill cuisine', price: '৳', rating: 4.3 },
  { id: 'rest-7', name: 'The Dining Hut', location: 'Sajek Valley', cuisine: 'Local', price: '৳৳', rating: 4.2 },
  { id: 'rest-8', name: 'Niribili Bistro', location: 'Sajek Valley', cuisine: 'Bengali', price: '৳৳', rating: 4.4 },
  { id: 'rest-9', name: 'Blue Lagoon Kitchen', location: "Saint Martin's Island", cuisine: 'Seafood', price: '৳৳', rating: 4.3 },
  { id: 'rest-10', name: 'Mango Tree Cafe', location: 'Sundarbans', cuisine: 'Local', price: '৳', rating: 4.1 }
];

export const MOCK_ATTRACTIONS = [
  { id: 'att-1', name: 'Cox’s Bazar Beach', category: 'Attraction', location: "Cox's Bazar", latitude: 21.4272, longitude: 92.0058, duration: '2 hrs' },
  { id: 'att-2', name: 'Himchari National Park', category: 'Attraction', location: "Cox's Bazar", latitude: 21.3622, longitude: 92.0457, duration: '3 hrs' },
  { id: 'att-3', name: 'Inani Beach', category: 'Attraction', location: "Cox's Bazar", latitude: 21.1681, longitude: 92.0477, duration: '2 hrs' },
  { id: 'att-4', name: 'Marine Drive', category: 'Attraction', location: "Cox's Bazar", latitude: 21.282, longitude: 92.051, duration: '1 hr' },
  { id: 'att-5', name: 'Ruilui Para', category: 'Attraction', location: 'Sajek Valley', latitude: 23.3815, longitude: 92.2938, duration: '2 hrs' },
  { id: 'att-6', name: 'Konglak Hill', category: 'Attraction', location: 'Sajek Valley', latitude: 23.399, longitude: 92.326, duration: '3 hrs' },
  { id: 'att-7', name: 'Lawachara Rainforest', category: 'Attraction', location: 'Sreemangal', latitude: 24.328, longitude: 91.777, duration: '4 hrs' },
  { id: 'att-8', name: 'Baikka Beel', category: 'Attraction', location: 'Sreemangal', latitude: 24.494, longitude: 91.754, duration: '2 hrs' },
  { id: 'att-9', name: 'Nilkantha Tea Cabin', category: 'Attraction', location: 'Sreemangal', latitude: 24.305, longitude: 91.735, duration: '1 hr' },
  { id: 'att-10', name: 'Golden Temple', category: 'Attraction', location: 'Bandarban', latitude: 22.196, longitude: 92.218, duration: '2 hrs' },
  { id: 'att-11', name: 'Nafakhum Waterfall', category: 'Attraction', location: 'Bandarban', latitude: 21.95, longitude: 92.4, duration: '6 hrs' },
  { id: 'att-12', name: 'Ratargul Swamp Forest', category: 'Attraction', location: 'Sylhet', latitude: 25.007, longitude: 91.933, duration: '3 hrs' },
  { id: 'att-13', name: 'Bichanakandi', category: 'Attraction', location: 'Sylhet', latitude: 25.173, longitude: 91.978, duration: '4 hrs' },
  { id: 'att-14', name: 'Karamjol Wildlife Center', category: 'Attraction', location: 'Sundarbans', latitude: 22.033, longitude: 89.6, duration: '3 hrs' },
  { id: 'att-15', name: 'Chhera Dwip', category: 'Attraction', location: "Saint Martin's Island", latitude: 20.568, longitude: 92.329, duration: '3 hrs' }
];

const emergency = (id, name, category, address, phone, distance, latitude, longitude, openStatus = 'Open 24 hours') => ({ id, name, category, address, phone, distance, latitude, longitude, openStatus });
export const MOCK_EMERGENCY_LOCATIONS = [
  emergency('h1', 'Cox’s Bazar District Hospital', 'Hospital', 'Hospital Road, Cox’s Bazar', '+880 341-62401', '1.4 km', 21.439, 91.979),
  emergency('h2', 'Union Hospital Cox’s Bazar', 'Hospital', 'Kolatoli Road', '+880 341-63555', '2.1 km', 21.408, 91.994),
  emergency('h3', 'Chevron Clinical Laboratory', 'Hospital', 'Main Road, Cox’s Bazar', '+880 1711-223344', '2.8 km', 21.441, 92.002),
  emergency('h4', 'Sadar Hospital Sreemangal', 'Hospital', 'College Road, Sreemangal', '+880 861-71255', '1.8 km', 24.306, 91.729),
  emergency('h5', 'Bandarban Sadar Hospital', 'Hospital', 'Hospital Road, Bandarban', '+880 361-62233', '2.5 km', 22.194, 92.22),
  emergency('h6', 'Sylhet MAG Osmani Medical', 'Hospital', 'Medical College Road', '+880 821-713667', '4.2 km', 24.903, 91.879),
  emergency('h7', 'Khulna Medical College Hospital', 'Hospital', 'Sonadanga, Khulna', '+880 41-762011', '5.2 km', 22.82, 89.55),
  emergency('h8', 'St Martin Community Clinic', 'Hospital', 'West Beach, Saint Martin', '+880 1812-778899', '1.1 km', 20.627, 92.322),
  emergency('p1', 'Lazz Pharma Kolatoli', 'Pharmacy', 'Kolatoli Beach Road', '+880 1812-111222', '0.8 km', 21.413, 91.99),
  emergency('p2', 'Popular Pharmacy', 'Pharmacy', 'Hotel Motel Zone', '+880 1712-333444', '1.6 km', 21.421, 91.994),
  emergency('p3', 'Sreemangal Care Pharmacy', 'Pharmacy', 'Moulvibazar Road', '+880 1712-555666', '1.2 km', 24.305, 91.731),
  emergency('p4', 'Bandarban Model Pharmacy', 'Pharmacy', 'Bohm Para', '+880 1819-222333', '1.9 km', 22.195, 92.216),
  emergency('p5', 'Sylhet City Pharmacy', 'Pharmacy', 'Ambarkhana', '+880 1711-888999', '2.4 km', 24.897, 91.87),
  emergency('pol1', 'Cox’s Bazar Model Police Station', 'Police', 'Bazarghata', '999', '1.7 km', 21.441, 91.98),
  emergency('pol2', 'Kolatoli Tourist Police', 'Police', 'Kolatoli Beach Point', '999', '1.1 km', 21.413, 91.991),
  emergency('pol3', 'Sreemangal Police Station', 'Police', 'College Road', '999', '1.5 km', 24.307, 91.73),
  emergency('pol4', 'Bandarban Sadar Police', 'Police', 'Sadar Road', '999', '2.2 km', 22.195, 92.219),
  emergency('pol5', 'Saint Martin Police Outpost', 'Police', 'Jetty Road', '999', '0.9 km', 20.628, 92.322),
  emergency('fire1', 'Cox’s Bazar Fire Service', 'Fire Station', 'Fire Service Road', '16123', '2.3 km', 21.446, 91.988),
  emergency('fire2', 'Sreemangal Fire Service', 'Fire Station', 'Moulvibazar Road', '16123', '1.9 km', 24.303, 91.733),
  emergency('fire3', 'Bandarban Fire Service', 'Fire Station', 'Ukil Para', '16123', '2.6 km', 22.194, 92.22)
];

export const MOCK_WEATHER = {
  cox: [{ day: 'Wed, Aug 20', icon: '☀️', temp: 31, rain: 10, label: 'Mostly sunny' }, { day: 'Thu, Aug 21', icon: '🌧️', temp: 28, rain: 65, label: 'Showers likely' }, { day: 'Fri, Aug 22', icon: '⛅', temp: 30, rain: 25, label: 'Partly cloudy' }, { day: 'Sat, Aug 23', icon: '☀️', temp: 32, rain: 8, label: 'Bright and warm' }],
  sajek: [{ day: 'Mon, Dec 15', icon: '⛅', temp: 24, rain: 15, label: 'Cool and clear' }, { day: 'Tue, Dec 16', icon: '☀️', temp: 25, rain: 5, label: 'Sunny' }, { day: 'Wed, Dec 17', icon: '🌫️', temp: 21, rain: 20, label: 'Cloudy hills' }],
  default: [{ day: 'Day 1', icon: '☀️', temp: 29, rain: 10, label: 'Mostly sunny' }, { day: 'Day 2', icon: '⛅', temp: 28, rain: 25, label: 'Partly cloudy' }, { day: 'Day 3', icon: '🌧️', temp: 27, rain: 55, label: 'Light rain' }]
};

export const MOCK_CHAT_MESSAGES = [
  { id: 'm1', user: 'Huzaifa', initials: 'HR', time: '09:12', message: 'Should we leave at 8 for Himchari?', color: 'blue' },
  { id: 'm2', user: 'Abrar', initials: 'AH', time: '09:14', message: 'Yes, that gives us time for breakfast on the way.', color: 'amber' },
  { id: 'm3', user: 'Faizul', initials: 'FK', time: '09:22', message: 'I found a seafood place near the beach for dinner.', color: 'purple' },
  { id: 'm4', user: 'AI Assistant', initials: '✦', time: '09:24', message: 'I’ve kept Day 2 flexible because rain probability peaks at 65%.', color: 'teal', ai: true },
  { id: 'm5', user: 'Munzeer', initials: 'MA', time: '10:05', message: 'I can bring the first-aid kit and a power bank.', color: 'rose' },
  { id: 'm6', user: 'Abrar', initials: 'AH', time: '10:12', message: 'Perfect. I’ll handle the hotel check-in.', color: 'amber' },
  { id: 'm7', user: 'Huzaifa', initials: 'HR', time: '10:18', message: 'Do we want the early morning beach slot?', color: 'blue' },
  { id: 'm8', user: 'AI Assistant', initials: '✦', time: '10:19', message: 'Early morning has the lowest heat and the calmest light for photos.', color: 'teal', ai: true },
  { id: 'm9', user: 'Faizul', initials: 'FK', time: '11:01', message: 'Adding that to our shared plan.', color: 'purple' },
  { id: 'm10', user: 'Munzeer', initials: 'MA', time: '11:08', message: 'What is our food budget per person?', color: 'rose' },
  { id: 'm11', user: 'Abrar', initials: 'AH', time: '11:10', message: 'Around ৳1,500 a day should keep us comfortable.', color: 'amber' },
  { id: 'm12', user: 'AI Assistant', initials: '✦', time: '11:11', message: 'With the current plan, you have ৳2,150 of flexible budget remaining.', color: 'teal', ai: true },
  { id: 'm13', user: 'Huzaifa', initials: 'HR', time: '12:40', message: 'Let’s keep the second afternoon open.', color: 'blue' },
  { id: 'm14', user: 'Faizul', initials: 'FK', time: '12:42', message: 'Agreed.', color: 'purple' },
  { id: 'm15', user: 'Munzeer', initials: 'MA', time: '13:05', message: 'I’ll share the packing checklist tonight.', color: 'rose' },
  { id: 'm16', user: 'Abrar', initials: 'AH', time: '13:16', message: 'Thanks everyone!', color: 'amber' },
  { id: 'm17', user: 'AI Assistant', initials: '✦', time: '13:20', message: 'Tip: pack a light rain shell even on the sunny days.', color: 'teal', ai: true },
  { id: 'm18', user: 'Huzaifa', initials: 'HR', time: '14:02', message: 'Noted.', color: 'blue' },
  { id: 'm19', user: 'Faizul', initials: 'FK', time: '14:10', message: 'The itinerary looks nicely balanced.', color: 'purple' },
  { id: 'm20', user: 'Munzeer', initials: 'MA', time: '14:18', message: 'Can’t wait for the sunset!', color: 'rose' }
];

export const MOCK_ITINERARY = [
  { day: 'Day 1', date: 'Wed, Aug 20', items: [{ time: '09:00', title: 'Hotel check-in', detail: 'Sayeman Beach Resort', location: 'Kolatoli Road', duration: '30 min', cost: 0, category: 'stay', type: 'stay', notes: 'Leave bags with reception.' }, { time: '11:00', title: 'Cox’s Bazar Beach', detail: 'Morning walk and swim', location: 'Laboni Point', duration: '2 hrs', cost: 0, category: 'beach', type: 'activity', notes: 'Best light before noon.' }, { time: '13:00', title: 'Lunch at Mermaid Cafe', detail: 'Fresh local seafood', location: 'Marine Drive', duration: '1 hr', cost: 900, category: 'food', type: 'food', notes: 'Reserve a table for the group.' }, { time: '15:00', title: 'Himchari National Park', detail: 'Waterfall and coastal views', location: 'Himchari', duration: '3 hrs', cost: 300, category: 'nature', type: 'activity', notes: 'Wear shoes with grip.' }, { time: '18:00', title: 'Sunset at Inani', detail: 'Golden hour photography', location: 'Inani Beach', duration: '1 hr', cost: 0, category: 'photography', type: 'activity', notes: 'Keep a light layer for the ride back.' }, { time: '20:00', title: 'Group dinner', detail: 'Rupchanda BBQ', location: 'Jhaubon', duration: '1.5 hrs', cost: 1200, category: 'food', type: 'food', notes: 'Split the bill in Budget.' }] },
  { day: 'Day 2', date: 'Thu, Aug 21', items: [{ time: '09:30', title: 'Slow breakfast', detail: 'Flexible morning buffer', location: 'Sayeman Beach Resort', duration: '1 hr', cost: 450, category: 'food', type: 'food', notes: 'Keep the morning open for rain.' }, { time: '11:30', title: 'Marine Drive', detail: 'Scenic coastal transfer', location: 'Marine Drive', duration: '2 hrs', cost: 500, category: 'transport', type: 'activity', notes: 'Stop for photos if skies clear.' }, { time: '15:00', title: 'Rain-friendly cafe time', detail: 'Weather-aware suggestion', location: 'Kolatoli', duration: '2 hrs', cost: 600, category: 'weather', type: 'weather', notes: 'Backup for the beach window.' }, { time: '19:00', title: 'Trip chat & free evening', detail: 'Keep the plan flexible', location: 'Hotel lounge', duration: 'Open', cost: 0, category: 'free', type: 'free', notes: 'Choose dinner together.' }] },
  { day: 'Day 3', date: 'Fri, Aug 22', items: [{ time: '07:00', title: 'Beach sunrise', detail: 'Move from Day 2 for better weather', location: 'Cox’s Bazar Beach', duration: '2 hrs', cost: 0, category: 'weather', type: 'weather', notes: 'Weather-aware move from Day 2.' }, { time: '10:30', title: 'Inani Beach', detail: 'Quiet shore and photos', location: 'Inani Beach', duration: '2 hrs', cost: 0, category: 'beach', type: 'activity', notes: 'Bring water and sun protection.' }, { time: '14:00', title: 'Local market', detail: 'Souvenirs and snacks', location: 'Burmese Market', duration: '1.5 hrs', cost: 700, category: 'shopping', type: 'activity', notes: 'Leave space in your bag.' }, { time: '18:30', title: 'Farewell sunset', detail: 'Cox’s Bazar sea point', location: 'Laboni Point', duration: '1 hr', cost: 0, category: 'photography', type: 'activity', notes: 'Group photo before dinner.' }] }
];

export const MOCK_PLAN_OPTIONS = [
  { id: 'budget', name: 'Budget Explorer', match: 89, total: 14200, hotel: 'Long Beach Hotel', activities: 6, transport: 'Shared microbus', food: 'Local favourites', comfort: 'Simple & social', pros: ['Lowest total cost', 'More local food stops'], cons: ['One longer transfer day'] },
  { id: 'balanced', name: 'Balanced Experience', match: 94, total: 18500, hotel: 'Sayeman Beach Resort', activities: 7, transport: 'Private AC microbus', food: 'Curated local mix', comfort: 'Comfortable', recommended: true, pros: ['Comfortable hotel', 'Weather-aware pacing', 'Good food options'], cons: ['Slightly higher stay cost'] },
  { id: 'premium', name: 'Premium Relaxation', match: 91, total: 28600, hotel: 'The Palace Beach Club', activities: 5, transport: 'Private SUV', food: 'Chef-led dining', comfort: 'High comfort', pros: ['Maximum flexibility', 'Best downtime'], cons: ['Fewer activities', 'Premium pricing'] }
];

export const MOCK_DESTINATION_RECOMMENDATIONS = [
  { ...DESTINATIONS[1], match: 94, reason: 'Your hiking interests, four-day window and mid-range budget align with the valley’s guided trails.' },
  { ...DESTINATIONS[0], match: 91, reason: 'A strong fit for group-friendly food, easy transfers and a relaxed beach pace.' },
  { ...DESTINATIONS[3], match: 88, reason: 'Great adventure value if your group is comfortable with longer hill transfers.' },
  { ...DESTINATIONS[4], match: 84, reason: 'A flexible nature and food itinerary with reliable transport connections.' }
];

export const MOCK_AI_SUMMARY = {
  headline: 'Your trip is well balanced.',
  budget: 'Within target',
  weather: 'Mostly favorable',
  intensity: 'Moderate',
  activities: 7,
  insights: ['Visit the beach early morning for cooler weather.', 'Group nearby attractions to reduce transfer time.', 'Keep Day 2 flexible because of rain probability.', 'Your current budget is sufficient.', 'Local restaurants can reduce food costs.']
};
