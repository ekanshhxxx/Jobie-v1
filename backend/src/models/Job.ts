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

  recruiterId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

export default Job;
