import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import sequelize from "./config/database";

import "./models";

import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import matchRoutes from "./routes/matchRoutes";
import adminRoutes from "./routes/adminRoutes";
import githubRoutes from "./routes/githubRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import protectedRoutes from "./routes/protected";
import dashboardRoutes from "./routes/dashboard.route";


const app = express();

/* CORS configuration */

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

/* Security headers */

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

/* ---------------- API Routes ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* Root endpoint */

app.get("/", (req, res) => {
  res.send("Jobie API running");
});

const PORT = process.env.PORT || 4000;

/* Database connection */

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database error:", err);
  });