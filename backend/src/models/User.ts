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
    unique: "ux_users_email",
    set(value: string) {
      this.setDataValue("email", typeof value === "string" ? value.trim().toLowerCase() : value);
    }
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
    unique: "ux_users_firebase_uid",
    set(value: string | null) {
      if (typeof value !== "string") {
        this.setDataValue("firebaseUid", value);
        return;
      }
      const normalized = value.trim();
      this.setDataValue("firebaseUid", normalized.length ? normalized : null);
    }
  },

  githubUid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: "ux_users_github_uid",
    set(value: string | null) {
      if (typeof value !== "string") {
        this.setDataValue("githubUid", value);
        return;
      }
      const normalized = value.trim();
      this.setDataValue("githubUid", normalized.length ? normalized : null);
    }
  },

  banned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

export default User;
