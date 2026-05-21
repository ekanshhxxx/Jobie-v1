import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Job = sequelize.define("Job", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  company: {
    type: DataTypes.STRING,
    allowNull: false
  },

  location: {
    type: DataTypes.STRING
  },

  salary: {
    type: DataTypes.STRING
  },

  description: {
    type: DataTypes.TEXT
  },

  requiredSkills: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  techStack: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  experienceLevel: {
    type: DataTypes.ENUM("junior", "mid", "senior"),
    defaultValue: "mid"
  },

  lifecycleStatus: {
    type: DataTypes.ENUM("draft", "published", "closed"),
    defaultValue: "published"
  },

  approvalStatus: {
    type: DataTypes.ENUM("approved", "pending_review", "rejected"),
    defaultValue: "approved"
  },

  recruiterId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "approved"
  }
});

export default Job;
