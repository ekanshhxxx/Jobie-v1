import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true,               // allow cookies / auth headers
  })
);
app.use(express.json());
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


// server.ts
// Add after: const app = express();
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/", (req, res) => {
  res.send("Jobie API running");
});

const PORT = Number(process.env.PORT) || 5000;

sequelize
  .sync({ alter: true }) // 🔹 ADD THIS OPTION
  .then(() => {
    console.log("Database synced with firebaseUid column");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database error:", err);
  });