// src/routes/auth.routes.js
import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/profile', authenticateToken, (req, res) => {
    // Aquí podríem retornar la informació del perfil de l'usuari autenticat
    res.status(200).json({
        message: 'Perfil de l\'usuari autenticat',
        user: req.user // La informació de l'usuari es troba a req.user gràcies al middleware authenticateToken
    });
});

export default router;
