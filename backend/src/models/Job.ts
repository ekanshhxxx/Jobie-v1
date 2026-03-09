import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Job extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public company!: string;
  public location!: string;

  public salary!: string;
  public experience!: string;
  public jobType!: string;

  public skills!: string;
  public techSkills!: string;

  public recruiterId!: number;
  public status!: string;
}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    salary: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    experience: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    jobType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    techSkills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    recruiterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "draft", "closed"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "Job",
  }
);

export default Job;