import type { Request, Response } from 'express';
import { calcFees } from '../utils/pricing';

export function registerFeesRoutes(app: import('express').Express) {
  app.get('/api/fees/estimate', (req: Request, res: Response) => {
    const price = Math.max(0, parseInt(String(req.query.price || 0), 10) || 0);
    return res.json(calcFees(price));
  });
}
