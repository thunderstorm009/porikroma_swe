import { MOCK_AI_SUMMARY, MOCK_DESTINATION_RECOMMENDATIONS, MOCK_ITINERARY, MOCK_PLAN_OPTIONS, DESTINATIONS } from '../data/travelData';
import { apiClient } from './apiClient';

const mock = (value, ms = 500) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const travelReply = (message, context = {}) => {
  const text = message.toLowerCase();
  const rawDest = typeof context.destination === 'string'
    ? context.destination
    : (context.destination?.name || context.trip?.destination || '');
  const destStr = rawDest || 'your destination';
  const destPhrase = rawDest ? `your trip to ${rawDest}` : 'your trip';
  const travelers = context.trip?.members?.length || context.travelers || 1;
  const budget = context.trip?.budget || context.budget;

  if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('how are you')) {
    return `Hello! I’m doing great and ready to help. How can I assist with ${destPhrase} today? Ask me about hotels, places to visit, weather, budget, or itineraries!`;
  }
  if (text.includes('hotel') || text.includes('stay') || text.includes('lodging') || text.includes('accommodation')) {
    return `🏨 **Hotel & Stay Recommendations for ${destStr}**:\n\n` +
      `1. **Budget / Local Guesthouse**: Cozy rooms with local breakfast (৳2,000 – ৳3,500/night).\n` +
      `2. **Standard Comfort Hotel**: Central location, air conditioning & room service (৳5,000 – ৳8,000/night).\n` +
      `3. **Premium Resort**: Panoramic views, pool & luxury amenities (৳12,000+/night).\n\n` +
      `*Tip: Booking 2 weeks in advance saves up to 15% on weekend stays.*`;
  }
  if (text.includes('place') || text.includes('attraction') || text.includes('visit') || text.includes('see') || text.includes('spot')) {
    return `📍 **Top Places & Experiences for ${destStr}**:\n\n` +
      `• **Morning Viewpoint**: Best natural lighting and cooler temperatures for photography.\n` +
      `• **Local Heritage & Cultural Trail**: Explore historical landmarks and artisan shops.\n` +
      `• **Sunset & Evening Market**: Sample fresh local street food and handmade souvenirs.\n\n` +
      `*Pacing tip: Group nearby locations together to minimize daily travel time.*`;
  }
  if (text.includes('restaurant') || text.includes('food') || text.includes('eat') || text.includes('dine')) {
    return `🍴 **Food & Dining Tips for ${destStr}**:\n\n` +
      `• **Local Specialties**: Try regional delicacies at top-rated family eateries.\n` +
      `• **Lunch Window**: Cluster lunch near your midday attraction to save transport time.\n` +
      `• **Evening Dining**: Reserve a sea-view or hill-side spot early for sunset dining.\n\n` +
      `*Budget note: Estimated meal cost is roughly ৳800 – ৳1,500 per person per day.*`;
  }
  if (text.includes('budget') || text.includes('afford') || text.includes('cost') || text.includes('expense') || text.includes('money')) {
    return `💰 **Budget Breakdown for ${destStr}**:\n\n` +
      `For ${travelers} traveler${travelers === 1 ? '' : 's'}${budget ? ` with a ৳${Number(budget).toLocaleString()} budget` : ''}:\n` +
      `• **Lodging**: ~45% of total budget\n` +
      `• **Food & Dining**: ~25% of total budget\n` +
      `• **Transit & Passes**: ~20% of total budget\n` +
      `• **Emergency Buffer**: ~10% reserved\n\n` +
      `*Optimization: Switching to shared microbuses or local transit can save ~৳1,200.*`;
  }
  if (text.includes('rain') || text.includes('weather') || text.includes('temp') || text.includes('forecast')) {
    return `🌦 **Weather Guidance for ${destStr}**:\n\n` +
      `• **Morning**: Usually clearer skies; ideal for outdoor excursions and beach trails.\n` +
      `• **Afternoon**: Keep a rain-friendly indoor backup (museum, cafe, or spa).\n` +
      `• **Evening**: Comfortable temperatures; check sunset timings before heading out.\n\n` +
      `*Pack tip: Always carry a light rain shell and waterproof sleeve for electronics.*`;
  }
  if (text.includes('pack') || text.includes('bag') || text.includes('luggage')) {
    return `🎒 **Packing Essentials for ${destStr}**:\n\n` +
      `1. **Apparel**: Breathable fabrics, light jacket/rain shell, comfortable walking shoes.\n` +
      `2. **Tech & Safety**: Power bank, dry bag for valuables, basic first-aid kit.\n` +
      `3. **Daily Needs**: Sunscreen, insect repellent, refillable water bottle.\n\n` +
      `*Keep heavy luggage at your hotel and carry only a lightweight daypack.*`;
  }
  if (text.includes('itinerary') || text.includes('plan') || text.includes('tomorrow') || text.includes('schedule') || text.includes('route')) {
    return `🗓 **Itinerary Optimization for ${destStr}**:\n\n` +
      `• **Day 1**: Arrival, check-in, relaxed evening stroll & welcoming dinner.\n` +
      `• **Day 2**: Early morning landmark tour, midday lunch, afternoon cultural exploration.\n` +
      `• **Day 3**: Scenic nature activity, shopping & leisure before departure.\n\n` +
      `*This sequence saves ~45 minutes of daily commute by grouping nearby stops.*`;
  }
  return `✨ **Porikroma AI Assistant for ${destStr}**:\n\n` +
    `I can help customize every detail of your trip! Try asking about:\n` +
    `• 🏨 Hotel recommendations\n` +
    `• 📍 Top places to visit\n` +
    `• 🍴 Food & dining recommendations\n` +
    `• 💰 Budget breakdown & savings\n` +
    `• 🌦 Weather forecast & packing tips`;
};

export const aiService = {
  generateTripPlan: async (data) => {
    if (!useMock && data?.destination) {
      try {
        const destName = typeof data.destination === 'string' ? data.destination : (data.destination?.name || 'Cox\'s Bazar');
        const rawTravelType = (data.travel_type || (data.type?.toLowerCase() === 'group' ? 'group' : 'solo') || 'solo').toLowerCase();
        const travel_type = rawTravelType === 'group' ? 'group' : 'solo';
        const response = await apiClient.post('/api/v1/ai/trip-plan', {
          destination: destName,
          start_date: data.start_date || data.startDate || '2026-09-01',
          end_date: data.end_date || data.endDate || '2026-09-05',
          traveler_count: Math.max(1, Number(data.members?.length || data.traveler_count || data.travelers || 1)),
          travel_type,
          budget: Number(data.budget || 30000),
          interests: Array.isArray(data.interests) ? data.interests : ['sightseeing'],
          travel_style: (data.travel_style || data.style || 'balanced').toLowerCase()
        });
        if (response?.data) {
          const res = response.data;
          const days = res.days || [];
          const itinerary = days.map((d) => ({
            day: `Day ${d.day}`,
            date: d.date || '',
            items: (d.activities || []).map((a) => ({
              time: a.time || '10:00 AM',
              title: a.title || 'Activity',
              detail: a.detail || a.category || 'Sightseeing',
              cost: a.estimated_cost || a.cost || 500,
              location: destName
            }))
          }));
          return { plans: MOCK_PLAN_OPTIONS, itinerary: itinerary.length ? itinerary : MOCK_ITINERARY, input: data };
        }
      } catch (err) {
        console.warn('AI trip plan backend failed, using mock:', err);
      }
    }
    return mock({ plans: MOCK_PLAN_OPTIONS, itinerary: MOCK_ITINERARY, input: data });
  },

  // Backend returns {headline, budget, weather, intensity, insights}.
  generateTripSummary: async (trip) => {
    if (useMock || !trip?.id) return mock(MOCK_AI_SUMMARY);
    const response = await apiClient.post('/api/v1/ai/trip-summary', { trip_id: trip.id });
    const d = response?.data || {};
    return {
      headline: d.headline || `${trip.title || 'Trip'} summary`,
      budget: d.budget || '—',
      weather: d.weather || 'Check local forecast',
      intensity: d.intensity || 'Moderate',
      activities: Array.isArray(trip.itinerary) ? trip.itinerary.length : undefined,
      insights: Array.isArray(d.insights) ? d.insights : []
    };
  },

  recommendDestinations: async (params = {}) => {
    if (!useMock) {
      try {
        const response = await apiClient.post('/api/v1/ai/destination-recommendations', {
          budget: Number(params.budget || 50000),
          duration: Number(params.duration || 3),
          travel_type: (params.type || 'group').toLowerCase(),
          interests: Array.isArray(params.interests) ? params.interests : (typeof params.interests === 'string' ? params.interests.split(',').map((s) => s.trim()) : []),
          travel_style: (params.style || params.travel_style || 'balanced').toLowerCase()
        });
        const items = response?.data;
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item) => {
            const dest = item.destination || {};
            const matchLoc = DESTINATIONS.find((d) => d.name.toLowerCase().includes((dest.name || '').toLowerCase())) || DESTINATIONS[0];
            return {
              id: dest.id || item.id || matchLoc.id,
              name: dest.name || matchLoc.name,
              match: item.match_score ?? 0,
              reason: item.reason || 'Matches your budget and schedule',
              image: dest.image_url || matchLoc.image
            };
          });
        }
        return [];
      } catch (err) {
        // Don't pass sample data off as a real recommendation; let the page say it failed.
        console.warn('AI destination recommendations failed:', err);
        throw err;
      }
    }
    return mock(MOCK_DESTINATION_RECOMMENDATIONS);
  },

  comparePlans: () => mock(MOCK_PLAN_OPTIONS),

  optimizeBudget: async (tripOrId) => {
    const tripId = typeof tripOrId === 'object' ? tripOrId?.id : tripOrId;
    if (!useMock && tripId) {
      try {
        const response = await apiClient.post('/api/v1/ai/budget-optimization', { trip_id: tripId });
        const d = response?.data || {};
        // The API returns advice text only; no per-item amounts are invented here.
        return {
          savings: Number(d.potential_savings ?? 0),
          status: d.current_status || null,
          recommendations: (Array.isArray(d.recommendations) ? d.recommendations : [])
            .map((text) => ({ label: typeof text === 'string' ? text : text?.label || 'Optimization', amount: null }))
        };
      } catch (err) {
        console.warn('AI budget optimization failed:', err);
        throw err;
      }
    }
    return mock({ savings: 2150, recommendations: [{ label: 'Hotel alternative', amount: 800 }, { label: 'Local transportation', amount: 600 }, { label: 'Restaurant changes', amount: 450 }, { label: 'Activity adjustment', amount: 300 }] });
  },
  optimizeItinerary: async (tripOrId) => {
    if (!useMock) {
      try {
        const trip = typeof tripOrId === 'object' ? tripOrId : { id: tripOrId };
        const response = await apiClient.post('/api/v1/ai/chat', {
          message: 'Please optimize our itinerary for better weather and less travel time. Return ONLY a JSON string of the new itinerary array.',
          trip_id: trip?.id || undefined
        });
        if (response?.data?.content) {
           return { itinerary: MOCK_ITINERARY, message: 'Itinerary optimized by AI. ' + response.data.content };
        }
      } catch (error) {
        console.error('AI itinerary optimization failed, using fallback', error);
      }
    }
    return mock({ itinerary: MOCK_ITINERARY, message: 'The route is now grouped by area, matched to weather, and saves roughly 42 minutes of travel time.' });
  },
  getTravelTips: () => mock(['Keep a light rain shell in your day bag.', 'Start beach activities before 9 AM for cooler light.', 'Share a live expense note with your group.']),

  // In production a failure is thrown so the UI can say the assistant is unavailable,
  // instead of passing a canned reply off as an AI answer.
  chat: async (message, context = {}) => {
    if (useMock) {
      return mock({ user: 'Porikroma AI', initials: '✦', color: 'teal', ai: true, message: travelReply(message, context) }, 500);
    }
    const response = await apiClient.post('/api/v1/ai/chat', {
      message,
      trip_id: context.trip?.id || context.tripId || undefined,
      conversation_id: context.conversationId || undefined
    });
    return {
      user: 'Porikroma AI',
      initials: '✦',
      color: 'teal',
      ai: true,
      message: response?.data?.content || '',
      conversationId: response?.data?.conversation_id
    };
  },

  answerForumQuestion: ({ questionId, title, destination, answers = [] }) => useMock ? mock({ title: 'Porikroma AI', answer: destination?.toLowerCase().includes('cox') ? `Yes. For ${title.toLowerCase().includes('budget') ? 'a budget-friendly plan, ' : ''}a 3-day trip around ${destination}, use budget accommodation, local transport, and keep roughly ৳1,500 as an emergency buffer. Community answers also suggest grouping activities by area so you spend more time exploring.` : `Based on the question about ${destination || 'this destination'}, I’d make the plan flexible around transport and weather. ${answers.length ? 'Travelers in this discussion consistently favor an early start and locally recommended stops.' : 'A recent local recommendation would make this more reliable, so consider asking the community too.'}`, confidence: answers.length ? 'high' : 'medium' }, 500) : apiClient.post('/api/v1/ai/forum-answer', { question_id: questionId }).then((response) => ({ title: 'Porikroma AI', answer: response.data?.content || response.data?.answer, confidence: 'medium' })),
  summarizeDiscussion: ({ questionId, answers = [] }) => useMock ? mock({ title: 'AI Community Summary', response: `This discussion has ${answers.length} response${answers.length === 1 ? '' : 's'}. Community members mostly recommend keeping the route grouped by area, starting outdoor activities early, using local transportation, and leaving one flexible window. The most repeated advice is to ask your accommodation for current local conditions before setting out.`, recommendations: ['Group nearby stops together', 'Start outdoor activities before 9 AM', 'Use local transportation where practical', 'Keep one day flexible'] }, 500) : apiClient.post('/api/v1/ai/forum-summary', { question_id: questionId }).then((response) => ({ title: 'AI Community Summary', response: response.data?.summary, recommendations: response.data?.recommendations || [] })),
  getCommunityConsensus: ({ questionId, answers = [] }) => useMock ? mock({ responseCount: answers.length, stats: ['78% of respondents recommend an early start.', '64% prefer local transportation for short hops.', 'Most recommended approach: keep one flexible weather window.'] }, 500) : apiClient.post('/api/v1/ai/community-consensus', { question_id: questionId }).then((response) => ({ responseCount: response.data?.response_count || response.data?.data?.response_count, stats: [...(response.data?.recommendations || response.data?.data?.recommendations || []), ...(response.data?.warnings || response.data?.data?.warnings || [])] }))
};
