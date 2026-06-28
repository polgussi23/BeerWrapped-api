import express from 'express';
import notificactionController from '../controllers/notificaction.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Start day routes
//router.get('/:id/start-day', authenticateToken, authorizeSelf, userController.getStartDay);
router.post('/:id/device-token', authenticateToken, authorizeSelf, notificactionController.postUserDeviceToken);
router.delete('/:id/device-token', authenticateToken, authorizeSelf, notificactionController.deleteUserDeviceToken);


export default router;
