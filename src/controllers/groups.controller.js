// src/controllers/groups.controller.js
import GroupsModel from '../models/groups.model.js';

// POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id; // ve del token

    if (!name) {
      return res.status(400).json({ message: 'Cal proporcionar un nom de grup' });
    }

    const { groupId, code } = await GroupsModel.createGroup(name, description, ownerId);
    return res.status(201).json({ message: 'Grup creat correctament', groupId, code });
  } catch (error) {
    console.error('Error al crear el grup:', error);
    return res.status(500).json({ message: 'Error al crear el grup' });
  }
};

// POST /api/groups/:id/join
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params; // userId
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Cal proporcionar un codi de grup' });
    }

    const groupId = await GroupsModel.joinGroup(id, code);
    return res.status(200).json({ message: 'T\'has unit al grup correctament', groupId });
  } catch (error) {
    if (error.message === 'Grup no trobat') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Ja ets membre d\'aquest grup') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Error al unir-se al grup:', error);
    return res.status(500).json({ message: 'Error al unir-se al grup' });
  }
};

// GET /api/groups/:id
const getAllUserGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const groups = await GroupsModel.getAllUserGroups(id);
    return res.status(200).json({ groups });
  } catch (error) {
    console.error('Error al obtenir els grups:', error);
    return res.status(500).json({ message: 'Error al obtenir els grups' });
  }
};

// GET /api/groups/:groupId/history
const getGroupBeersHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date } = req.query;
    const history = await GroupsModel.getGroupBeersHistory(groupId, date);

    const PORT = process.env.PORT || 3100;
    const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

    const historyWithUrls = history.map(entry => ({
      ...entry,
      profile_image: entry.profile_image
        ? `${baseUrl}${entry.profile_image}`
        : null,
    }));

    return res.status(200).json({ history: historyWithUrls });
  } catch (error) {
    console.error('Error al obtenir l\'historial:', error);
    return res.status(500).json({ message: 'Error al obtenir l\'historial del grup' });
  }
};

const getMeetupAttendees = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const attendees = await GroupsModel.getMeetupAttendees(meetupId);

    const PORT = process.env.PORT || 3100;
    const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

    const attendeesWithUrls = attendees.map(a => ({
      ...a,
      profile_image: a.profile_image ? `${baseUrl}${a.profile_image}` : null,
    }));

    return res.status(200).json({ attendees: attendeesWithUrls });
  } catch (error) {
    console.error('Error al obtenir assistents:', error);
    return res.status(500).json({ message: 'Error al obtenir els assistents' });
  }
};

// POST /api/groups/:groupId/meetups
const createMeetup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date, time, location } = req.body;
    const creatorId = req.user.id;

    if (!date || !time) {
      return res.status(400).json({ message: 'Cal proporcionar data i hora' });
    }

    const meetupId = await GroupsModel.createMeetup(groupId, creatorId, date, time, location);
    return res.status(201).json({ message: 'Quedada creada correctament', meetupId });
  } catch (error) {
    console.error('Error al crear la quedada:', error);
    return res.status(500).json({ message: 'Error al crear la quedada' });
  }
};

// GET /api/groups/:groupId/meetups
const getGroupMeetups = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date } = req.query;
    const meetups = await GroupsModel.getGroupMeetups(groupId, date);
    return res.status(200).json({ meetups });
  } catch (error) {
    console.error('Error al obtenir les quedades:', error);
    return res.status(500).json({ message: 'Error al obtenir les quedades' });
  }
};

// POST /api/groups/:groupId/meetups/:id/:meetupId/attend
const attendToMeetUp = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const userId = req.user.id;

    await GroupsModel.attendToMeetUp(meetupId, userId);
    return res.status(200).json({ message: 'T\'has apuntat a la quedada correctament' });
  } catch (error) {
    if (error.message === 'Ja estàs apuntat a aquesta quedada') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Error al apuntar-se a la quedada:', error);
    return res.status(500).json({ message: 'Error al apuntar-se a la quedada' });
  }
};

const getMembersOfGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await GroupsModel.getMembersOfGroup(groupId);

    const PORT = process.env.PORT || 3100;
    const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

    const membersWithUrls = members.map(m => ({
      ...m,
      profile_image: m.profile_image ? `${baseUrl}${m.profile_image}` : null,
    }));

    return res.status(200).json({ members: membersWithUrls });
  } catch (error) {
    console.error('Error al obtenir membres:', error);
    return res.status(500).json({ message: 'Error al obtenir els membres' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user.id;

    // Comprovem que el que fa la petició és admin o owner
    const requesterRole = await GroupsModel.getUserRole(groupId, requesterId);
    if (!['admin', 'owner'].includes(requesterRole)) {
      return res.status(403).json({ message: 'No tens permisos per eliminar membres' });
    }

    // No es pot eliminar l'owner
    const targetRole = await GroupsModel.getUserRole(groupId, userId);
    if (targetRole === 'owner') {
      return res.status(403).json({ message: 'No es pot eliminar el propietari del grup' });
    }

    await GroupsModel.removeMember(groupId, userId);
    return res.status(200).json({ message: 'Membre eliminat correctament' });
  } catch (error) {
    console.error('Error al eliminar membre:', error);
    return res.status(500).json({ message: 'Error al eliminar el membre' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol no vàlid' });
    }

    // Comprovem que el que fa la petició és admin o owner
    const requesterRole = await GroupsModel.getUserRole(groupId, requesterId);
    if (!['admin', 'owner'].includes(requesterRole)) {
      return res.status(403).json({ message: 'No tens permisos per canviar rols' });
    }

    // No es pot canviar el rol de l'owner
    const targetRole = await GroupsModel.getUserRole(groupId, userId);
    if (targetRole === 'owner') {
      return res.status(403).json({ message: 'No es pot canviar el rol del propietari' });
    }

    await GroupsModel.updateMemberRole(groupId, userId, role);
    return res.status(200).json({ message: 'Rol actualitzat correctament' });
  } catch (error) {
    console.error('Error al actualitzar rol:', error);
    return res.status(500).json({ message: 'Error al actualitzar el rol' });
  }
};

export default {
  createGroup,
  joinGroup,
  getAllUserGroups,
  getGroupBeersHistory,
  getMeetupAttendees,
  createMeetup,
  getGroupMeetups,
  attendToMeetUp,
  getMembersOfGroup,
  removeMember,
  updateMemberRole,
};