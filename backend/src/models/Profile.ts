import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Profile = sequelize.define("Profile", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  skills: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  experience: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  education: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  projects: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  githubUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },

  githubVerifiedSkills: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  profileCompleteness: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

export default Profile;
