import { FORUM_ANSWERS, FORUM_CATEGORIES, FORUM_QUESTIONS, FORUM_REPLIES, FORUM_USERS } from '../data/forumData';
import { apiClient } from './apiClient';

const pause = (value, ms = 180) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const currentUserId = 'u1';
const savedKey = 'porikroma-forum-saved';
const followedKey = 'porikroma-forum-followed';
const readSet = (key) => new Set(JSON.parse(localStorage.getItem(key) || '[]'));
const writeSet = (key, value) => localStorage.setItem(key, JSON.stringify([...value]));
const withUserState = (question) => ({ ...question, bookmarked: readSet(savedKey).has(question.id), followed: readSet(followedKey).has(question.id) });
const mapProfile = (author) => author ? ({ id: author.id, name: author.full_name || author.username || 'Traveler', role: author.role || 'Traveler', initials: (author.full_name || author.username || 'T').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: 'teal', contributions: author.contribution_count || 0, avatarUrl: author.avatar_url || null }) : null;
const mapQuestion = (item) => ({ id: item.id, authorId: item.author_id, author: mapProfile(item.author), title: item.title, content: item.content, destination: item.destination?.name || 'General travel', category: item.category, tags: item.tags || [], answerIds: Array.from({ length: item.answer_count || 0 }, (_, index) => `${item.id}-answer-${index}`), likes: item.like_count || 0, views: item.view_count || 0, createdAt: item.created_at, bookmarked: item.bookmarked, followed: item.followed, tripContext: null });
const mapAnswer = (item) => ({ id: item.id, questionId: item.question_id, authorId: item.author_id, author: mapProfile(item.author), content: item.content, likes: item.like_count || 0, liked: false, createdAt: item.created_at, replyIds: (item.replies || []).map((reply) => reply.id), replies: (item.replies || []).map((reply) => ({ id: reply.id, answerId: reply.answer_id, authorId: reply.author_id, author: mapProfile(reply.author), content: reply.content, createdAt: reply.created_at, likes: 0 })) });

export const forumService = {
  getCategories: () => pause(FORUM_CATEGORIES),
  getUsers: () => useMock ? pause(FORUM_USERS) : Promise.resolve([]),
  getQuestions: ({ search = '', category = 'All', sort = 'Trending' } = {}) => {
    if (!useMock) return apiClient.get('/api/v1/forum/questions', { query: search || undefined, category: category === 'All' ? undefined : category, sort: sort.toLowerCase().replaceAll(' ', '_') }).then((response) => (response.data.items || []).map(mapQuestion));
    const needle = search.trim().toLowerCase();
    let questions = FORUM_QUESTIONS.filter((question) => {
      const matchesCategory = category === 'All' || question.category === category;
      const haystack = [question.title, question.content, question.destination, question.category, ...question.tags].join(' ').toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
    if (sort === 'Latest') questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'Most Helpful') questions.sort((a, b) => b.likes - a.likes);
    if (sort === 'Most Discussed') questions.sort((a, b) => b.answerIds.length - a.answerIds.length || b.likes - a.likes);
    if (sort === 'Unanswered') questions = questions.filter((question) => question.answerIds.length === 0);
    if (sort === 'Trending') questions.sort((a, b) => (b.likes + b.views / 20) - (a.likes + a.views / 20));
    return pause(questions.map(withUserState));
  },
  getQuestion: (id) => useMock ? pause(withUserState(FORUM_QUESTIONS.find((question) => question.id === id) || null)) : apiClient.get(`/api/v1/forum/questions/${id}`).then((response) => mapQuestion(response.data.question)),
  getQuestionBundle: (id) => {
    if (!useMock) return apiClient.get(`/api/v1/forum/questions/${id}`).then((response) => ({ question: mapQuestion(response.data.question), author: mapProfile(response.data.question.author), answers: (response.data.answers || []).map(mapAnswer) }));
    const question = FORUM_QUESTIONS.find((item) => item.id === id);
    if (!question) return pause(null);
    const answers = FORUM_ANSWERS.filter((answer) => answer.questionId === id).map((answer) => ({
      ...answer, author: FORUM_USERS.find((user) => user.id === answer.authorId),
      replies: FORUM_REPLIES.filter((reply) => reply.answerId === answer.id).map((reply) => ({ ...reply, author: FORUM_USERS.find((user) => user.id === reply.authorId) }))
    }));
    return pause({ question: withUserState(question), author: FORUM_USERS.find((user) => user.id === question.authorId), answers });
  },
  getSimilarQuestions: (question) => {
    if (!useMock) return apiClient.get(`/api/v1/forum/questions/${question.id}/similar`).then((response) => (response.data || []).map(mapQuestion));
    if (!question) return pause([]);
    const terms = [question.destination, question.category, ...question.tags].join(' ').toLowerCase();
    return pause(FORUM_QUESTIONS.filter((item) => item.id !== question.id && [item.destination, item.category, ...item.tags].join(' ').toLowerCase().split(' ').some((word) => word.length > 3 && terms.includes(word))).slice(0, 4).map(withUserState));
  },
  createQuestion: (input) => {
    if (!useMock) return apiClient.post('/api/v1/forum/questions', { title: input.title.trim(), content: input.content.trim(), destination: input.destination || null, category: input.category || 'Destinations', tags: input.tags || [] }).then((response) => mapQuestion(response.data));
    const id = `question_${Date.now()}`;
    const question = { id, authorId: currentUserId, title: input.title.trim(), content: input.content.trim(), destination: input.destination || 'General travel', category: input.category || 'Destinations', tags: input.tags || [], answerIds: [], likes: 0, views: 0, createdAt: new Date().toISOString(), bookmarked: false, followed: false, tripContext: input.includeTripContext ? input.tripContext : null };
    FORUM_QUESTIONS.unshift(question);
    return pause(question);
  },
  createAnswer: (questionId, content) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/questions/${questionId}/answers`, { content: content.trim() }).then((response) => mapAnswer(response.data));
    const answer = { id: `answer_${Date.now()}`, questionId, authorId: currentUserId, content: content.trim(), likes: 0, createdAt: new Date().toISOString(), replyIds: [] };
    FORUM_ANSWERS.unshift(answer);
    const question = FORUM_QUESTIONS.find((item) => item.id === questionId);
    if (question) question.answerIds.unshift(answer.id);
    return pause(answer);
  },
  createReply: (answerId, content) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/answers/${answerId}/replies`, { content: content.trim() }).then((response) => ({ ...response.data, authorId: response.data.author_id, author: mapProfile(response.data.author), createdAt: response.data.created_at }));
    const reply = { id: `reply_${Date.now()}`, answerId, authorId: currentUserId, content: content.trim(), createdAt: new Date().toISOString() };
    FORUM_REPLIES.unshift(reply);
    const answer = FORUM_ANSWERS.find((item) => item.id === answerId);
    if (answer) answer.replyIds.unshift(reply.id);
    return pause(reply);
  },
  likeQuestion: (id) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/questions/${id}/like`).then((response) => response.data);
    const question = FORUM_QUESTIONS.find((item) => item.id === id);
    if (question) question.likes += question.liked ? -1 : 1;
    if (question) question.liked = !question.liked;
    return pause(question);
  },
  likeAnswer: (id) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/answers/${id}/like`).then((response) => response.data);
    const answer = FORUM_ANSWERS.find((item) => item.id === id);
    if (answer) answer.likes += answer.liked ? -1 : 1;
    if (answer) answer.liked = !answer.liked;
    return pause(answer);
  },
  likeReply: (id) => {
    const reply = FORUM_REPLIES.find((item) => item.id === id);
    if (reply) reply.likes = (reply.likes || 0) + (reply.liked ? -1 : 1);
    if (reply) reply.liked = !reply.liked;
    return pause(reply);
  },
  bookmarkQuestion: (id) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/questions/${id}/bookmark`).then((response) => response.data);
    const saved = readSet(savedKey);
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    writeSet(savedKey, saved);
    return pause({ id, bookmarked: saved.has(id) });
  },
  followQuestion: (id) => {
    if (!useMock) return apiClient.post(`/api/v1/forum/questions/${id}/follow`).then((response) => response.data);
    const followed = readSet(followedKey);
    if (followed.has(id)) followed.delete(id); else followed.add(id);
    writeSet(followedKey, followed);
    return pause({ id, followed: followed.has(id) });
  }
};
