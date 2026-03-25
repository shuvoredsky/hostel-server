import app from './app';
import { envVars } from './src/config/env';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

const PORT = envVars.PORT || process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Dhaka-Stay Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});