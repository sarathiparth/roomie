import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as eventsService from './events.service.js';

export const eventsRouter = Router();

/** GET /api/events */
eventsRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const events = await eventsService.getEvents(req.userId!, {
      groupId: req.query.groupId as string | undefined,
      upcoming: req.query.upcoming === 'true',
    });
    ok(res, events);
  } catch (err) { next(err); }
});

/** POST /api/events */
eventsRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, location, startsAt, endsAt, isPublic, groupId } = req.body;
    if (!title || !startsAt) throw new ValidationError('title and startsAt are required');
    const event = await eventsService.createEvent(req.userId!, {
      title, description, location, startsAt, endsAt, isPublic, groupId,
    });
    created(res, event);
  } catch (err) { next(err); }
});

/** GET /api/events/:id */
eventsRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const event = await eventsService.getEvent(req.params.id, req.userId!);
    ok(res, event);
  } catch (err) { next(err); }
});

/** POST /api/events/:id/attend */
eventsRouter.post('/:id/attend', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    if (!['GOING', 'MAYBE', 'NOT_GOING'].includes(status)) {
      throw new ValidationError('status must be GOING, MAYBE, or NOT_GOING');
    }
    const result = await eventsService.setAttendance(req.params.id, req.userId!, status);
    ok(res, result);
  } catch (err) { next(err); }
});
