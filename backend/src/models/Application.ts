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
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending"
  }
});

export default Application;