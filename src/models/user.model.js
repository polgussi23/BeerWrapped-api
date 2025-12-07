// src/models/user.model.js
import db from '../config/db.config.js';

const UserModel = {
  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM Users WHERE BINARY username = ?', [username]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM Users WHERE BINARY email = ?', [email]);
    return rows[0];
  },
  createUser: async (username, password, email) => {
    const [result] = await db.query(
      'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    );
    return result.insertId; // Retorna l'ID de l'usuari inserit
  },
  /**
   * Guarda un nou refresh token per a un usuari.
   * @param {number} userId - L'ID de l'usuari.
   * @param {string} token - El refresh token a guardar.
   * @param {number} expiresInDays - Dies des d'ara en què expirarà el token.
   */
  saveRefreshToken: async (userId, token, expiresInDays) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [result] = await db.query(
      'INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    return result.insertId; // Retorna l'ID del token_id inserit
  },

  /**
   * Troba un refresh token vàlid per a un usuari.
   * @param {number} userId - L'ID de l'usuari.
   * @param {string} token - El refresh token a cercar.
   */
  findRefreshToken: async (userId, token) => {
    const [rows] = await db.query(
      'SELECT * FROM user_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [userId, token]
    );
    return rows[0]; // Retorna el token si el troba i no ha expirat
  },

  /**
   * Elimina un refresh token específic de la BD (per exemple, en un logout de dispositiu).
   * @param {string} token - El refresh token a eliminar.
   */
  deleteRefreshToken: async (token) => {
    await db.query('DELETE FROM user_tokens WHERE token = ?', [token]);
  },

  /**
   * Elimina tots els refresh tokens d'un usuari (per exemple, en canviar contrasenya o logout de tots els dispositius).
   * @param {number} userId - L'ID de l'usuari.
   */
  deleteAllRefreshTokensForUser: async (userId) => {
    await db.query('DELETE FROM user_tokens WHERE user_id = ?', [userId]);
  },

  /**
   * Neteja periòdica de tokens expirats de la BD.
   * Ideal per a ser cridada per un cron job o tasca programada.
   */
  cleanExpiredRefreshTokens: async () => {
    const [result] = await db.query('DELETE FROM user_tokens WHERE expires_at <= NOW()');
    console.log(`Netejats ${result.affectedRows} refresh tokens expirats de la BD.`);
    return result.affectedRows;
  },

   getStartDay: async (userId) => {
    const [rows] = await db.query('SELECT startDay FROM Users WHERE id = ?', [userId]);
    return rows[0] ? rows[0].startDay : null;
  },

  setStartDay: async (userId, startDay) => {
    await db.query('UPDATE Users SET startDay = ? WHERE id = ?', [startDay, userId]);
    return startDay;
  },
};

export default UserModel;
