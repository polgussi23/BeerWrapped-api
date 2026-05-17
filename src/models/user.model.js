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
  createUser: async (username, password, email, birthdate) => {
    const [result] = await db.query(
      'INSERT INTO Users (username, password, email, birthdate) VALUES (?, ?, ?, ?)',
      [username, password, email, birthdate]
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

  getUserData: async (id) => {
    const [rows] = await db.query(
      'SELECT id, username, email, DATE_FORMAT(startDay, "%Y-%m-%d") as startDay, profile_image FROM users WHERE id = ?',
      [id]
    );
    return rows[0] ?? null;
  },

  updateUsername: async (id, username) => {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );
    if (existing.length > 0) throw new Error('USERNAME_TAKEN');

    await db.query('UPDATE users SET username = ? WHERE id = ?', [username, id]);
  },

  updateEmail: async (id, email) => {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    if (existing.length > 0) throw new Error('EMAIL_TAKEN');

    await db.query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
  },

  getUserPassword: async (id) => {
  const [rows] = await db.query(
    'SELECT password FROM users WHERE id = ?',
    [id]
  );
  return rows[0]?.password ?? null;
},

  updatePassword: async (id, hashedPassword) => {
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  },

  updateProfileImage: async (id, imagePath) => {
    await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imagePath, id]);
  },

  getWrappedStatus: async (userId) => {
    const [rows] = await db.query(
      'SELECT DATE_FORMAT(startDay, "%Y-%m-%d") as startDay, wrapped_seen_at, wrapped_reset_at, wrapped_season_start FROM users WHERE id = ?',
      [userId]
    );
    return rows[0] ?? null;
  },

  setWrappedSeenAt: async (userId) => {
    await db.query('UPDATE users SET wrapped_seen_at = NOW() WHERE id = ?', [userId]);
  },

  setWrappedResetAt: async (userId, seasonStart) => {
    await db.query(
      'UPDATE users SET wrapped_reset_at = NOW(), wrapped_season_start = ? WHERE id = ?',
      [seasonStart, userId]
    );
  },

  getWrappedData: async (userId, startDate, endDate) => {
    // 1. Total birres i litres
    const [[totals]] = await db.query(`
      SELECT 
        COUNT(*) as totalBeers,
        COALESCE(SUM(b.ml), 0) as totalMl
      FROM users_beers ub
      JOIN beers b ON ub.beer_id = b.id
      WHERE ub.user_id = ? AND ub.date BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    // 2. Birra favorita
    const [[favBeer]] = await db.query(`
      SELECT b.name, COUNT(*) as count
      FROM users_beers ub
      JOIN beers b ON ub.beer_id = b.id
      WHERE ub.user_id = ? AND ub.date BETWEEN ? AND ?
      GROUP BY b.id
      ORDER BY count DESC
      LIMIT 1
    `, [userId, startDate, endDate]);

    // 3. Mes més actiu
    const [[bestMonth]] = await db.query(`
      SELECT 
        MONTH(date) as month,
        YEAR(date) as year,
        COUNT(*) as count
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY count DESC
      LIMIT 1
    `, [userId, startDate, endDate]);

    // 4. Dia de la setmana més actiu
    const [[bestDayOfWeek]] = await db.query(`
      SELECT day_of_week, COUNT(*) as count
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY day_of_week
      ORDER BY count DESC
      LIMIT 1
    `, [userId, startDate, endDate]);

    // 5. Hora mitjana
    const [[avgTime]] = await db.query(`
      SELECT TIME_FORMAT(SEC_TO_TIME(AVG(TIME_TO_SEC(time))), '%H:%i') as avgTime
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    // 6. Ratxa màxima de dies consecutius
    const [allDates] = await db.query(`
      SELECT DISTINCT DATE_FORMAT(date, '%Y-%m-%d') as date
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `, [userId, startDate, endDate]);

    let maxStreak = 0;
    let currentStreak = 1;
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1].date);
      const curr = new Date(allDates[i].date);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    if (allDates.length > 0) maxStreak = Math.max(maxStreak, 1);

    // 7. Birres per mes (per al gràfic)
    const [beersByMonth] = await db.query(`
      SELECT 
        MONTH(date) as month,
        YEAR(date) as year,
        COUNT(*) as count
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY year ASC, month ASC
    `, [userId, startDate, endDate]);

    // 8. Birres per tipus (per al gràfic de pastís)
    const [beersByType] = await db.query(`
      SELECT b.name, COUNT(*) as count
      FROM users_beers ub
      JOIN beers b ON ub.beer_id = b.id
      WHERE ub.user_id = ? AND ub.date BETWEEN ? AND ?
      GROUP BY b.id
      ORDER BY count DESC
    `, [userId, startDate, endDate]);

    // 9. Birres per moment del dia
    const [beersByMoment] = await db.query(`
      SELECT
        CASE
          WHEN TIME(time) >= '07:00:00' AND TIME(time) < '12:00:00' THEN 'Matí'
          WHEN TIME(time) >= '12:00:00' AND TIME(time) < '15:00:00' THEN 'Migdia'
          WHEN TIME(time) >= '15:00:00' AND TIME(time) < '20:00:00' THEN 'Tarda'
          WHEN TIME(time) >= '20:00:00' AND TIME(time) < '22:00:00' THEN 'Vespre'
          WHEN TIME(time) >= '22:00:00' AND TIME(time) > '01:00:00' THEN 'Nit'
          ELSE 'Matinada'
        END as moment,
        COUNT(*) as count
      FROM users_beers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY moment
      ORDER BY count DESC
    `, [userId, startDate, endDate]);

    // 10. Grup més actiu
    const [[bestGroup]] = await db.query(`
      SELECT g.name, COUNT(*) as count
      FROM users_beers ub
      JOIN group_members gm ON ub.user_id = gm.user_id
      JOIN groups g ON gm.group_id = g.id
      WHERE ub.user_id = ? AND ub.date BETWEEN ? AND ?
      GROUP BY g.id
      ORDER BY count DESC
      LIMIT 1
    `, [userId, startDate, endDate]);

    return {
      totals: {
        totalBeers: totals.totalBeers,
        totalMl: totals.totalMl,
        totalLiters: (totals.totalMl / 1000).toFixed(1),
      },
      favBeer: favBeer ? {
        name: favBeer.name,
        count: favBeer.count,
        percentage: totals.totalBeers > 0
          ? ((favBeer.count / totals.totalBeers) * 100).toFixed(1)
          : 0,
      } : null,
      bestMonth: bestMonth ? {
        month: bestMonth.month,
        year: bestMonth.year,
        count: bestMonth.count,
      } : null,
      bestDayOfWeek: bestDayOfWeek ? {
        day: bestDayOfWeek.day_of_week,
        count: bestDayOfWeek.count,
      } : null,
      avgTime: avgTime?.avgTime ?? null,
      maxStreak,
      charts: {
        beersByMonth,
        beersByType,
        beersByMoment,
      },
      bestGroup: bestGroup ? {
        name: bestGroup.name,
        count: bestGroup.count,
      } : null,
    };
  },
};

export default UserModel;
