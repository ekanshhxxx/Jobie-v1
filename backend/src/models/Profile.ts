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
    unique: "ux_profiles_user_id"
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  headline: {
    type: DataTypes.STRING,
    allowNull: true
  },

  location: {
    type: DataTypes.STRING,
    allowNull: true
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },

  website: {
    type: DataTypes.STRING,
    allowNull: true
  },

  linkedin: {
    type: DataTypes.STRING,
    allowNull: true
  },

  birthday: {
    type: DataTypes.STRING,
    allowNull: true
  },

  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },

  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },

  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },

  companyLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },

  resumeUrl: {
    type: DataTypes.STRING,
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

  githubDeepScan: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },

  resumeReport: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },

  profileCompleteness: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

export default Profile;
