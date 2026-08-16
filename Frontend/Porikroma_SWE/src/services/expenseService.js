import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const toApiCategory = { Food: 'food', Transport: 'transport', Lodging: 'accommodation', Activities: 'activity', Activity: 'activity', Shopping: 'shopping', Emergency: 'emergency', Other: 'other' };
const fromApiCategory = { food: 'Food', transport: 'Transport', accommodation: 'Lodging', activity: 'Activities', shopping: 'Other', emergency: 'Other', other: 'Other' };

const mapExpense = (item) => ({
  id: item.id,
  tripId: item.trip_id,
  userId: item.user_id,
  date: item.expense_date,
  description: item.description,
  category: fromApiCategory[item.category] || 'Other',
  amount: Number(item.amount),
  month: new Date(`${item.expense_date}T00:00:00`).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  paidBy: item.user ? {
    id: item.user.id,
    name: item.user.full_name || item.user.username || 'Traveler',
    initial: (item.user.full_name || item.user.username || 'T')[0].toUpperCase(),
    bg: 'bg-teal-primary/20 text-teal-primary'
  } : null
});

export const expenseService = {
  list: (tripId) => useMock ? Promise.resolve([]) : apiClient.get(`/api/v1/trips/${tripId}/expenses`).then((response) => (response.data || []).map(mapExpense)),
  create: (tripId, input) => useMock ? Promise.resolve({ ...input, id: `mock-${Date.now()}` }) : apiClient.post(`/api/v1/trips/${tripId}/expenses`, {
    category: toApiCategory[input.category] || 'other',
    description: input.description.trim(),
    amount: Number(input.amount),
    expense_date: input.date
  }).then((response) => mapExpense(response.data)),
  update: (expenseId, input) => useMock ? Promise.resolve({ ...input, id: expenseId }) : apiClient.patch(`/api/v1/expenses/${expenseId}`, {
    category: toApiCategory[input.category] || 'other',
    description: input.description.trim(),
    amount: Number(input.amount),
    expense_date: input.date
  }).then((response) => mapExpense(response.data)),
  remove: (expenseId) => useMock ? Promise.resolve() : apiClient.delete(`/api/v1/expenses/${expenseId}`)
};
