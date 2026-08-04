import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { ChatController } from './chat.controller';

const router = Router();

const ALL_ROLES = [Role.STUDENT, Role.OWNER];

router.post(
  '/conversation',
  checkAuth(Role.STUDENT),
  ChatController.getOrCreateConversation,
);

router.get(
  '/conversations',
  checkAuth(...ALL_ROLES),
  ChatController.getMyConversations,
);

router.get(
  '/messages/:conversationId',
  checkAuth(...ALL_ROLES),
  ChatController.getMessages,
);

router.post(
  '/messages',
  checkAuth(...ALL_ROLES),
  ChatController.sendMessage,
);

router.post(
  '/mark-read/:conversationId',
  checkAuth(...ALL_ROLES),
  ChatController.markRead,
);

router.get(
  '/realtime-token',
  checkAuth(...ALL_ROLES),
  ChatController.getRealtimeToken,
);

router.get(
  '/unread-count',
  checkAuth(...ALL_ROLES),
  ChatController.getUnreadCount,
);

export const ChatRoutes = router;