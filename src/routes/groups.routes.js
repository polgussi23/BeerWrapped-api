import express from 'express';
import groupsController from '../controllers/groups.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('', authenticateToken, groupsController.createGroup);
router.post('/:id/join', authenticateToken, authorizeSelf, groupsController.joinGroup);
router.get('/:id', authenticateToken, authorizeSelf, groupsController.getAllUserGroups);

router.get('/:groupId/members', authenticateToken, groupsController.getMembersOfGroup);
router.delete('/:groupId/members/:userId', authenticateToken, groupsController.removeMember);
router.put('/:groupId/members/:userId/role', authenticateToken, groupsController.updateMemberRole);
router.get('/:groupId/history', authenticateToken, groupsController.getGroupBeersHistory);

router.post('/:groupId/meetups', authenticateToken, groupsController.createMeetup);
router.get('/:groupId/meetups', authenticateToken, groupsController.getGroupMeetups);
router.post('/:groupId/meetups/:id/:meetupId/attend', authenticateToken, authorizeSelf, groupsController.attendToMeetUp);
router.get('/:groupId/meetups/:meetupId/attendees', authenticateToken, groupsController.getMeetupAttendees);

export default router;
