// Frontend-only community dataset. IDs mirror the shape expected by the future API.
export const FORUM_CATEGORIES = [
  'All', 'Destinations', 'Hotels', 'Restaurants', 'Transportation', 'Budget',
  'Itinerary', 'Safety', 'Solo Travel', 'Group Travel', 'Food', 'Photography'
];

export const FORUM_USERS = [
  { id: 'u1', name: 'Sarah Jenkins', role: 'Explorer', initials: 'SJ', color: 'teal', contributions: 23, helpfulAnswers: 48, favorites: ['Sajek', "Cox's Bazar", 'Bandarban'] },
  { id: 'u2', name: 'Rahim Ahmed', role: 'Traveler', initials: 'RA', color: 'amber', contributions: 31, helpfulAnswers: 67, favorites: ['Sajek', 'Sylhet', 'Rangamati'] },
  { id: 'u3', name: 'Nusrat Jahan', role: 'Photographer', initials: 'NJ', color: 'purple', contributions: 18, helpfulAnswers: 39, favorites: ['Bandarban', 'Sreemangal'] },
  { id: 'u4', name: 'Tanvir Hossain', role: 'Explorer', initials: 'TH', color: 'blue', contributions: 27, helpfulAnswers: 54, favorites: ["Cox's Bazar", 'Rangamati'] },
  { id: 'u5', name: 'Sadia Rahman', role: 'Food traveler', initials: 'SR', color: 'rose', contributions: 15, helpfulAnswers: 34, favorites: ['Sylhet', 'Dhaka'] },
  { id: 'u6', name: 'Farhan Ahmed', role: 'Trail guide', initials: 'FA', color: 'slate', contributions: 42, helpfulAnswers: 83, favorites: ['Bandarban', 'Sajek'] },
  { id: 'u7', name: 'Anika Chowdhury', role: 'Traveler', initials: 'AC', color: 'teal', contributions: 12, helpfulAnswers: 21, favorites: ['Sreemangal', "Cox's Bazar"] },
  { id: 'u8', name: 'Kazi Arafat', role: 'Explorer', initials: 'KA', color: 'amber', contributions: 20, helpfulAnswers: 44, favorites: ['Sajek', 'Rangamati'] },
  { id: 'u9', name: 'Mehedi Hasan', role: 'Budget traveler', initials: 'MH', color: 'blue', contributions: 36, helpfulAnswers: 71, favorites: ['Dhaka', 'Sylhet'] },
  { id: 'u10', name: 'Rafiq Islam', role: 'Traveler', initials: 'RI', color: 'purple', contributions: 17, helpfulAnswers: 29, favorites: ["Cox's Bazar", 'Bandarban'] },
  { id: 'u11', name: 'Maliha Noor', role: 'Photographer', initials: 'MN', color: 'rose', contributions: 25, helpfulAnswers: 51, favorites: ['Sajek', 'Sreemangal'] },
  { id: 'u12', name: 'Shakib Hasan', role: 'Explorer', initials: 'SH', color: 'slate', contributions: 14, helpfulAnswers: 26, favorites: ['Rangamati', 'Sylhet'] }
];

const questionSeeds = [
  ["Best places to visit in Sajek?", "I'm visiting Sajek for 3 days. What places should I visit?", 'Sajek Valley', 'Destinations', ['Sajek', 'Nature', 'Photography'], 'u1', 37, 14],
  ["Is Cox's Bazar worth visiting in December?", 'I have three days in December and want a mix of beach time and local food.', "Cox's Bazar", 'Destinations', ["Cox's Bazar", 'Beach', 'December'], 'u4', 12, 5],
  ['Best restaurants near Bandarban?', 'Looking for good local food after a day around Nilgiri. Prefer places with a relaxed atmosphere.', 'Bandarban', 'Restaurants', ['Bandarban', 'Food', 'Local'], 'u5', 0, 0],
  ['How do I plan a 3-day Cox’s Bazar trip on ৳15,000?', 'Is it possible with budget accommodation and local transport?', "Cox's Bazar", 'Budget', ["Cox's Bazar", 'Budget', 'Itinerary'], 'u9', 24, 9],
  ['Sajek or Bandarban for first-time hikers?', 'Which destination is more welcoming for someone with limited hill trekking experience?', 'Sajek Valley', 'Solo Travel', ['Sajek', 'Bandarban', 'Hiking'], 'u7', 18, 8],
  ['Best time to visit Lawachara?', 'I want to see wildlife and walk the forest trails without heavy rain.', 'Sreemangal', 'Destinations', ['Sreemangal', 'Nature', 'Weather'], 'u3', 16, 6],
  ['Is the train to Sylhet comfortable overnight?', 'Would you choose the train or a bus from Dhaka for a family trip?', 'Sylhet', 'Transportation', ['Sylhet', 'Transport', 'Family'], 'u2', 9, 4],
  ['Where should I stay in Rangamati?', 'Looking for a calm lakeside stay for two nights with easy boat access.', 'Rangamati', 'Hotels', ['Rangamati', 'Hotels', 'Lake'], 'u12', 11, 3],
  ['A first-timer’s food route through Old Dhaka', 'Which stops can I fit into a half day without rushing?', 'Dhaka', 'Food', ['Dhaka', 'Food', 'Culture'], 'u5', 20, 7],
  ['Safe solo travel tips for Bandarban', 'I am planning my first solo hill trip. What should I prepare ahead?', 'Bandarban', 'Safety', ['Bandarban', 'Solo Travel', 'Safety'], 'u1', 29, 13],
  ['Photography spots around Sajek at sunrise', 'I will carry a light camera and would love a practical morning route.', 'Sajek Valley', 'Photography', ['Sajek', 'Photography', 'Sunrise'], 'u11', 22, 10],
  ['Affordable hotels near Kolatoli beach?', 'Any clean stays that work well for two people and are walkable to the beach?', "Cox's Bazar", 'Hotels', ["Cox's Bazar", 'Hotels', 'Budget'], 'u10', 15, 6],
  ['Is a microbus worth it for a group trip?', 'There will be six of us traveling from Dhaka to Cox’s Bazar.', "Cox's Bazar", 'Transportation', ['Transport', 'Group Travel', "Cox's Bazar"], 'u4', 13, 5],
  ['Quiet tea garden stays in Sreemangal', 'I’m looking for somewhere peaceful with access to the gardens and Lawachara.', 'Sreemangal', 'Hotels', ['Sreemangal', 'Hotels', 'Nature'], 'u3', 8, 2],
  ['Rainy-season itinerary for Sylhet', 'What can we do around Ratargul and Jaflong if the forecast keeps changing?', 'Sylhet', 'Itinerary', ['Sylhet', 'Itinerary', 'Rain'], 'u2', 17, 6],
  ['What should I pack for a 4-day hill trip?', 'Trying to keep my backpack light for Sajek and Bandarban.', 'Bandarban', 'Safety', ['Packing', 'Bandarban', 'Sajek'], 'u6', 31, 11],
  ['Rangamati boat tour price guide', 'What is a reasonable shared boat price around Kaptai Lake?', 'Rangamati', 'Budget', ['Rangamati', 'Budget', 'Boats'], 'u8', 7, 2],
  ['Best cafes for remote work in Dhaka?', 'I need reliable Wi-Fi, plugs, and a quiet table for an afternoon.', 'Dhaka', 'Restaurants', ['Dhaka', 'Cafes', 'Work'], 'u9', 10, 4],
  ['Family-friendly things to do in Cox’s Bazar', 'We have young children and one full day between beach visits.', "Cox's Bazar", 'Group Travel', ["Cox's Bazar", 'Family', 'Activities'], 'u7', 14, 5],
  ['Is Nilgiri doable as a day trip?', 'We are staying in Bandarban town and want to know how much time to allow.', 'Bandarban', 'Itinerary', ['Bandarban', 'Nilgiri', 'Itinerary'], 'u10', 19, 8]
];

export const FORUM_QUESTIONS = questionSeeds.map((seed, index) => ({
  id: `question_${String(index + 1).padStart(3, '0')}`,
  authorId: seed[5], title: seed[0], content: seed[1], destination: seed[2], category: seed[3], tags: seed[4],
  answerIds: Array.from({ length: 2 }, (_, answerIndex) => `answer_${String(index * 2 + answerIndex + 1).padStart(3, '0')}`),
  likes: seed[6], views: 120 + index * 37, createdAt: `2026-08-${String(14 - (index % 12)).padStart(2, '0')}T${String(9 + (index % 8)).padStart(2, '0')}:30:00Z`,
  followed: index === 0, bookmarked: false
}));

const answerTemplates = [
  'Konglak Hill is definitely worth visiting. Start early, then keep the afternoon for Ruilui Para and a slow local lunch.',
  'I would group the nearby stops together so you spend less time on the road. A local guide can also help with the last stretch.',
  'We did this last month and it was comfortable. Keep one flexible morning because hill weather can change quickly.',
  'For a budget version, choose a guesthouse, share transport, and leave some room for local food rather than pre-booking every activity.',
  'The best experience came from going before 9 AM. It was cooler, quieter, and much better for photos.',
  'Ask your hotel to arrange a trusted local driver and confirm the return time before leaving town.',
  'I would choose the train if you can get a cabin; it is slower but gives you more space for a family trip.',
  'There are several simple local restaurants nearby. Look for the busy ones at lunch and ask what is fresh that day.'
];

export const FORUM_ANSWERS = FORUM_QUESTIONS.flatMap((question, questionIndex) => question.answerIds.map((id, answerIndex) => ({
  id, questionId: question.id, authorId: FORUM_USERS[(questionIndex + answerIndex + 1) % FORUM_USERS.length].id,
  content: answerTemplates[(questionIndex + answerIndex) % answerTemplates.length], likes: Math.max(3, 18 - questionIndex + answerIndex * 4),
  createdAt: `2026-08-${String(13 - (questionIndex % 10)).padStart(2, '0')}T${String(10 + answerIndex).padStart(2, '0')}:00:00Z`, replyIds: []
})));

export const FORUM_REPLIES = FORUM_ANSWERS.slice(0, 15).flatMap((answer, index) => [
  { id: `reply_${String(index * 2 + 1).padStart(3, '0')}`, answerId: answer.id, authorId: 'u1', content: index % 2 ? 'How early would you suggest going?' : 'Does the route work for a small group?', createdAt: '2026-08-13T15:20:00Z' },
  { id: `reply_${String(index * 2 + 2).padStart(3, '0')}`, answerId: answer.id, authorId: answer.authorId, content: index % 2 ? 'Around 6 AM is best for the cooler air.' : 'That is helpful, thank you. I will add it to my plan.', createdAt: '2026-08-13T16:05:00Z' }
]);

FORUM_ANSWERS.forEach((answer) => { answer.replyIds = FORUM_REPLIES.filter((reply) => reply.answerId === answer.id).map((reply) => reply.id); });

export const FORUM_TAGS = [...new Set(FORUM_QUESTIONS.flatMap((question) => question.tags))];
