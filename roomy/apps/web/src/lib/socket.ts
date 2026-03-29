import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@roomy/types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const initSocket = (token: string) => {
  if (socket) return socket;
  
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  
  socket = io(url, {
    auth: { token },
    reconnection: true,
  });

  socket.on('connect', () => console.log('[Socket] Connected', socket?.id));
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
