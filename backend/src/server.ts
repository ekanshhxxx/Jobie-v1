import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import "./models";
import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

app.get("/", (req, res) => {
  res.send("Jobie API running");
});

const PORT = Number(process.env.PORT) || 5000;

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database error:", err);
  });