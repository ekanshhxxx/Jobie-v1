import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ✅ JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "jobie_secret";

// ✅ Custom Request type jisme user attach hoga
export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// ✅ Token verify middleware
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = decoded; // user info attach
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Role-based middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
