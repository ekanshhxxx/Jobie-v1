import sequelize from "../config/database";
import User from "./User";
import Job from "./Job";
import Application from "./Application";
import Profile from "./Profile";
import AtsCheck from "./AtsCheck";
import AtsRoadmap from "./AtsRoadmap";
import Meeting from "./Meeting";
import CopilotSession from "./CopilotSession";
import CopilotMessage from "./CopilotMessage";

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

User.hasMany(CopilotSession, { foreignKey: "recruiterId", as: "copilotSessions" });
CopilotSession.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });

Job.hasMany(CopilotSession, { foreignKey: "jobId", as: "copilotSessions" });
CopilotSession.belongsTo(Job, { foreignKey: "jobId", as: "job" });

CopilotSession.hasMany(CopilotMessage, { foreignKey: "sessionId", as: "messages" });
CopilotMessage.belongsTo(CopilotSession, { foreignKey: "sessionId", as: "session" });

const db = {
  sequelize,
  User,
  Job,
  Application,
  Profile,
  AtsCheck,
  AtsRoadmap,
  Meeting,
  CopilotSession,
  CopilotMessage
};

export default db;
