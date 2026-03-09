import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db";


// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // check if user already exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if ((rows as any[]).length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user (role optional, default 'user')
    await db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [
      name,
      email,
      hashedPassword,
      role || "user",
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // find user
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as any[])[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate JWT with role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Profile
export const profile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // user set by middleware
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};
