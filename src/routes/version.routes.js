// src/routes/version.routes.js
import { Router } from 'express';
import VersionController from '../controllers/version.controller.js';

const router = Router();
router.get('', VersionController.checkVersion);
export default router;