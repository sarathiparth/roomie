import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { ok, created } from '../../utils/response.js';
import * as usersService from './users.service.js';

export const usersRouter = Router();

/** GET /api/users/me */
usersRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await usersService.getMe(req.userId!);
    ok(res, user);
  } catch (err) { next(err); }
});

/** PATCH /api/users/me */
usersRouter.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await usersService.updateProfile(req.userId!, req.body);
    ok(res, user);
  } catch (err) { next(err); }
});

/** POST /api/users/me/avatar */
usersRouter.post('/me/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const url = await usersService.uploadAvatar(req.userId!, req.file.buffer);
    ok(res, { avatarUrl: url });
  } catch (err) { next(err); }
});

/** GET /api/users/:id */
usersRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await usersService.getPublicProfile(req.params.id, req.userId);
    ok(res, profile);
  } catch (err) { next(err); }
});

/** DELETE /api/users/me */
usersRouter.delete('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await usersService.deleteAccount(req.userId!, req.userId!);
    res.status(204).send();
  } catch (err) { next(err); }
});
