import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { AuthController } from './auth.controller';

const router = Router();

const ALL_ROLES = [Role.ADMIN, Role.OWNER, Role.STUDENT];

// Public routes
router.post('/register/student', AuthController.registerStudent);
router.post('/register/owner', AuthController.registerOwner);
router.post('/login', AuthController.loginUser);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/forget-password', AuthController.forgetPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh-token', AuthController.getNewToken);

// Protected routes
router.get('/me', checkAuth(...ALL_ROLES), AuthController.getMe);
router.post('/change-password', checkAuth(...ALL_ROLES), AuthController.changePassword);
router.post('/logout', checkAuth(...ALL_ROLES), AuthController.logoutUser);

// Google OAuth
router.get('/login/google', AuthController.googleLogin);
router.get('/google/success', AuthController.googleLoginSuccess);
router.get('/oauth/error', AuthController.handleOAuthError);

export const AuthRoutes = router;