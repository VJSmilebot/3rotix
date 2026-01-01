import { io } from 'socket.io-client';
import { getSupabaseClient } from './supabase/client';

// Keep a single socket instance in the browser
let socket;

export function getSocket() {
  if (!socket) {
    const supabase = getSupabaseClient();

    // Get the current session to get the JWT token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        socket = io(process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3000', {
          auth: {
            token: session.access_token,
          },
        });

        socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from Socket.IO server');
        });
      }
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}