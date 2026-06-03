import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { envVars } from './config/env';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
import router from './routes';
import { requestLogger } from './app/middleware/requestLogger';

const app: Application = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://hostel-client-theta.vercel.app',
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.post('/test-booking', (req, res) => {
  res.json({ message: 'test works' });
});

app.use('/api/v1', router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;