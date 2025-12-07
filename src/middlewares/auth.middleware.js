// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware per validar que el token és vàlid
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Esperem "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Accés denegat: No hi ha token d\'accés.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token d\'accés invàlid o expirat.' });
    }
    req.user = user; // Conté el payload: { id, username }
    next();
  });
};

// Middleware addicional per assegurar que només el propietari pot accedir a la ruta
const authorizeSelf = (req, res, next) => {
  const { id } = req.params;
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ message: 'No tens permisos per accedir a aquestes dades.' });
  }
  next();
};

export { authenticateToken, authorizeSelf };
