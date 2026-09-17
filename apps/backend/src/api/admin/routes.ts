// src/api/admin/routes.ts
import { Router } from 'express';
import { adminController } from './controller';

const router = Router();

// Admin dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Event moderation
router.get('/events/pending', adminController.getPendingEvents);
router.put('/events/:id/approve', adminController.approveEvent);
router.put('/events/:id/reject', adminController.rejectEvent);
router.delete('/events/:id', adminController.deleteEvent);

// Reports management
router.get('/reports', adminController.getReports);
router.put('/reports/:id/resolve', adminController.resolveReport);

// System settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Analytics & monitoring
router.get('/analytics', adminController.getSystemAnalytics);
router.get('/logs', adminController.getSystemLogs);

export default router;