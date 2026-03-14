import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: true
  },

  role: {
    type: DataTypes.ENUM("candidate", "recruiter", "admin"),
    defaultValue: "candidate"
  },

  firebaseUid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  githubUid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  banned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

export default User;
