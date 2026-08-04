import { Request, Response } from 'express';
import status from 'http-status';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { ChatService } from './chat.service';

const getOrCreateConversation = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { ownerId } = req.body;

  const result = await ChatService.getOrCreateConversation(user.userId, ownerId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Conversation fetched successfully',
    data: result,
  });
});

const getMyConversations = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const result = await ChatService.getMyConversations(user.userId, user.role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Conversations fetched successfully',
    data: result,
  });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { conversationId } = req.params;

  const result = await ChatService.getMessages(conversationId as string, user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Messages fetched successfully',
    data: result,
  });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const result = await ChatService.getUnreadCount(user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Unread count fetched',
    data: { count: result },
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { conversationId, content } = req.body;

  const result = await ChatService.sendMessage(conversationId, user.userId, content);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const markRead = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { conversationId } = req.params;

  const result = await ChatService.markRead(conversationId as string, user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Messages marked as read successfully',
    data: result,
  });
});

const getRealtimeToken = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || 'supabase-jwt-secret-placeholder-minimum-32-chars';

  const token = jwt.sign(
    {
      role: 'anon',
      sub: user.userId,
      email: user.email,
      iss: 'supabase',
    },
    supabaseJwtSecret,
    { expiresIn: '1d' }
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Realtime token generated successfully',
    data: { token },
  });
});

export const ChatController = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  getUnreadCount,
  sendMessage,
  markRead,
  getRealtimeToken,
};