import { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: "Authentication required" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = (req as any).user;
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}