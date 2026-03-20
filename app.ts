import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { envVars } from './src/config/env';
import globalErrorHandler from './src/app/middleware/globalErrorHandler';
import notFound from './src/app/middleware/notFound';
import router from './src/routes';

const app: Application = express();

app.use(cors({ origin: envVars.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.post('/test-booking', (req, res) => {
  res.json({ message: 'test works' });
});

app.use('/api/v1', router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;