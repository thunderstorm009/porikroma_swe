import { MOCK_CHAT_MESSAGES } from '../data/travelData';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const chatService = {
  getMessages: async (tripId) => {
    const { apiClient } = await import('./apiClient');
    const res = await apiClient.get(`/api/v1/trips/${tripId}/messages`);
    return res.data.items.map(data => ({
      id: data.id,
      user: data.sender?.full_name || data.sender?.username || 'User',
      initials: (data.sender?.full_name || data.sender?.username || 'U')[0].toUpperCase(),
      time: new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      message: data.content,
      color: 'blue'
    }));
  },
  connect: async (tripId, onMessage) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const wsUrl = `${WS_BASE_URL}/api/v1/ws/trips/${tripId}/chat?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };
    return ws;
  },
  sendMessage: (ws, messageText) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: messageText }));
    }
  }
};
