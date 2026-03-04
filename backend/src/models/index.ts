import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";
import Application from "./Application";

const db = {
  sequelize,
  User,
  Job,
  Application
};

export default db;