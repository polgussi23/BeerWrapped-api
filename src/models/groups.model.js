// src/models/groups.model.js
import db from '../config/db.config.js';

const generateGroupCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
};

const GroupsModel = {

  createGroup: async (name, description, ownerId) => {
    const code = generateGroupCode();
    const [result] = await db.query(
      'INSERT INTO groups (name, description, code, owner_id) VALUES (?, ?, ?, ?)',
      [name, description, code, ownerId]
    );
    const groupId = result.insertId;

    // El creador s'afegeix com a owner, no com a user!
    await db.query(
      'INSERT INTO group_members (user_id, group_id, role) VALUES (?, ?, ?)',
      [ownerId, groupId, 'owner']
    );

    return { groupId, code };
  },

  joinGroup: async (userId, code) => {
    // Busquem el grup pel codi
    const [groups] = await db.query(
      'SELECT id FROM groups WHERE code = ?',
      [code]
    );

    if (groups.length === 0) {
      throw new Error('Grup no trobat');
    }

    const groupId = groups[0].id;

    // Comprovem si ja és membre
    const [existing] = await db.query(
      'SELECT id FROM group_members WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );

    if (existing.length > 0) {
      throw new Error('Ja ets membre d\'aquest grup');
    }

    await db.query(
      'INSERT INTO group_members (user_id, group_id) VALUES (?, ?)',
      [userId, groupId]
    );

    return groupId;
  },

  getAllUserGroups: async (userId) => {
    const [rows] = await db.query(
      'SELECT g.id, g.name, g.description, g.code, g.owner_id ' +
      'FROM groups as g ' +
      'JOIN group_members as gm ON g.id = gm.group_id ' +
      'WHERE gm.user_id = ?',
      [userId]
    );
    return rows;
  },

  getGroupBeersHistory: async (groupId, date) => {
    const [rows] = await db.query(
      'SELECT u.username, b.name, DATE_FORMAT(ub.date, "%Y-%m-%d") as date, ub.time, ub.day_of_week ' +
      'FROM users_beers as ub ' +
      'JOIN users as u ON ub.user_id = u.id ' +
      'JOIN beers as b ON ub.beer_id = b.id ' +
      'JOIN group_members as gm ON u.id = gm.user_id ' +
      'WHERE gm.group_id = ? and ub.date >= ?' +
      'ORDER BY ub.date DESC, ub.time DESC',
      [groupId, date]
    );
    return rows;
  },

  createMeetup: async (groupId, creatorId, date, time, location) => {
    const [result] = await db.query(
      'INSERT INTO meetups (group_id, creator_id, date, time, location) VALUES (?, ?, ?, ?, ?)',
      [groupId, creatorId, date, time, location]
    );
    return result.insertId;
  },

  getGroupMeetups: async (groupId, date) => {
    const [rows] = await db.query(
      'SELECT m.id, DATE_FORMAT(m.date, "%Y-%m-%d") as date, m.time, m.location, u.username as creator, ' +
      'COUNT(ma.user_id) as attendees_count ' +
      'FROM meetups as m ' +
      'JOIN users as u ON m.creator_id = u.id ' +
      'LEFT JOIN meetup_attendees as ma ON m.id = ma.meetup_id ' +
      'WHERE m.group_id = ? and m.date >= ? ' +
      'GROUP BY m.id ' +
      'ORDER BY m.date ASC, m.time ASC',
      [groupId, date]
    );
    return rows;
  },

  attendToMeetUp: async (meetupId, userId) => {
    const [existing] = await db.query(
      'SELECT id FROM meetup_attendees WHERE meetup_id = ? AND user_id = ?',
      [meetupId, userId]
    );

    if (existing.length > 0) {
      throw new Error('Ja estàs apuntat a aquesta quedada');
    }

    await db.query(
      'INSERT INTO meetup_attendees (meetup_id, user_id) VALUES (?, ?)',
      [meetupId, userId]
    );
  },

  getGroupBeersHistory: async (groupId, date) => {
    const [rows] = await db.query(
      'SELECT u.username, u.profile_image, b.name, DATE_FORMAT(ub.date, "%Y-%m-%d") as date, ub.time, ub.day_of_week ' +
      'FROM users_beers as ub ' +
      'JOIN users as u ON ub.user_id = u.id ' +
      'JOIN beers as b ON ub.beer_id = b.id ' +
      'JOIN group_members as gm ON u.id = gm.user_id ' +
      'WHERE gm.group_id = ? AND ub.date >= ?' +
      'ORDER BY ub.date DESC, ub.time DESC',
      [groupId, date]
    );
    return rows;
  },

  getMeetupAttendees: async (meetupId) => {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.profile_image ' +
      'FROM meetup_attendees as ma ' +
      'JOIN users as u ON ma.user_id = u.id ' +
      'WHERE ma.meetup_id = ?',
      [meetupId]
    );
    return rows;
  },

  getMembersOfGroup: async (groupId) => {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.profile_image, gm.role ' +
      'FROM users as u ' +
      'JOIN group_members as gm ON u.id = gm.user_id ' +
      'WHERE gm.group_id = ?',
      [groupId]
    );
    return rows;
  },

  removeMember: async (groupId, userId) => {
    await db.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
  },

  updateMemberRole: async (groupId, userId, role) => {
    await db.query(
      'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
      [role, groupId, userId]
    );
  },

  getUserRole: async (groupId, userId) => {
    const [rows] = await db.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows[0]?.role ?? null;
  },
};

export default GroupsModel;