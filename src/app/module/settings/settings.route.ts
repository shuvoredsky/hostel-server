import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { logoUpload, bannerUpload } from '../../config/multer.config';
import { SettingsController } from './settings.controller';

const router = Router();


router.get('/', SettingsController.getSiteSettings);

// Admin only
router.patch(
  '/logo',
  checkAuth(Role.ADMIN),
  logoUpload.single('logo'),
  SettingsController.updateLogo,
);

router.post(
  '/banner',
  checkAuth(Role.ADMIN),
  bannerUpload.single('banner'),
  SettingsController.addBanner,
);

router.patch(
  '/banner/:id',
  checkAuth(Role.ADMIN),
  SettingsController.updateBanner,
);

router.delete(
  '/banner/:id',
  checkAuth(Role.ADMIN),
  SettingsController.deleteBanner,
);

router.patch(
  '/banner/reorder',
  checkAuth(Role.ADMIN),
  SettingsController.reorderBanners,
);

export const SettingsRoutes = router;