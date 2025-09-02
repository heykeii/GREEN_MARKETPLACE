import { io } from 'socket.io-client';

let socket = null;

export function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = getAuthToken();
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    withCredentials: true,
  });
  return socket;
}

export function joinConversation(conversationId) {
  const s = getSocket();
  s.emit('join_conversation', { conversationId });
}

export function onMessage(handler) {
  const s = getSocket();
  s.off('message');
  s.on('message', handler);
}

export function emitTyping(conversationId, isTyping) {
  const s = getSocket();
  s.emit('typing', { conversationId, isTyping });
}


