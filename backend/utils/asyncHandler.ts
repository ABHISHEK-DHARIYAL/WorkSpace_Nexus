import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRouteHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Eliminates the repeated `try { ... } catch (err) { res.status(500)... }`
 * boilerplate that was duplicated in every controller method. A rejected
 * promise (including a thrown AppError) is forwarded to `next`, where the
 * centralized `errorHandler` middleware takes over.
 */
export function asyncHandler<Req extends Request = Request>(
  handler: AsyncRouteHandler<Req>
): RequestHandler {
  return (req, res, next) => {
    handler(req as Req, res, next).catch(next);
  };
}
