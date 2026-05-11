import express from "express";

import {
  register,
  login,
  firebaseLogin,
  verifyOtp,
  resendOtp
} from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/firebase-login", firebaseLogin);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

export default router;