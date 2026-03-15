import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string | null; // firebase login ke liye optional
  public role!: "candidate" | "recruiter" | "admin";
  public firebaseUid!: string | null; // 🔹 add this
  public otp!: string | null;
  public otpExpiry!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
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
  unique: "email_unique"
},
  password: {
    type: DataTypes.STRING,
    allowNull: true // 🔹 allowNull true for Firebase users
  },
  role: {
    type: DataTypes.ENUM("candidate", "recruiter", "admin"),
    defaultValue: "candidate"
  },

  otp: {
  type: DataTypes.STRING,
  allowNull: true,
},
otpExpiry: {
  type: DataTypes.DATE,
  allowNull: true,
},
  firebaseUid: {
  type: DataTypes.STRING,
  allowNull: true,
  unique: "firebase_uid_unique"
}
}, {
  sequelize,
  tableName: "users",
  timestamps: true
});

export default User;