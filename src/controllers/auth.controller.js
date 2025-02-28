// src/controllers/auth.controller.js
import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

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
      // Genera un token JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' }); // Expira en 1 hora

      return res.status(200).json({ message: 'Login correcte', token: token });
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

    // Opcional: Genera un token JWT i retorna'l per fer login automàtic després del registre
    const token = jwt.sign({ id: userId, username: username }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({ message: 'Usuari registrat correctament', userId: userId, token: token }); // 201 Created
  } catch (error) {
    console.error('Error durant el registre:', error);
    return res.status(500).json({ message: 'Error en el servidor durant el registre.' });
  }
};

export default {
  login,
  register,
};
