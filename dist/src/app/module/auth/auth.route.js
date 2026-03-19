"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const generated_1 = require("../../generated");
const checkAuth_1 = require("../../middleware/checkAuth");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
const ALL_ROLES = [generated_1.$Enums.Role.ADMIN, generated_1.$Enums.Role.OWNER, generated_1.$Enums.Role.STUDENT];
// Public routes
router.post('/register/student', auth_controller_1.AuthController.registerStudent);
router.post('/register/owner', auth_controller_1.AuthController.registerOwner);
router.post('/login', auth_controller_1.AuthController.loginUser);
router.post('/verify-email', auth_controller_1.AuthController.verifyEmail);
router.post('/forget-password', auth_controller_1.AuthController.forgetPassword);
router.post('/reset-password', auth_controller_1.AuthController.resetPassword);
router.post('/refresh-token', auth_controller_1.AuthController.getNewToken);
// Protected routes
router.get('/me', (0, checkAuth_1.checkAuth)(...ALL_ROLES), auth_controller_1.AuthController.getMe);
router.post('/change-password', (0, checkAuth_1.checkAuth)(...ALL_ROLES), auth_controller_1.AuthController.changePassword);
router.post('/logout', (0, checkAuth_1.checkAuth)(...ALL_ROLES), auth_controller_1.AuthController.logoutUser);
// Google OAuth
router.get('/login/google', auth_controller_1.AuthController.googleLogin);
router.get('/google/success', auth_controller_1.AuthController.googleLoginSuccess);
router.get('/oauth/error', auth_controller_1.AuthController.handleOAuthError);
exports.AuthRoutes = router;
