import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { ChatController } from './chat.controller';

const router = Router();

router.post(
  '/conversation',
  checkAuth(Role.STUDENT),
  ChatController.getOrCreateConversation,
);

router.get(
  '/conversations',
  checkAuth(Role.STUDENT, Role.OWNER),
  ChatController.getMyConversations,
);

router.get(
  '/messages/:conversationId',
  checkAuth(Role.STUDENT, Role.OWNER),
  ChatController.getMessages,
);

router.get(
  '/unread-count',
  checkAuth(Role.STUDENT, Role.OWNER),
  ChatController.getUnreadCount,
);

export const ChatRoutes = router;