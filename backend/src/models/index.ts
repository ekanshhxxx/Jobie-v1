import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";
import Application from "./Application";
import Profile from "./Profile";
import AtsCheck from "./AtsCheck";
import AtsRoadmap from "./AtsRoadmap";
import Meeting from "./Meeting";

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

User.hasMany(Meeting, { foreignKey: "recruiterId", as: "recruiterMeetings" });
Meeting.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });

User.hasMany(Meeting, { foreignKey: "candidateId", as: "candidateMeetings" });
Meeting.belongsTo(User, { foreignKey: "candidateId", as: "candidate" });

Job.hasMany(Meeting, { foreignKey: "jobId", as: "meetings" });
Meeting.belongsTo(Job, { foreignKey: "jobId", as: "job" });

const db = {
  sequelize,
  User,
  Job,
  Application,
  Profile,
  AtsCheck,
  AtsRoadmap,
  Meeting
};

export default db;
