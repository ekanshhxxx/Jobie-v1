import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Application = sequelize.define("Application", {
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
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      "applied", "shortlisted", "interview_scheduled", "interview_done",
      "offer_sent", "offer_accepted", "offer_rejected", "hired", "rejected"
    ),
    defaultValue: "applied"
  },

  // Populated when an ATS AI check is run for this specific job
  atsMatchScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },

  // Populated by recruiter when sending an offer (status = offer_sent)
  offerDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },

  // Populated when a custom resume is used for this application
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },

  // Reference to the ATS Check performed for this specific application
  atsCheckId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
});

export default Application;