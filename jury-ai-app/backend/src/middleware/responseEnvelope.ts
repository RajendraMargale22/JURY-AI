import { NextFunction, Request, Response } from 'express';

export const responseEnvelope = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = ((payload: any) => {
    const requestId = req.requestId;
    const statusCode = res.statusCode || 200;
    const isError = statusCode >= 400;

    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.success === 'boolean' &&
      typeof payload.message === 'string' &&
      'data' in payload &&
      'requestId' in payload
    ) {
      return originalJson(payload);
    }

    if (isError) {
      const message = payload?.message || payload?.error || 'Request failed';
      const errors = payload?.errors;
      const data = payload?.data ?? null;
      return originalJson({
        success: false,
        message,
        data,
        ...(errors ? { errors } : {}),
        requestId,
      });
    }

    const message = payload?.message || 'OK';
    let data = payload;
    if (payload && typeof payload === 'object') {
      const { message: _m, success: _s, requestId: _r, ...rest } = payload;
      data = Object.keys(rest).length ? rest : payload;
    }

    return originalJson({
      success: true,
      message,
      data,
      requestId,
      ...(payload && typeof payload === 'object' ? payload : {}),
    });
  }) as Response['json'];

  next();
};
