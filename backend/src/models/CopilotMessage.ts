import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const CopilotMessage = sequelize.define("CopilotMessage", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM("user", "assistant"),
    allowNull: false,
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

export default CopilotMessage;
