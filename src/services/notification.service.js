import { messaging } from '../config/firebase.js';
import NotificationsModel from '../models/notification.model.js';

const notifyGroupMembers = async (groupId, excludeUserId, title, body) => {
  const tokens = await NotificationsModel.getGroupMemberTokens(groupId, excludeUserId);

  if (tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: {
        type: 'meetup',
        groupId: String(groupId),
    },
  });

  // Neteja tokens invàlids (usuari ha desinstal·lat l'app, etc.)
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
      NotificationsModel.deleteTokenByValue(tokens[idx]).catch(() => {});
    }
  });
};

export default { notifyGroupMembers };