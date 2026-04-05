import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../../lib/prisma';

export const initSocket = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // ─── User নিজের room এ join করবে (userId দিয়ে) ───────────────────
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their room`);
    });

    // ─── Conversation room এ join ─────────────────────────────────────
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`💬 Joined conversation room: ${conversationId}`);
    });

    // ─── Message পাঠানো ───────────────────────────────────────────────
    socket.on(
      'send_message',
      async (data: {
        conversationId: string;
        senderId: string;
        receiverId: string;
        content: string;
      }) => {
        try {
          const { conversationId, senderId, receiverId, content } = data;

          // DB তে save করো
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId,
              content,
            },
            include: {
              sender: {
                select: { id: true, name: true, image: true },
              },
            },
          });

          // conversation room এ সবাইকে পাঠাও
          io.to(conversationId).emit('receive_message', message);

          // receiver এর personal room এ notification পাঠাও
          io.to(receiverId).emit('new_message_notification', {
            conversationId,
            message,
          });
        } catch (err) {
          console.error('❌ send_message error:', err);
          socket.emit('error', { message: 'Message send failed' });
        }
      },
    );

    // ─── Typing indicator ─────────────────────────────────────────────
    socket.on(
      'typing',
      (data: { conversationId: string; senderId: string; senderName: string }) => {
        socket.to(data.conversationId).emit('user_typing', data);
      },
    );

    socket.on('stop_typing', (data: { conversationId: string; senderId: string }) => {
      socket.to(data.conversationId).emit('user_stop_typing', data);
    });

    // ─── Message read ─────────────────────────────────────────────────
    socket.on(
      'mark_read',
      async (data: { conversationId: string; userId: string }) => {
        await prisma.message.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: { not: data.userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        socket.to(data.conversationId).emit('messages_read', {
          conversationId: data.conversationId,
        });
      },
    );

    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });
  });
};