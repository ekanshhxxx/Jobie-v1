import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";
import Application from "./Application";
import Profile from "./Profile";

// Associations
User.hasOne(Profile, { foreignKey: "userId", as: "profile" });
Profile.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Application, { foreignKey: "userId", as: "applications" });
Application.belongsTo(User, { foreignKey: "userId" });

Job.hasMany(Application, { foreignKey: "jobId", as: "applications" });
Application.belongsTo(Job, { foreignKey: "jobId" });

User.hasMany(Job, { foreignKey: "recruiterId", as: "postedJobs" });
Job.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });

const db = {
  sequelize,
  User,
  Job,
  Application,
  Profile
};

export default db;
