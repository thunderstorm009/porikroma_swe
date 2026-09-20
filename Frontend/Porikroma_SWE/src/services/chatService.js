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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const wsUrl = `${WS_BASE_URL}/api/v1/ws/trips/${tripId}/chat?token=${token}`;

      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        reconnectAttempts = 0;
        notifyStatus('connected');
      };
      socket.onmessage = (event) => {
        try {
          onMessage(JSON.parse(event.data));
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };
      socket.onerror = (event) => {
        console.error('Trip chat WebSocket error', event);
      };
      socket.onclose = (event) => {
        // 1008 = server rejected auth/membership; retrying would just repeat the failure.
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

    await openSocket();

    return {
      get readyState() {
        return socket ? socket.readyState : WebSocket.CONNECTING;
      },
      send(data) {
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(data);
      },
      close() {
        closed = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) socket.close();
      }
    };
  },
  sendMessage: (ws, messageText) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: messageText }));
    }
  }
};
