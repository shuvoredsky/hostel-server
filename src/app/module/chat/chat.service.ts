import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

// ─── Conversation খোঁজো বা তৈরি করো ──────────────────────────────────────────
const getOrCreateConversation = async (studentId: string, ownerId: string) => {
  let conversation = await prisma.conversation.findUnique({
    where: { studentId_ownerId: { studentId, ownerId } },
    include: {
      student: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { studentId, ownerId },
      include: {
        student: { select: { id: true, name: true, image: true } },
        owner: { select: { id: true, name: true, image: true } },
      },
    });
  }

  return conversation;
};

// ─── আমার সব conversation ─────────────────────────────────────────────────────
const getMyConversations = async (userId: string, role: string) => {
  const where =
    role === 'STUDENT' ? { studentId: userId } : { ownerId: userId };

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // শুধু last message
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations;
};

// ─── একটা conversation এর সব message ─────────────────────────────────────────
const getMessages = async (conversationId: string, userId: string) => {
  // verify user is part of this conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ studentId: userId }, { ownerId: userId }],
    },
  });

  if (!conversation) {
    throw new AppError(status.FORBIDDEN, 'Access denied');
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages;
};

// ─── Unread count ─────────────────────────────────────────────────────────────
const getUnreadCount = async (userId: string) => {
  const count = await prisma.message.count({
    where: {
      isRead: false,
      senderId: { not: userId },
      conversation: {
        OR: [{ studentId: userId }, { ownerId: userId }],
      },
    },
  });

  return count;
};

export const ChatService = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  getUnreadCount,
};