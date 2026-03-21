import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { UserController } from './user.controller';

const router = Router();

// সব users দেখো
router.get('/', checkAuth(Role.ADMIN), UserController.getAllUsers);

// Single user দেখো
router.get('/:id', checkAuth(Role.ADMIN), UserController.getSingleUser);

// User block/unblock/delete
router.patch('/:id/block', checkAuth(Role.ADMIN), UserController.blockUser);
router.patch('/:id/unblock', checkAuth(Role.ADMIN), UserController.unblockUser);
router.delete('/:id', checkAuth(Role.ADMIN), UserController.deleteUser);

// Listing block
router.patch('/listing/:id/block', checkAuth(Role.ADMIN), UserController.blockListing);

export const UserRoutes = router;