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
  }
});

export default Job;