// src/models/beers.model.js
import db from '../config/db.config.js';

const NotificactionModel = {
    addUserDeviceToken: async(userId, token, platform) => {
        await db.query(
            'INSERT INTO device_tokens (user_id, fcm_token, platform) '+
            'VALUES (?, ?, ?) ' + 
            'ON DUPLICATE KEY UPDATE user_id = ?, created_at = NOW() ',
            [userId, token, platform, userId]
        );
    },

    deleteUserDeviceToken: async(userId, token) => {
        const [result] = await db.query(
            'DELETE FROM device_tokens '+
            'WHERE user_id=? AND fcm_token=? ',
            [userId, token]
        );
        if(result.affectedRows === 0){
            throw new Error('User Device Token not found');
        }
    },

    deleteTokenByValue: async (token) => {
        await db.query('DELETE FROM device_tokens WHERE fcm_token = ?', [token]);
    },


    getGroupMemberTokens: async (groupId, excludeUserId) => {
        const [rows] = await db.query(
            `SELECT dt.fcm_token
            FROM device_tokens dt
            JOIN group_members gm ON gm.user_id = dt.user_id
            WHERE gm.group_id = ? AND dt.user_id != ?`,
            [groupId, excludeUserId]
        );
        return rows.map(r => r.fcm_token);
    },
};

export default NotificactionModel;
