import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import { upload } from '../../middleware/upload.js';
import * as listingsService from './listings.service.js';

export const listingsRouter = Router();

/** GET /api/listings */
listingsRouter.get('/', async (req, res, next) => {
  try {
    const result = await listingsService.getListings({
      city: req.query.city as string | undefined,
      maxRent: req.query.maxRent ? Number(req.query.maxRent) : undefined,
      page: Number(req.query.page ?? 1),
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/** POST /api/listings */
listingsRouter.post('/', authenticate, upload.array('photos', 8), async (req: AuthRequest, res, next) => {
  try {
    const { title, description, rent, deposit, location, area, city, roomDetails, currentTenants, availableFrom } = req.body;
    if (!title || !rent || !city) throw new ValidationError('title, rent, city are required');

    const files = req.files as Express.Multer.File[];
    const photoBuffers = files?.map(f => f.buffer) ?? [];

    const listing = await listingsService.createListing(req.userId!, {
      title, description, rent: Number(rent),
      deposit: deposit ? Number(deposit) : undefined,
      location, area, city,
      roomDetails: JSON.parse(roomDetails ?? '{}'),
      currentTenants: JSON.parse(currentTenants ?? '[]'),
      availableFrom,
    }, photoBuffers);

    created(res, listing);
  } catch (err) { next(err); }
});

/** PATCH /api/listings/:id */
listingsRouter.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const listing = await listingsService.updateListing(req.params.id, req.userId!, req.body);
    ok(res, listing);
  } catch (err) { next(err); }
});

/** POST /api/listings/:id/apply */
listingsRouter.post('/:id/apply', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const application = await listingsService.applyToListing(
      req.params.id, req.userId!, req.body.message,
    );
    created(res, application);
  } catch (err) { next(err); }
});

/** GET /api/listings/:id/applicants */
listingsRouter.get('/:id/applicants', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const applicants = await listingsService.getApplicants(req.params.id, req.userId!);
    ok(res, applicants);
  } catch (err) { next(err); }
});

/** PATCH /api/listings/:id/applicants/:appId */
listingsRouter.patch('/:id/applicants/:appId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new ValidationError('status must be ACCEPTED or REJECTED');
    const result = await listingsService.updateApplicationStatus(req.params.id, req.params.appId, req.userId!, status);
    ok(res, result);
  } catch (err) { next(err); }
});
