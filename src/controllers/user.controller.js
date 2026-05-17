import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

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

    // Comprovem si el Wrapped havia tocat abans de canviar la data
    const currentData = await UserModel.getWrappedStatus(id);
    if (currentData?.startDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const wrappedDate = new Date(currentData.startDay);
      wrappedDate.setFullYear(wrappedDate.getFullYear() + 1);
      wrappedDate.setHours(0, 0, 0, 0);
      
      if (today >= wrappedDate) {
        //await UserModel.setWrappedResetAt(id);
        await UserModel.setWrappedResetAt(id, currentData.startDay);
      }
    }

    const savedDay = await UserModel.setStartDay(id, startDay);
    return res.status(200).json({ message: 'startDay actualitzat', startDay: savedDay });

  } catch (error) {
    console.error('Error al modificar startDay:', error);
    return res.status(500).json({ message: 'Error al modificar startDay' });
  }
};

// Configuració de multer per a les fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.params.id}${ext}`); // ex: user_3.jpg
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB màxim
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format no permès'));
  },
}).single('photo');

// GET /api/users/:id
const getUserData = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.getUserData(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const PORT = process.env.PORT || 3100;
    const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

    return res.status(200).json({
      user: {
        ...user,
        profile_image: user.profile_image
          ? `${baseUrl}${user.profile_image}`
          : null,
      },
    });
  } catch (error) {
    console.error('Error al obtenir usuari:', error);
    return res.status(500).json({ message: 'Error al obtenir les dades de l\'usuari' });
  }
};

// PUT /api/users/:id/username
const updateUsername = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'El username ha de tenir mínim 3 caràcters' });
    }

    await UserModel.updateUsername(id, username.trim());
    return res.status(200).json({ message: 'Username actualitzat correctament' });
  } catch (error) {
    if (error.message === 'USERNAME_TAKEN') {
      return res.status(409).json({ message: 'Aquest username ja està en ús' });
    }
    console.error('Error al actualitzar username:', error);
    return res.status(500).json({ message: 'Error al actualitzar el username' });
  }
};

// PUT /api/users/:id/email
const updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Email no vàlid' });
    }

    await UserModel.updateEmail(id, email.trim());
    return res.status(200).json({ message: 'Email actualitzat correctament' });
  } catch (error) {
    if (error.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ message: 'Aquest email ja està en ús' });
    }
    console.error('Error al actualitzar email:', error);
    return res.status(500).json({ message: 'Error al actualitzar el email' });
  }
};

// PUT /api/users/:id/password
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Cal proporcionar la contrasenya actual i la nova' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nova contrasenya ha de tenir mínim 6 caràcters' });
    }

    const currentHash = await UserModel.getUserPassword(id);
    const isValid = await bcrypt.compare(currentPassword, currentHash);

    if (!isValid) {
      return res.status(401).json({ message: 'La contrasenya actual no és correcta' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(id, hashed);

    return res.status(200).json({ message: 'Contrasenya actualitzada correctament' });
  } catch (error) {
    console.error('Error al actualitzar contrasenya:', error);
    return res.status(500).json({ message: 'Error al actualitzar la contrasenya' });
  }
};

// PUT /api/users/:id/photo
const updateProfileImage = (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Cal adjuntar una imatge' });
    }

    try {
      const { id } = req.params;
      const imagePath = `/images/profiles/${req.file.filename}`;
      await UserModel.updateProfileImage(id, imagePath);

      const PORT = process.env.PORT || 3100;
      const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

      return res.status(200).json({
        message: 'Foto de perfil actualitzada correctament',
        profile_image: `${baseUrl}${imagePath}`,
      });
    } catch (error) {
      console.error('Error al actualitzar foto:', error);
      return res.status(500).json({ message: 'Error al actualitzar la foto de perfil' });
    }
  });
};

// GET /api/users/:id/wrapped-status
const getWrappedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await UserModel.getWrappedStatus(id);

    if (!data || !data.startDay) {
      return res.status(200).json({ show: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const wrappedDate = new Date(data.startDay);
    wrappedDate.setFullYear(wrappedDate.getFullYear() + 1);
    wrappedDate.setHours(0, 0, 0, 0);

    // Primer comprovem si cal mostrar el banner (independentment del reset)
    // perquè els 7 dies del banner han de respectar-se sempre
    if (data.wrapped_seen_at) {
      const seenAt = new Date(data.wrapped_seen_at);
      seenAt.setHours(0, 0, 0, 0);
      const daysSinceSeen = Math.floor((today - seenAt) / (1000 * 60 * 60 * 24));

      if (daysSinceSeen <= 7) {
        return res.status(200).json({ show: true, type: 'banner' });
      }
    }

    // Encara no toca el Wrapped
    if (today < wrappedDate) {
      return res.status(200).json({ show: false });
    }

    // L'usuari ha fet reset després que toqués el Wrapped
    if (data.wrapped_reset_at) {
      const resetAt = new Date(data.wrapped_reset_at);
      resetAt.setHours(0, 0, 0, 0);
      if (resetAt >= wrappedDate) {
        return res.status(200).json({ show: false });
      }
    }

    // Toca el Wrapped i no l'ha vist encara — mostra el pop-up
    return res.status(200).json({ show: true, type: 'popup' });

  } catch (error) {
    console.error('Error al obtenir wrapped status:', error);
    return res.status(500).json({ message: 'Error al obtenir el wrapped status' });
  }
};

// PUT /api/users/:id/wrapped-seen
const updateWrappedSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await UserModel.setWrappedSeenAt(id);
    return res.status(200).json({ message: 'wrapped_seen_at actualitzat correctament' });
  } catch (error) {
    console.error('Error al actualitzar wrapped_seen_at:', error);
    return res.status(500).json({ message: 'Error al actualitzar wrapped_seen_at' });
  }
};

const getWrappedData = async (req, res) => {
  try {
    const { id } = req.params;
    const { today } = req.query;

    if (!today) {
      return res.status(400).json({ message: 'Cal proporcionar la data actual' });
    }

    const user = await UserModel.getWrappedStatus(id);

    if (!user?.startDay) {
      return res.status(400).json({ message: 'No hi ha dades del Wrapped' });
    }

    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    const startDayDate = new Date(user.startDay);
    startDayDate.setHours(0, 0, 0, 0);

    const startDate = startDayDate < todayDate ? user.startDay : user.wrapped_season_start;

    if (!startDate) {
      return res.status(400).json({ message: 'No hi ha dades del Wrapped' });
    }

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const data = await UserModel.getWrappedData(id, startDate, endDateStr);
    return res.status(200).json({ wrapped: data });

  } catch (error) {
    console.error('Error al obtenir wrapped:', error);
    return res.status(500).json({ message: 'Error al obtenir el wrapped' });
  }
};

export default {
  getStartDay,
  setStartDay,
  updateStartDay,
  getUserData,
  updateUsername,
  updateEmail,
  updatePassword,
  updateProfileImage,
  getWrappedStatus,
  updateWrappedSeen,
  getWrappedData,
};
