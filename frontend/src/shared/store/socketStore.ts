import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (userId: string) => Socket | null;
  disconnect: () => void;
}

// Extract base URL from VITE_API_URL or fallback to http://localhost:5000
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  try {
    const url = new URL(apiUrl);
    return url.origin; // Extract http://localhost:5000
  } catch (err) {
    return 'http://localhost:5000';
  }
};

const SOCKET_URL = getSocketUrl();

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (userId) => {
    let currentSocket = get().socket;

    if (currentSocket && currentSocket.connected) {
      return currentSocket;
    }

    if (currentSocket) {
      currentSocket.connect();
      return currentSocket;
    }

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      set({ isConnected: true });
      socketInstance.emit('join_user_room', userId);
    });

    socketInstance.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ socket: socketInstance });
    return socketInstance;
  },

  disconnect: () => {
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
