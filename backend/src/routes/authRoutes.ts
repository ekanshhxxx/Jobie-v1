import { Router } from "express";
import { register, login, profile } from "../controllers/authController";
import { verifyJWT, verifyRole } from "../middleware/auth"; // ✅ Role middleware bhi import
import { db } from "../config/db";   // ✅ DB connection import
import crypto from "crypto";         // ✅ Token generate ke liye
import bcrypt from "bcryptjs";       // ✅ Password hashing ke liye
import { transporter } from "../config/email"; // ✅ Nodemailer transporter

const router = Router();

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Profile route (JWT protected)
router.get("/profile", verifyJWT, profile);

// Forgot Password route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows]: any = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.query("UPDATE users SET resetToken=?, resetTokenExpiry=? WHERE email=?", [
      token,
      expiry,
      email,
    ]);

    // Reset link
    const resetLink = `http://localhost:5000/api/auth/reset-password?token=${token}`;

    // Email bhejna
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetLink}`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Reset Password route
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE resetToken=? AND resetTokenExpiry > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password=?, resetToken=NULL, resetTokenExpiry=NULL WHERE id=?",
      [hashedPassword, rows[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// ✅ Admin-only route
router.get("/admin-dashboard", verifyJWT, verifyRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

// ✅ User-only route
router.get("/user-dashboard", verifyJWT, verifyRole(["user"]), (req, res) => {
  res.json({ message: "Welcome User!" });
});

// ✅ Common route (admin + user dono)
router.get("/common-dashboard", verifyJWT, verifyRole(["admin", "user"]), (req, res) => {
  res.json({ message: "Welcome Admin/User!" });
});

export default router;
