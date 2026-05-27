import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";

class Meeting extends Model {
  public id!: number;
  public jobId!: number;
  public recruiterId!: number;
  public candidateId!: number;
  public title!: string;
  public description!: string;
  public scheduledAt!: Date;
  public duration!: number; // in minutes
  public status!: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  public streamCallId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Meeting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recruiterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30, // 30 minutes default
    },
    status: {
      type: DataTypes.ENUM("scheduled", "in_progress", "completed", "cancelled", "no_show"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    streamCallId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "meetings",
    timestamps: true,
  }
);

export default Meeting;
