import mongoose, { Schema, Document } from 'mongoose';

export interface IMongoProfile extends Document {
  userId: number; // SQL User ID
  bio?: string;
  headline?: string;
  location?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  birthday?: string;
  gender?: string;
  avatarUrl?: string;
  companyName?: string;
  companyLogo?: string;
  resumeUrl?: string;
  skills: any[];
  experience: any[];
  education: any[];
  projects: any[];
  githubUsername?: string;
  githubVerifiedSkills: any[];
  githubDeepScan: any;
  resumeReport: any;
  profileCompleteness: number;
}

const ProfileSchema: Schema = new Schema({
  userId: { type: Number, required: true, unique: true },
  bio: { type: String },
  headline: { type: String },
  location: { type: String },
  phone: { type: String },
  website: { type: String },
  linkedin: { type: String },
  birthday: { type: String },
  gender: { type: String },
  avatarUrl: { type: String },
  companyName: { type: String },
  companyLogo: { type: String },
  resumeUrl: { type: String },
  skills: { type: Schema.Types.Mixed, default: [] },
  experience: { type: Schema.Types.Mixed, default: [] },
  education: { type: Schema.Types.Mixed, default: [] },
  projects: { type: Schema.Types.Mixed, default: [] },
  githubUsername: { type: String },
  githubVerifiedSkills: { type: Schema.Types.Mixed, default: [] },
  githubDeepScan: { type: Schema.Types.Mixed, default: null },
  resumeReport: { type: Schema.Types.Mixed, default: null },
  profileCompleteness: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IMongoProfile>('Profile', ProfileSchema);
