import UserModel from '../models/user.model.js';

// GET /api/users/:id/start-day
const getStartDay = async (req, res) => {
  try {
    const { id } = req.params;
    const startDay = await UserModel.getStartDay(id);

    if (!startDay) {
      return res.status(404).json({ message: 'Encara no té startDay' });
    }

    return res.status(200).json({ startDay });
  } catch (error) {
    console.error('Error al obtenir startDay:', error);
    return res.status(500).json({ message: 'Error al obtenir startDay' });
  }
};

// POST /api/users/:id/start-day
const setStartDay = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDay } = req.body;
    
    if (!startDay) {
      return res.status(400).json({ message: 'Cal proporcionar una data' });
    }
    
    const existing = await UserModel.getStartDay(id);
    if (existing) {
      return res.status(400).json({ message: 'Ja existeix un startDay, fes servir PUT' });
    }

    const savedDay = await UserModel.setStartDay(id, startDay);

    return res.status(201).json({ message: 'startDay creat correctament', startDay: savedDay });
  } catch (error) {
    console.error('Error al establir startDay:', error);
    return res.status(500).json({ message: 'Error al establir startDay' });
  }
};

// PUT /api/users/:id/start-day
const updateStartDay = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDay } = req.body;

    if (!startDay) {
      return res.status(400).json({ message: 'Cal proporcionar una nova data' });
    }

    const savedDay = await UserModel.setStartDay(id, startDay);

    return res.status(200).json({ message: 'startDay actualitzat', startDay: savedDay });
  } catch (error) {
    console.error('Error al modificar startDay:', error);
    return res.status(500).json({ message: 'Error al modificar startDay' });
  }
};

export default {
  getStartDay,
  setStartDay,
  updateStartDay,
};
