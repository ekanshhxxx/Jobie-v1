import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import admin from "../lib/firebaseAdmin";

// ✅ Register Controller
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role,firebaseUid } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // issue JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err });
  }
};

// ✅ Login Controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body; // only email + password here

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed", error: err });
  }
};





export const firebaseLogin = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // 1️⃣ Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // 2️⃣ First check by firebaseUid
    let user = await User.findOne({ where: { firebaseUid: uid } });

    if (!user) {
      // 3️⃣ If firebaseUid not found, check by email
      user = await User.findOne({ where: { email } });

      if (!user) {
        // User does not exist at all → create new
        user = await User.create({
          name: name || "Firebase User",
          email,
          firebaseUid: uid,
          role: "candidate",
        });
      } else {
        // User exists by email → update firebaseUid
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // 4️⃣ Issue JWT for your backend
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token: jwtToken, user });
  } catch (err) {
    console.error("Firebase login error:", err);
    res.status(500).json({ message: "Firebase login failed", error: err });
  }
};