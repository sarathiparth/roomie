import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as groupsService from './groups.service.js';

export const groupsRouter = Router();

/** GET /api/groups */
groupsRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const groups = await groupsService.getUserGroups(req.userId!);
    ok(res, groups);
  } catch (err) { next(err); }
});

/** POST /api/groups */
groupsRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name) throw new ValidationError('name is required');
    const group = await groupsService.createGroup(req.userId!, name, description, memberIds ?? []);
    created(res, group);
  } catch (err) { next(err); }
});

/** GET /api/groups/:id */
groupsRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const group = await groupsService.getGroup(req.params.id, req.userId!);
    ok(res, group);
  } catch (err) { next(err); }
});

/** POST /api/groups/:id/members */
groupsRouter.post('/:id/members', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new ValidationError('userId is required');
    const member = await groupsService.addMember(req.params.id, req.userId!, userId);
    created(res, member);
  } catch (err) { next(err); }
});

/** DELETE /api/groups/:id/members/:uid */
groupsRouter.delete('/:id/members/:uid', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await groupsService.removeMember(req.params.id, req.userId!, req.params.uid);
    res.status(204).send();
  } catch (err) { next(err); }
});
