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
};

export default UserModel;
