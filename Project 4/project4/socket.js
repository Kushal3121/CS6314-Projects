import { Server } from 'socket.io';

let ioInstance = null;

export function initIO(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });
  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
}
