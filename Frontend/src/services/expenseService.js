import { apiClient } from './apiClient';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const toBackendCategory = (cat) => {
  if (!cat) return 'other';
  const c = String(cat).trim().toLowerCase();
  if (['food', 'meal', 'meals', 'dining', 'restaurant'].includes(c)) return 'food';
  if (['transport', 'transportation', 'bus', 'train', 'flight', 'taxi', 'ride'].includes(c)) return 'transport';
  if (['lodging', 'accommodation', 'hotel', 'resort', 'stay', 'airbnb'].includes(c)) return 'accommodation';
  if (['activity', 'activities', 'entertainment', 'tour', 'sightseeing'].includes(c)) return 'activity';
  if (['shopping', 'souvenir', 'market'].includes(c)) return 'shopping';
  if (['emergency', 'medical', 'hospital', 'urgent'].includes(c)) return 'emergency';
  return 'other';
};

export const fromBackendCategory = {
  food: 'Food',
  transport: 'Transport',
  accommodation: 'Lodging',
  activity: 'Activities',
  shopping: 'Shopping',
  emergency: 'Emergency',
  other: 'Other'
};

export const toBackendDate = (d) => {
  if (d) {
    if (typeof d === 'string') {
      const match = d.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    } catch {}
  }
  return new Date().toISOString().split('T')[0];
};

const mapExpense = (item) => ({
  id: item.id,
  tripId: item.trip_id,
  userId: item.user_id,
  date: item.expense_date,
  description: item.description,
  category: fromBackendCategory[item.category] || 'Other',
  amount: Number(item.amount),
  month: new Date(`${item.expense_date}T00:00:00`).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  paidBy: item.user ? {
    id: item.user.id,
    name: item.user.full_name || item.user.username || 'Traveler',
    initial: (item.user.full_name || item.user.username || 'T')[0].toUpperCase(),
    bg: 'bg-teal-primary/20 text-teal-primary'
  } : {
    id: item.user_id,
    name: 'Traveler',
    initial: 'T',
    bg: 'bg-teal-primary/20 text-teal-primary'
  }
});

export const expenseService = {
  listPersonal: () => useMock ? Promise.resolve([]) : apiClient.get('/api/v1/users/me/expenses').then((response) => (response.data || []).map(mapExpense)),
  list: (tripId) => useMock ? Promise.resolve([]) : apiClient.get(`/api/v1/trips/${tripId}/expenses`).then((response) => (response.data || []).map(mapExpense)),
  create: (tripId, input) => {
    if (useMock) return Promise.resolve({ ...input, id: `mock-${Date.now()}` });
    const payload = {
      category: toBackendCategory(input.category),
      description: (input.description || 'Expense').trim(),
      amount: Math.max(0.01, Number(input.amount) || 0),
      expense_date: toBackendDate(input.date || input.expense_date)
    };
    return apiClient.post(`/api/v1/trips/${tripId}/expenses`, payload).then((response) => mapExpense(response.data));
  },
  update: (expenseId, input) => {
    if (useMock) return Promise.resolve({ ...input, id: expenseId });
    const payload = {};
    if (input.category) payload.category = toBackendCategory(input.category);
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.amount !== undefined) payload.amount = Math.max(0.01, Number(input.amount) || 0);
    if (input.date || input.expense_date) payload.expense_date = toBackendDate(input.date || input.expense_date);
    return apiClient.patch(`/api/v1/expenses/${expenseId}`, payload).then((response) => mapExpense(response.data));
  },
  remove: (expenseId) => useMock ? Promise.resolve() : apiClient.delete(`/api/v1/expenses/${expenseId}`)
};
