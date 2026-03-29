import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as chatService from '../services/chat/chat.service.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@roomy/types';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: Token missing'));

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
      socket.data.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId}`);

    // Join personal room for direct user events (like new matches)
    socket.join(`user:${userId}`);
    socket.broadcast.emit('user:online', { userId, online: true });

    // Chat events
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('chat:message', async (data) => {
      try {
        const message = await chatService.sendMessage(data.chatId, userId, data.content, data.type);
        // Broadcast to everyone in the chat room
        io.to(`chat:${data.chatId}`).emit('chat:message', message);
      } catch (err) {
        console.error('[Socket] chat:message error', err);
      }
    });

    socket.on('chat:typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('chat:typing', {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      });
    });

    // WebRTC Signaling stubs
    socket.on('call:offer', (data) => socket.to(`chat:${data.chatId}`).emit('call:offer', data));
    socket.on('call:answer', (data) => socket.to(`chat:${data.chatId}`).emit('call:answer', data));
    socket.on('call:ice', (data) => socket.to(`chat:${data.chatId}`).emit('call:ice', data));
    socket.on('call:end', (data) => socket.to(`chat:${data.chatId}`).emit('call:end', data));

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      socket.broadcast.emit('user:online', { userId, online: false });
    });
  });

  return io;
}

export function getIo() {
  return io;
}
