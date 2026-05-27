import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import sequelize from "./config/database";
import connectMongo from "./config/mongo";
import { ensureDataIntegrityIndexes } from "./config/dataIntegrity";
import "./models";
import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import matchRoutes from "./routes/matchRoutes";
import adminRoutes from "./routes/adminRoutes";
import githubRoutes from "./routes/githubRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import atsRoutes from "./routes/atsRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import chatRoutes from "./routes/chatRoutes";
import dashboardRoutes from "./routes/dashboard.route";
import meetingRoutes from "./routes/meetingRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("Jobie API running");
});

const PORT = Number(process.env.PORT) || 5000;
const DB_SYNC_MODE = process.env.DB_SYNC_MODE || "safe";
const shouldAlter = DB_SYNC_MODE === "alter";

connectMongo().catch(err => console.error("MongoDB initialization failed:", err));

sequelize
  .sync(shouldAlter ? { alter: true } : undefined)
  .then(() => {
    if (shouldAlter) {
      console.warn("DB sync running in ALTER mode. Use only for controlled migrations.");
    }
    ensureDataIntegrityIndexes().catch((error) => {
      console.warn("Data integrity index check failed:", error);
    });
    console.log("Database synced");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database error:", err);
    // Still listen even if MySQL fails
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (MySQL Offline)`);
    });
  });

