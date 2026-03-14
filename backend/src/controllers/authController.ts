import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import admin from "../lib/firebaseAdmin";
import Profile from "../models/Profile";

const JWT_SECRET = process.env.JWT_SECRET || "jobie_secret";

const computeCompleteness = (data: any): number => {
  let score = 0;
  if (data.bio) score += 10;
  if (data.headline) score += 5;
  if (data.location) score += 5;
  if (data.phone) score += 5;
  if (data.website) score += 5;
  if (data.linkedin) score += 5;
  if (data.avatarUrl) score += 5;
  if (data.resumeUrl) score += 5;
  if (data.skills?.length > 0) score += 20;
  if (data.experience?.length > 0) score += 20;
  if (data.education?.length > 0) score += 15;
  if (data.projects?.length > 0) score += 20;
  if (data.githubUsername) score += 10;
  if (data.githubVerifiedSkills?.length > 0) score += 5;
  return score;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || "candidate" });

    const token = jwt.sign(
      { id: (user as any).id, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: (user as any).id, name: (user as any).name, email: (user as any).email, role: (user as any).role }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!(user as any).password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, (user as any).password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: (user as any).id, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: { id: (user as any).id, name: (user as any).name, email: (user as any).email, role: (user as any).role }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

export const firebaseLogin = async (req: Request, res: Response) => {
  const { token, githubUsername, githubUid } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Missing Firebase token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Firebase account has no email" });
    }

    let user = await User.findOne({ where: { firebaseUid: uid } });

    if (!user) {
      user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          name: name || "Firebase User",
          email,
          firebaseUid: uid,
          role: "candidate"
        });
      } else {
        (user as any).firebaseUid = uid;
        await (user as any).save();
      }
    }

    if (githubUid) {
      (user as any).githubUid = String(githubUid);
      await (user as any).save();
    }

    if (githubUsername) {
      const profile = await Profile.findOne({ where: { userId: (user as any).id } });
      if (!profile) {
        const profileCompleteness = computeCompleteness({ githubUsername });
        await Profile.create({
          userId: (user as any).id,
          githubUsername,
          profileCompleteness
        });
      } else {
        const updated = { ...(profile as any).dataValues, githubUsername };
        const profileCompleteness = computeCompleteness(updated);
        await profile.update({ githubUsername, profileCompleteness });
      }
    }

    const jwtToken = jwt.sign(
      { id: (user as any).id, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        id: (user as any).id,
        name: (user as any).name,
        email: (user as any).email,
        role: (user as any).role
      }
    });
  } catch (error) {
    console.error("Firebase login failed:", error);
    res.status(500).json({ message: "Firebase login failed", error });
  }
};
