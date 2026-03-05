import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Job extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public company!: string;
  public location!: string;
  public recruiterId!: number;
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

    recruiterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Job",
  }
);

export default Job;