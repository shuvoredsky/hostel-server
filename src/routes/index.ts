import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../app/lib/auth';
import { AuthRoutes } from '../app/module/auth/auth.route';

const router = Router();

// Express 5 এ wildcard এভাবে লিখতে হয়
router.all('/auth/better/{*path}', toNodeHandler(auth));
router.use('/auth', AuthRoutes);

export default router;