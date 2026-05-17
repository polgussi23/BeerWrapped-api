import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Start day routes
router.get('/:id/start-day', authenticateToken, authorizeSelf, userController.getStartDay);
router.post('/:id/start-day', authenticateToken, authorizeSelf, userController.setStartDay);
router.put('/:id/start-day', authenticateToken, authorizeSelf, userController.updateStartDay);

router.get('/:id', authenticateToken, authorizeSelf, userController.getUserData);
router.put('/:id/username', authenticateToken, authorizeSelf, userController.updateUsername);
router.put('/:id/email', authenticateToken, authorizeSelf, userController.updateEmail);
router.put('/:id/password', authenticateToken, authorizeSelf, userController.updatePassword);
router.put('/:id/photo', authenticateToken, authorizeSelf, userController.updateProfileImage);

router.get('/:id/wrapped', authenticateToken, authorizeSelf, userController.getWrappedData);
router.put('/:id/wrapped-seen', authenticateToken, authorizeSelf, userController.updateWrappedSeen);
router.get('/:id/wrapped-status', authenticateToken, authorizeSelf, userController.getWrappedStatus);

export default router;
