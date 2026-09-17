// src/api/notifications/routes.ts
import { Router } from 'express';
import { notificationsController } from './controller';

const router = Router();

// Get user notifications
router.get('/', notificationsController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationsController.markAsRead);

// Mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationsController.deleteNotification);

// Get notification preferences
router.get('/preferences', notificationsController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationsController.updatePreferences);

export default router;