import { MOCK_CHAT_MESSAGES } from '../data/travelData';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const chatService = {
  getMessages: async (tripId) => {
    try {
      const { apiClient } = await import('./apiClient');
      const res = await apiClient.get(`/api/v1/trips/${tripId}/messages`);
      if (res?.data?.items) {
        return res.data.items.map(data => ({
          id: data.id,
          user: data.sender?.full_name || data.sender?.username || 'User',
          initials: (data.sender?.full_name || data.sender?.username || 'U')[0].toUpperCase(),
          time: new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          message: data.content,
          color: 'blue'
        }));
      }
      return MOCK_CHAT_MESSAGES;
    } catch {
      return MOCK_CHAT_MESSAGES;
    }
  },
  // Returns a WebSocket-like handle ({ readyState, send, close }) that
  // reconnects automatically with backoff if the connection drops, so a
  // network blip or idle-timeout doesn't silently stop chat updates.
  connect: async (tripId, onMessage, onStatusChange) => {
    let closed = false;
    let socket = null;
    let reconnectAttempts = 0;
    let reconnectTimer = null;

    const notifyStatus = (status) => { if (onStatusChange) onStatusChange(status); };

    const openSocket = async () => {
      if (closed) return;
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token || '';
      const wsUrl = `${WS_BASE_URL}/api/v1/ws/trips/${tripId}/chat?token=${token}`;

      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        reconnectAttempts = 0;
        notifyStatus('connected');
      };
      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
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
        notifyStatus('reconnecting');
        reconnectAttempts += 1;
        const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 15000);
        reconnectTimer = setTimeout(openSocket, delay);
      };
    };

    await openSocket().catch(() => {});

    return {
      get readyState() {
        return socket ? socket.readyState : WebSocket.CONNECTING;
      },
      send(data) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
      },
      close() {
        closed = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) socket.close();
      }
    };
  },
  sendMessage: (socketOrHandle, messageText) => {
    if (socketOrHandle?.send) {
      socketOrHandle.send(typeof messageText === 'string' ? messageText : JSON.stringify(messageText));
    } else if (socketOrHandle?.readyState === WebSocket.OPEN) {
      socketOrHandle.send(JSON.stringify({ text: messageText }));
    }
  }
};
