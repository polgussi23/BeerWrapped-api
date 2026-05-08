// src/models/beers.model.js
import db from '../config/db.config.js';

const BeersModel = {
    getAllBeers: async() => {
        const [rows] = await db.query('SELECT id, name, image_url FROM beers');
        return rows;
    },

    addBeerToUser: async(userId, beerId, date, time, dayOfWeek) => {
        const [result] = await db.query(
            'INSERT INTO users_beers (user_id, beer_id, date, time, day_of_week)' +
            'VALUES (?, ?, ?, ?, ?)',
        [userId, beerId, date, time, dayOfWeek]);
        return result.insertId;
    }
};

export default BeersModel;
