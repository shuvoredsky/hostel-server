import { Router } from 'express';
import { Role } from '../../../generated';
import { studentIdUpload } from '../../config/multer.config';
import { checkAuth } from '../../middleware/checkAuth';
import { VerificationController } from './verification.controller';

const router = Router();

// Student — নিজের verification submit ও status দেখা
router.post(
  '/submit',
  checkAuth(Role.STUDENT),
  studentIdUpload.single('studentIdCard'),
  VerificationController.submitVerification,
);
router.get('/me', checkAuth(Role.STUDENT), VerificationController.getMyVerification);

// Admin — সব verification দেখা ও approve/reject
router.get('/', checkAuth(Role.ADMIN), VerificationController.getAllVerifications);
router.patch('/:id/approve', checkAuth(Role.ADMIN), VerificationController.approveVerification);
router.patch('/:id/reject', checkAuth(Role.ADMIN), VerificationController.rejectVerification);

export const VerificationRoutes = router;