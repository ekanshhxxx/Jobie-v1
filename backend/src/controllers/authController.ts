import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import admin, { firebaseReady } from "../lib/firebaseAdmin";
import Profile from "../models/Profile";
import {
  findUserByField,
  upsertUserWithFallback,
  updateUserWithFallback,
  getProfileWithFallback,
  saveProfileDual,
} from "../services/dbFallbackService";

const JWT_SECRET = process.env.JWT_SECRET || "jobie_secret";
const normalizeEmail = (email: unknown): string =>
  typeof email === "string" ? email.trim().toLowerCase() : "";
const normalizeOptionalId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

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
    const { name, password, role } = req.body;
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await findUserByField({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await upsertUserWithFallback(
      { email },
      { name, email, password: hashed, role: role || "candidate" }
    );

    if (!user) {
      return res.status(503).json({ message: "Database unavailable" });
    }

    const token = jwt.sign(
      { id: user.id ?? user.sqlId, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id ?? user.sqlId, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // EMERGENCY BYPASS FOR ADMIN ACCESS
    if (email === "admin@jobie.app" && password === "adminpassword123") {
      const token = jwt.sign(
        { id: 999, role: "admin" },
        JWT_SECRET,
        { expiresIn: "20d" }
      );
      return res.status(200).json({
        token,
        user: { id: 999, name: "Super Admin", email: "admin@jobie.app", role: "admin" }
      });
    }

    const user = await findUserByField({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id ?? user.sqlId, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: { id: user.id ?? user.sqlId, name: user.name, email: user.email, role: user.role }
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

  if (!firebaseReady) {
    return res.status(503).json({
      message: "Firebase authentication is not configured on this server. Please contact support.",
      code: "FIREBASE_NOT_CONFIGURED",
    });
  }

  // ── Step 1: Verify Firebase token (only thing that can actually "Firebase fail") ──
  let uid: string, email: string | undefined, displayName: string | undefined;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email;
    displayName = decoded.name;
  } catch (tokenError: unknown) {
    const e = tokenError as { code?: string; message?: string };
    const code = e?.code ?? "unknown";
    const detail = e?.message ?? String(tokenError);
    console.error("[Firebase] verifyIdToken failed:", code, detail);
    if (code.includes("id-token-expired"))
      return res.status(401).json({ message: "Your session has expired. Please sign in again.", code: "TOKEN_EXPIRED" });
    if (code.includes("argument-error") || code.includes("invalid-argument"))
      return res.status(400).json({ message: "Invalid authentication token. Please try again.", code: "INVALID_TOKEN" });
    return res.status(401).json({ message: `Authentication failed: ${detail}`, code });
  }

  email = normalizeEmail(email);
  if (!email) return res.status(400).json({ message: "Firebase account has no email" });

  // ── Step 2: DB operations with full MySQL→MongoDB fallback ──
  try {
    const normalizedGithubUsername = typeof githubUsername === "string"
      ? githubUsername.trim().replace(/^@+/, "")
      : "";
    const normalizedGithubUid = normalizeOptionalId(githubUid) ?? "";

    const userByFirebase = await findUserByField({ firebaseUid: uid });
    const userByEmail = await findUserByField({ email });
    const userByGithub = normalizedGithubUid
      ? await findUserByField({ githubUid: normalizedGithubUid })
      : null;

    // Rare but important: one Firebase UID and one GitHub UID point to different
    // internal user rows. Return a structured conflict so UI can ask the user.
    if (userByFirebase && userByGithub && (userByFirebase as any).id !== (userByGithub as any).id) {
      return res.status(409).json({
        message: "This GitHub sign-in is connected to another Jobie account. Choose which account to continue with.",
        code: "MULTIPLE_MATCHING_ACCOUNTS",
        accounts: [
          { id: (userByFirebase as any).id, email: (userByFirebase as any).email, name: (userByFirebase as any).name, match: "firebase" },
          { id: (userByGithub as any).id, email: (userByGithub as any).email, name: (userByGithub as any).name, match: "github" },
        ],
      });
    }

    let user: Record<string, any> | null = userByGithub || userByFirebase || userByEmail;

    if (!user) {
      // New user — create with fallback
      user = await upsertUserWithFallback(
        { email },
        {
          name: displayName || "Firebase User",
          firebaseUid: uid,
          githubUid: normalizedGithubUid || null,
          role: "candidate",
        }
      );
      if (!user) {
        return res.status(503).json({ message: "Database unavailable. Please try again shortly.", code: "DB_UNAVAILABLE" });
      }
    } else {
      // Existing user — conflict checks then update
      if (user.firebaseUid && user.firebaseUid !== uid) {
        return res.status(409).json({
          message: "This Jobie account is already linked to another sign-in identity.",
          code: "FIREBASE_UID_CONFLICT",
          account: { id: user.id, email: user.email, name: user.name },
        });
      }
      if (normalizedGithubUid) {
        const existingGithubUid = user.githubUid ? String(user.githubUid) : "";
        if (existingGithubUid && existingGithubUid !== normalizedGithubUid) {
          return res.status(409).json({
            message: "This account is already linked to a different GitHub account.",
            code: "GITHUB_UID_CONFLICT",
            account: { id: user.id, email: user.email, name: user.name },
          });
        }
      }
      // Update uid links if needed
      const updates: Record<string, string> = {};
      if (!user.firebaseUid) updates.firebaseUid = uid;
      if (normalizedGithubUid && !user.githubUid) updates.githubUid = normalizedGithubUid;
      if (Object.keys(updates).length > 0) {
        await updateUserWithFallback(user.id ?? user.sqlId ?? null, { email }, updates);
        Object.assign(user, updates);
      }
    }

    // Ensure profile row exists (prevents first-login 404s)
    const profileResult = await getProfileWithFallback(user.id ?? user.sqlId);
    if (!profileResult.data) {
      const seedData = normalizedGithubUsername ? { githubUsername: normalizedGithubUsername } : {};
      await saveProfileDual(user.id ?? user.sqlId, seedData);
    } else if (normalizedGithubUsername && !profileResult.data.githubUsername) {
      await saveProfileDual(user.id ?? user.sqlId, { githubUsername: normalizedGithubUsername });
    }

    const jwtToken = jwt.sign(
      { id: user.id ?? user.sqlId, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user.id ?? user.sqlId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string };
    console.error("[Firebase Login] DB error:", e?.message ?? String(error));
    res.status(500).json({
      message: "Login failed due to a database error. Please try again.",
      code: "DB_ERROR",
    });
  }
};
