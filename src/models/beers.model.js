// src/models/beers.model.js
import db from '../config/db.config.js';

const BeersModel = {
    getAllBeers: async() => {
        const [rows] = await db.query('SELECT id, name, image_url FROM beers');
        return rows;
    },

    getLast3DaysUserBeers: async(userId, date) => {
        const [rows] = await db.query(
            'SELECT ub.id, b.name, DATE_FORMAT(ub.date, "%Y-%m-%d") as date, ub.time, ub.day_of_week FROM users_beers as ub ' +
            'JOIN beers as b ON ub.beer_id=b.id ' +
            'WHERE ub.user_id = ? and ub.date >= ?',
            [userId, date]
        );
        return rows;
    },

    addBeerToUser: async(userId, beerId, date, time, dayOfWeek) => {
        const [result] = await db.query(
            'INSERT INTO users_beers (user_id, beer_id, date, time, day_of_week)' +
            'VALUES (?, ?, ?, ?, ?)',
        [userId, beerId, date, time, dayOfWeek]);
        return result.insertId;
    },
    
    deleteUserBeer: async(userId, beerId) => {
        const [result] = await db.query(
            'DELETE FROM users_beers WHERE user_id = ? and id = ?',
            [userId, beerId]
        );
        return;
    }
};

export default BeersModel;
