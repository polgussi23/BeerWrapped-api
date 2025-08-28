// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; // Utilitza la mateixa clau que per signar l'Access Token

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Esperem "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Accés denegat: No hi ha token d\'accés.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Si el token és invàlid o ha expirat
            // L'aplicació Flutter haurà de detectar aquest 403 i intentar refrescar el token
            return res.status(403).json({ message: 'Token d\'accés invàlid o expirat.' });
        }
        req.user = user; // Guarda la informació de l'usuari (del payload del token) a l'objecte request
        next(); // Continua amb la següent funció (el controlador de la ruta)
    });
};

export { authenticateToken };