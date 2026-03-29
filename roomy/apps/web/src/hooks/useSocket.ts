import { useEffect, useRef } from 'react';
import { initSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (accessToken && !socketRef.current) {
      socketRef.current = initSocket(accessToken);
    }

    return () => {
      // Don't eagerly disconnect on every re-render; rely on app unmount or logout
    };
  }, [accessToken]);

  return socketRef.current || getSocket();
}
