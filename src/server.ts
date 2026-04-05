import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { envVars } from './config/env';
import { initSocket } from './app/module/chat/chat.socket';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

const PORT = Number(process.env.PORT) || Number(envVars.PORT) || 8000;

// ✅ http server তৈরি করো app থেকে
const httpServer = createServer(app);

// ✅ Socket.IO attach করো
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://hostel-client-theta.vercel.app',
    ],
    credentials: true,
  },
});

// ✅ socket logic initialize
initSocket(io);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dhaka-Stay Server running on http://0.0.0.0:${PORT}`);
});

httpServer.on('error', (err) => {
  console.error('❌ Server error:', err);
});