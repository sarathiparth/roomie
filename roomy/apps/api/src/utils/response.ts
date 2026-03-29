import { ApiResponse } from '@roomy/types';
import { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Response {
  return res.status(200).json({
    success: true,
    data: { items, total, page, pageSize, hasMore: page * pageSize < total },
  });
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
