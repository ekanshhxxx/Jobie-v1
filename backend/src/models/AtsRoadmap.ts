import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const AtsRoadmap = sequelize.define("AtsRoadmap", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jobRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  matchScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  missingSkills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  roadmapData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

export default AtsRoadmap;
