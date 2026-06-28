import NotificationModel from '../models/notification.model.js';

// GET /api/beers/
const postUserDeviceToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { deviceToken } = req.body;
        await NotificationModel.addUserDeviceToken(id, deviceToken, "android");
        return res.status(200).json({ message: "Device Token registrat correctament" });
    } catch (error) {
        console.log(`Error al guardar Device Token: ${error}`);
        return res.status(500).json({ message: "Error al guardar Device Token" });
    }
};

const deleteUserDeviceToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { deviceToken } = req.body;
        await NotificationModel.deleteUserDeviceToken(id, deviceToken);
        return res.status(200).json({ message: "Device Token eliminat correctament" });
    } catch (error) {
        console.log(`Error al eliminar Device Token: ${error}`);
        return res.status(500).json({ message: `Error al eliminar Device Token: ${error}` });
    }
}




export default {
  postUserDeviceToken,
  deleteUserDeviceToken
};
