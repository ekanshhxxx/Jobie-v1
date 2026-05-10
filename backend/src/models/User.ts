import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string | null;
  role: "candidate" | "recruiter" | "admin";
  firebaseUid: string | null;
  githubUid: string | null;
  banned: boolean;

  otp: string | null;
  otpExpiry: Date | null;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "password"
    | "firebaseUid"
    | "githubUid"
    | "otp"
    | "otpExpiry"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string | null;
  public role!: "candidate" | "recruiter" | "admin";
  public firebaseUid!: string | null;
  public githubUid!: string | null;
  public banned!: boolean;

  public otp!: string | null;
  public otpExpiry!: Date | null;
}

User.init(
  {
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
        this.setDataValue(
          "email",
          typeof value === "string"
            ? value.trim().toLowerCase()
            : value
        );
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
      unique: "ux_users_firebase_uid"
    },

    githubUid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: "ux_users_github_uid"
    },

    banned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    otp: {
      type: DataTypes.STRING,
      allowNull: true
    },

    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true
  }
);

export default User;