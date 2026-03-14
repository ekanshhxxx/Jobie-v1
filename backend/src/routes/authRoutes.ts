import express from "express";
import { register, login, firebaseLogin } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/firebase-login", firebaseLogin);

export default router;