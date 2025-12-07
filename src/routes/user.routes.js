import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:id/start-day', authenticateToken, authorizeSelf, userController.getStartDay);
router.post('/:id/start-day', authenticateToken, authorizeSelf, userController.setStartDay);
router.put('/:id/start-day', authenticateToken, authorizeSelf, userController.updateStartDay);

export default router;
