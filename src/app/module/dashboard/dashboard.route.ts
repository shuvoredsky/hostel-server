    import { Router } from 'express';
    import { Role } from '../../../generated';
    import { checkAuth } from '../../middleware/checkAuth';
    import { DashboardController } from './dashboard.controller';

    const router = Router();

    router.get('/admin', checkAuth(Role.ADMIN), DashboardController.getAdminDashboard);
    router.get('/owner', checkAuth(Role.OWNER), DashboardController.getOwnerDashboard);
    router.get('/student', checkAuth(Role.STUDENT), DashboardController.getStudentDashboard);
    router.get('/tenant', checkAuth(Role.TENANT), DashboardController.getTenantDashboard);



    export const DashboardRoutes = router;