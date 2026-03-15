import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";
import Application from "./Application";
import Profile from "./Profile";
import AtsCheck from "./AtsCheck";
import AtsRoadmap from "./AtsRoadmap";

// Associations
User.hasOne(Profile, { foreignKey: "userId", as: "profile" });
Profile.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Application, { foreignKey: "userId", as: "applications" });
Application.belongsTo(User, { foreignKey: "userId" });

Job.hasMany(Application, { foreignKey: "jobId", as: "applications" });
Application.belongsTo(Job, { foreignKey: "jobId" });

User.hasMany(Job, { foreignKey: "recruiterId", as: "postedJobs" });
Job.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });

User.hasMany(AtsCheck, { foreignKey: "userId", as: "atsChecks" });
AtsCheck.belongsTo(User, { foreignKey: "userId" });

User.hasMany(AtsRoadmap, { foreignKey: "userId", as: "roadmaps" });
AtsRoadmap.belongsTo(User, { foreignKey: "userId" });

const db = {
  sequelize,
  User,
  Job,
  Application,
  Profile,
  AtsCheck,
  AtsRoadmap
};

export default db;
