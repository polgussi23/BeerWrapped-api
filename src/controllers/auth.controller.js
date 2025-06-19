// src/controllers/auth.controller.js
import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const SALT_ROUNDS = 10;

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7; // Per exemple, 7 dies

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuari i contrasenya són necessaris.' });
  }

  try {
    const user = await UserModel.findByUsername(username);

    if (!user) {
      return res.status(401).json({ message: 'Credencials invàlides.' });
    }

    // **Comparació de la contrasenya hashejada amb bcrypt.compare**
    const passwordMatch = await bcrypt.compare(password, user.password); // Compara la contrasenya en text pla amb la hashejada

    if (passwordMatch) {
      const tokenPayload = {id: user.id, username: user.username};
      
      // Genera un token JWT
      const accessToken = jwt.sign( tokenPayload , JWT_SECRET, { expiresIn: '15m' }); // Expira en 15 minuts

      const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // Expira en 7 dies

      await UserModel.saveRefreshToken(user.id, refreshToken, REFRESH_TOKEN_EXPIRES_IN_DAYS); // Guarda el refresh token a la base de dades

      return res.status(200).json({ 
        message: 'Login correcte', 
        accessToken: accessToken, 
        refreshToken: refreshToken, 
        userId: user.id, 
        startDay: user.startDay 
});
    } else {
      return res.status(401).json({ message: 'Credencials invàlides.' });
    }
  } catch (error) {
    console.error('Error durant el login:', error);
    return res.status(500).json({ message: 'Error en el servidor durant el login.' });
  }
};


const register = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Usuari, contrasenya i email són necessaris.' });
  }

  try {
    // Verifica si ja existeix un usuari amb aquest username o email
    const existingUserUsername = await UserModel.findByUsername(username);
    if (existingUserUsername) {
      return res.status(409).json({ message: 'Nom d\'usuari ja existeix.' }); // 409 Conflict
    }
    const existingUserEmail = await UserModel.findByEmail(email);
    if (existingUserEmail) {
      return res.status(409).json({ message: 'Email ja registrat.' }); // 409 Conflict
    }

    // Hasheja la contrasenya
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crea el nou usuari a la base de dades
    const userId = await UserModel.createUser(username, hashedPassword, email);

    const tokenPayload = { id: userId, username: username };

    // Opcional: Genera un token JWT i retorna'l per fer login automàtic després del registre
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await UserModel.saveRefreshToken(userId, refreshToken, REFRESH_TOKEN_EXPIRES_IN_DAYS); // Guarda el refresh token a la base de dades

    return res.status(201).json({ message: 'Usuari registrat correctament', userId: userId, accessToken: accessToken, refreshToken: refreshToken }); // 201 Created
  } catch (error) {
    console.error('Error durant el registre:', error);
    return res.status(500).json({ message: 'Error en el servidor durant el registre.' });
  }
};

const refreshToken = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const clientRefreshToken = authHeader && authHeader.split(' ')[1];

  if (!clientRefreshToken) {
    return res.status(401).json({ message: 'No s\'ha proporcionat un refresh token.' });
  }

  try{
    const decoded = jwt.verify(clientRefreshToken, REFRESH_TOKEN_SECRET);

    const storedToken = await UserModel.findRefreshToken(decoded.id, clientRefreshToken);
    if(!storedToken) {
      console.warn(`Attempted refresh with invalid/expired/revoked DB token for user ${decoded.id}`);
      return res.status(403).json({ message: 'Refresh Token no vàlid.' });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    await UserModel.deleteRefreshToken(decoded.id, clientRefreshToken); // Elimina el refresh token antic

    await UserModel.saveRefreshToken(decoded.id, clientRefreshToken, REFRESH_TOKEN_EXPIRES_IN_DAYS); // Guarda el nou refresh token a la base de dades

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: clientRefreshToken,
    })

  }catch (error) {
    console.error('Error durant la renovació del token:', error);
    return res.status(403).json({ message: 'Refresh Token  invàlid o expirat. Torna a iniciar sessió.' });
  }
}

const logout = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const clientRefreshToken = authHeader && authHeader.split(' ')[1]; // Esperem el refresh token

    if (!clientRefreshToken) {
        return res.status(400).json({ message: 'Refresh Token no proporcionat.' });
    }

    try {
        // Opcional: Verifica el refresh token per obtenir el userId abans d'eliminar
        const decoded = jwt.verify(clientRefreshToken, REFRESH_TOKEN_SECRET);

        // Elimina el refresh token de la base de dades
        await UserModel.deleteRefreshToken(clientRefreshToken);

        return res.status(200).json({ message: 'Sessió tancada correctament.' });
    } catch (error) {
        console.error('Error durant el logout:', error.message);
        // Si el token és invàlid aquí, potser ja ha expirat o ha estat revocat
        return res.status(200).json({ message: 'Sessió tancada (token ja invàlid o expirat).' });
    }
};

export default {
  login,
  register,
  refreshToken,
  logout,
};
