import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as chatService from './chat.service.js';

export const chatRouter = Router();

/** GET /api/chats */
chatRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const chats = await chatService.getUserChats(req.userId!);
    ok(res, chats);
  } catch (err) { next(err); }
});

/** GET /api/chats/:chatId/messages */
chatRouter.get('/:chatId/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const result = await chatService.getMessages(req.params.chatId, req.userId!, page);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/** POST /api/chats/:chatId/messages — REST fallback if WebSocket unavailable */
chatRouter.post('/:chatId/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content, type } = req.body;
    if (!content) throw new ValidationError('content is required');
    const message = await chatService.sendMessage(req.params.chatId, req.userId!, content, type);
    ok(res, message, 201);
  } catch (err) { next(err); }
});
