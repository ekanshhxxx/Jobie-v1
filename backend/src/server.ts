import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import jobRoutes from "./routes/jobRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobRoutes);

const PORT = process.env.PORT || 4000;

sequelize
  .sync()
  .then(() => {
    console.log("Database Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));