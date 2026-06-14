// src/controllers/auth.controller.js
import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const SALT_ROUNDS = 10;
const verificationCodes = new Map();
const transporter = nodemailer.createTransport({
  host: 'mail.polgussi.cat',   // o smtp.polgussi.cat — depèn del proveïdor
  port: 587,                    // 465 (SSL) o 587 (TLS)
  secure: false,                 // true per 465, false per 587
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.error('Error de connexió SMTP:', error);
  } else {
    console.log('Servidor llest per enviar correus!');
  }
});

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 365; // Per exemple, 365 dies

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

      const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '365d' }); // Expira en 1 any

      await UserModel.saveRefreshToken(user.id, refreshToken, REFRESH_TOKEN_EXPIRES_IN_DAYS); // Guarda el refresh token a la base de dades
      
      let formattedStartDay = null;
      if (user.startDay) {
        const d = new Date(user.startDay);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        formattedStartDay = `${year}-${month}-${day}`;
      }

      return res.status(200).json({ 
        message: 'Login correcte', 
        accessToken: accessToken, 
        refreshToken: refreshToken, 
        userId: user.id, 
        startDay: formattedStartDay,
        email: user.email,
        birthdate: user.birthdate,
        verified: user.email_validated
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
  const { username, password, email, birthdate } = req.body;
  console.log("Sol·licitud de registre");

  if (!username || !password || !email || !birthdate) {
    return res.status(400).json({ message: 'Usuari, contrasenya, email i data neixament són necessaris.' });
  }

  try {
    // Verifica si ja existeix un usuari amb aquest username o email
    const existingUserUsername = await UserModel.findByUsername(username);
    if (existingUserUsername) {
      console.log("Nom d'usuari ja existeix");
      return res.status(409).json({ message: 'Nom d\'usuari ja existeix.' }); // 409 Conflict
    }
    const existingUserEmail = await UserModel.findByEmail(email);
    if (existingUserEmail) {
      console.log("Correu ja existeix");
      return res.status(409).json({ message: 'Email ja registrat.' }); // 409 Conflict
    }

    // Hasheja la contrasenya
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crea el nou usuari a la base de dades
    const userId = await UserModel.createUser(username, hashedPassword, email, birthdate);

    const tokenPayload = { id: userId, username: username };

    // Opcional: Genera un token JWT i retorna'l per fer login automàtic després del registre
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '3y' });

    await UserModel.saveRefreshToken(userId, refreshToken, REFRESH_TOKEN_EXPIRES_IN_DAYS); // Guarda el refresh token a la base de dades

    return res.status(201).json(
      { message: 'Usuari registrat correctament',
        userId: userId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        email: email,
        birthdate: birthdate
      }); // 201 Created
  } catch (error) {
    console.error('Error durant el registre:', error);
    return res.status(500).json({ message: 'Error en el servidor durant el registre.' });
  }
};

const refreshToken = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const clientRefreshToken = authHeader && authHeader.split(' ')[1];

  if (!clientRefreshToken) {
    return res.status(401).json({ message: "No s'ha proporcionat un refresh token." });
  }

  try {
    // 1. Verifiquem la signatura criptogràfica (si ha caducat, això petarà i anirà al catch)
    const decoded = jwt.verify(clientRefreshToken, REFRESH_TOKEN_SECRET);

    // 2. Verifiquem si existeix a la Base de Dades (Whitelist)
    const storedToken = await UserModel.findRefreshToken(decoded.id, clientRefreshToken);
    
    if (!storedToken) {
      // Si el token és vàlid criptogràficament però no està a la BD, 
      // vol dir que l'usuari va fer logout o el token va ser revocat.
      return res.status(403).json({ message: 'Refresh Token revocat o no vàlid.' });
    }

    // 3. Generem NOMÉS un nou Access Token
    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      JWT_SECRET,
      { expiresIn: '15m' } // 1 minut (o 15m)
    );

    // --- CORRECCIÓ CLAU ---
    // NO esborrem el refresh token.
    // NO tornem a guardar el refresh token.
    // Simplement el deixem viure a la BD fins que caduqui naturalment (365 dies).
    
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: clientRefreshToken, // Retornem el mateix per coherència
    });

  } catch (error) {
    console.error('Error durant la renovació del token:', error.message);
    return res.status(403).json({ message: 'Refresh Token invàlid o expirat.' });
  }
};

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

const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const stored = verificationCodes.get(email);

  if (!stored) {
    return res.status(400).json({ error: 'No hi ha cap codi pendent' });
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: 'El codi ha caducat' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ error: 'Codi incorrecte' });
  }

  verificationCodes.delete(email);
  UserModel.emailVerified(email);
  console.log("Status 200. Correu verificat");
  return res.status(200).json({ message: 'Correu verificat correctament!' });
}

const sendVerification = async (req, res) => {
  const { email } = req.body;
  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  verificationCodes.set(email, { code, expiresAt });

  try {
    await sendVerificationEmail(email, code);
    return res.status(200).json({ message: 'Codi enviat!' });
  } catch (error) {
    console.error('Error enviant email:', error); // <-- mira aquest log al servidor
    return res.status(500).json({ error: error.message });
  }
}

async function sendVerificationEmail(email, code) {
  await transporter.sendMail({
    from: '"BirraWrapped" <noreply@polgussi.cat>',
    to: email,
    subject: 'Verifica el teu correu',
    html: `
      <h2>Codi de verificació</h2>
      <p>El teu codi és: <strong style="font-size: 24px">${code}</strong></p>
      <p>Caduca en 10 minuts.</p>
    `
  });
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendResetCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correu és necessari.' });
  }

  // Comprovem que l'usuari existeix
  const user = await UserModel.findByEmail(email);
  if (!user) {
    // Per seguretat, no confirmem si el correu existeix o no
    return res.status(200).json({ message: 'Si el correu existeix, rebràs un codi.' });
  }

  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minuts
  verificationCodes.set(`reset_${email}`, { code, expiresAt });

  try {
    await sendResetEmail(email, code);
    return res.status(200).json({ message: 'Codi enviat!' });
  } catch (error) {
    console.error('Error enviant email de reset:', error);
    return res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Falten camps obligatoris.' });
  }

  const stored = verificationCodes.get(`reset_${email}`);

  if (!stored) {
    return res.status(400).json({ error: 'No hi ha cap codi pendent.' });
  }
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(`reset_${email}`);
    return res.status(400).json({ error: 'El codi ha caducat.' });
  }
  if (stored.code !== code) {
    return res.status(400).json({ error: 'Codi incorrecte.' });
  }

  verificationCodes.delete(`reset_${email}`);

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await UserModel.updatePasswordByEmail(email, hashedPassword);

  return res.status(200).json({ message: 'Contrasenya canviada correctament!' });
};

async function sendResetEmail(email, code) {
  await transporter.sendMail({
    from: '"BirraWrapped" <noreply@polgussi.cat>',
    to: email,
    subject: 'Recuperació de contrasenya',
    html: `
      <h2>Recuperació de contrasenya</h2>
      <p>El teu codi és: <strong style="font-size: 24px">${code}</strong></p>
      <p>Caduca en 10 minuts.</p>
    `
  });
}

export default {
  login,
  register,
  refreshToken,
  logout,
  verifyCode,
  sendVerification,
  sendResetCode,
  resetPassword,
};
