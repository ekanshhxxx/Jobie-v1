import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const AtsCheck = sequelize.define("AtsCheck", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  jobDescription: {
    type: DataTypes.TEXT("long"),
    allowNull: false
  },
  resumeText: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  source: {
    type: DataTypes.ENUM("profile", "resume"),
    allowNull: false,
    defaultValue: "resume"
  },
  matchScore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  matchedKeywords: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  missingKeywords: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  stats: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

export default AtsCheck;
