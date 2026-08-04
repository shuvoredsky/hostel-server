import app from './app';
import { envVars } from './config/env';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

const PORT = Number(process.env.PORT) || Number(envVars.PORT) || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dhaka-Stay Server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});