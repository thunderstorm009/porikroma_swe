import { MOCK_AI_SUMMARY, MOCK_DESTINATION_RECOMMENDATIONS, MOCK_ITINERARY, MOCK_PLAN_OPTIONS } from '../data/travelData';
import { apiClient } from './apiClient';

const mock = (value, ms = 700) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const formatBudget = (value) => `৳${Number(value || 0).toLocaleString()}`;

const travelReply = (message, context = {}) => {
  const text = message.toLowerCase();
  const destination = context.destination?.name || context.trip?.destination || 'your destination';
  const travelers = context.trip?.members?.length || context.travelers || 1;
  const budget = context.trip?.budget || context.budget;
  if (text.includes('budget') || text.includes('afford') || text.includes('cost')) return `For ${travelers} traveler${travelers === 1 ? '' : 's'} in ${destination}, your current mock plan has room to optimize. ${budget ? `With a ceiling of ${formatBudget(budget)},` : 'For a balanced plan,'} I would protect transport and lodging first, then keep a small emergency buffer. Local transport could save about ৳600.`;
  if (text.includes('rain') || text.includes('weather')) return `For ${destination}, keep the most weather-sensitive activity flexible. Start outdoor plans in the clearer morning, then use a cafe, museum, or local food stop as the backup window.`;
  if (text.includes('pack')) return `Pack light layers, a compact rain shell, comfortable walking shoes, sunscreen, a refillable bottle, and a small first-aid kit. For hill routes, keep valuables in a dry bag.`;
  if (text.includes('restaurant') || text.includes('food') || text.includes('eat')) return `I’d cluster a local lunch near your daytime route in ${destination}, ask what is fresh that day, and keep one well-reviewed dinner reservation as the reliable anchor.`;
  if (text.includes('itinerary') || text.includes('plan') || text.includes('tomorrow')) return `Since you have ${travelers} traveler${travelers === 1 ? '' : 's'} in ${destination}, I’d group nearby stops into one easy day, leave a flexible weather window, and avoid crossing town between every activity.`;
  return `✨ For your ${destination} trip, I’d keep the next move simple: choose one nearby area, protect time for local food, and leave a little breathing room for the group. I can also help with budget, weather, packing, or itinerary trade-offs.`;
};

export const aiService = {
  generateTripPlan: (data) => mock({ plans: MOCK_PLAN_OPTIONS, itinerary: MOCK_ITINERARY, input: data }),
  generateTripSummary: () => mock(MOCK_AI_SUMMARY),
  recommendDestinations: () => mock(MOCK_DESTINATION_RECOMMENDATIONS),
  comparePlans: () => mock(MOCK_PLAN_OPTIONS),
  optimizeBudget: () => mock({ savings: 2150, recommendations: [{ label: 'Hotel alternative', amount: 800 }, { label: 'Local transportation', amount: 600 }, { label: 'Restaurant changes', amount: 450 }, { label: 'Activity adjustment', amount: 300 }] }),
  optimizeItinerary: () => mock({ itinerary: MOCK_ITINERARY, message: 'The route is now grouped by area, matched to weather, and saves roughly 42 minutes of travel time.' }),
  getTravelTips: () => mock(['Keep a light rain shell in your day bag.', 'Start beach activities before 9 AM for cooler light.', 'Share a live expense note with your group.']),
  chat: (message, context = {}) => mock({ user: 'Porikroma AI', initials: '✦', color: 'teal', ai: true, message: travelReply(message, context) }, 620),
  answerForumQuestion: ({ questionId, title, destination, answers = [] }) => useMock ? mock({ title: 'Porikroma AI', answer: destination?.toLowerCase().includes('cox') ? `Yes. For ${title.toLowerCase().includes('budget') ? 'a budget-friendly plan, ' : ''}a 3-day trip around ${destination}, use budget accommodation, local transport, and keep roughly ৳1,500 as an emergency buffer. Community answers also suggest grouping activities by area so you spend more time exploring.` : `Based on the question about ${destination || 'this destination'}, I’d make the plan flexible around transport and weather. ${answers.length ? 'Travelers in this discussion consistently favor an early start and locally recommended stops.' : 'A recent local recommendation would make this more reliable, so consider asking the community too.'}`, confidence: answers.length ? 'high' : 'medium' }, 720) : apiClient.post('/api/v1/ai/forum-answer', { question_id: questionId }).then((response) => ({ title: 'Porikroma AI', answer: response.data.content, confidence: 'medium' })),
  summarizeDiscussion: ({ questionId, answers = [] }) => useMock ? mock({ title: 'AI Community Summary', response: `This discussion has ${answers.length} response${answers.length === 1 ? '' : 's'}. Community members mostly recommend keeping the route grouped by area, starting outdoor activities early, using local transportation, and leaving one flexible window. The most repeated advice is to ask your accommodation for current local conditions before setting out.`, recommendations: ['Group nearby stops together', 'Start outdoor activities before 9 AM', 'Use local transportation where practical', 'Keep one day flexible'] }, 720) : apiClient.post('/api/v1/ai/forum-summary', { question_id: questionId }).then((response) => ({ title: 'AI Community Summary', response: response.data.summary, recommendations: response.data.recommendations || [] })),
  getCommunityConsensus: ({ questionId, answers = [] }) => useMock ? mock({ responseCount: answers.length, stats: ['78% of respondents recommend an early start.', '64% prefer local transportation for short hops.', 'Most recommended approach: keep one flexible weather window.'] }, 520) : apiClient.post('/api/v1/ai/community-consensus', { question_id: questionId }).then((response) => ({ responseCount: response.data.response_count, stats: [...(response.data.recommendations || []), ...(response.data.warnings || [])] }))
};
