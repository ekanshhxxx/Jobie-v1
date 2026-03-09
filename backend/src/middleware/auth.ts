import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ✅ JWT verify middleware
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded; // user info attach kar diya (id, email, role)
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ✅ Role-based middleware
export const verifyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user: any = (req as any).user; // verifyJWT se user attach hota hai

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
