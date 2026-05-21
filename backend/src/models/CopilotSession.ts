import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const CopilotSession = sequelize.define("CopilotSession", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  recruiterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Candidate review",
  },

  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
});

export default CopilotSession;
