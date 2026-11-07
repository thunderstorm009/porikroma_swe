import { MOCK_CHAT_MESSAGES } from '../data/travelData';
import { apiClient, API_BASE_URL } from './apiClient';
import { supabase } from './supabase';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

const displayName = (sender) => sender?.full_name || sender?.username || 'Traveler';

// Backend MessageRead -> the shape the chat UI renders. Used for REST history and
// live WebSocket messages alike, so both look the same.
export const toUiMessage = (data) => ({
  id: data.id,
  senderId: data.sender_id || data.sender?.id || null,
  user: displayName(data.sender),
  initials: displayName(data.sender).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'T',
  time: data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now',
  message: data.content,
  color: 'blue'
});

export const chatService = {
  getMessages: async (tripId) => {
    if (useMock) return MOCK_CHAT_MESSAGES;
    const res = await apiClient.get(`/api/v1/trips/${tripId}/messages`);
    return (res?.data?.items || []).map(toUiMessage);
  },

  // REST fallback when the socket is not open. The backend also pushes the message
  // to everyone connected over WebSocket.
  postMessage: async (tripId, text) => {
    const res = await apiClient.post(`/api/v1/trips/${tripId}/messages`, { content: text });
    return toUiMessage(res.data);
  },

  // Returns a WebSocket-like handle ({ readyState, send, close }) that reconnects
  // with backoff if the connection drops. `onMessage` receives UI-shaped messages.
  connect: async (tripId, onMessage, onStatusChange) => {
    let closed = false;
    let socket = null;
    let reconnectAttempts = 0;
    let reconnectTimer = null;

    const notifyStatus = (status) => { if (onStatusChange) onStatusChange(status); };

    const scheduleReconnect = () => {
      if (closed) return;
      notifyStatus('reconnecting');
      reconnectAttempts += 1;
      const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 15000);
      reconnectTimer = setTimeout(() => { openSocket().catch(scheduleReconnect); }, delay);
    };

    const openSocket = async () => {
      if (closed) return;
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        notifyStatus('closed');
        return;
      }
      socket = new WebSocket(`${WS_BASE_URL}/api/v1/ws/trips/${tripId}/chat?token=${encodeURIComponent(token)}`);
      socket.onopen = () => {
        reconnectAttempts = 0;
        notifyStatus('connected');
      };
      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.error) {
            console.warn('Trip chat:', parsed.error);
            return;
          }
          onMessage(toUiMessage(parsed));
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };
      socket.onerror = (event) => {
        console.warn('Trip chat WebSocket notice:', event);
      };
      socket.onclose = (event) => {
        if (closed || event.code === 1008) {
          notifyStatus('closed');
          return;
        }
        scheduleReconnect();
      };
    };

    notifyStatus('connecting');
    await openSocket().catch(scheduleReconnect);

    return {
      get readyState() {
        return socket ? socket.readyState : WebSocket.CONNECTING;
      },
      send(text) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ text }));
          return true;
        }
        return false;
      },
      close() {
        closed = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) socket.close();
      }
    };
  }
};
