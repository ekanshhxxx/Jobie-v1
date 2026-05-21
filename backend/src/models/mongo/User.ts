import mongoose, { Schema, Document } from 'mongoose';

export interface IMongoUser extends Document {
  sqlId: number;
  name: string;
  email: string;
  password?: string;
  role: 'candidate' | 'recruiter' | 'admin';
  firebaseUid?: string;
  githubUid?: string;
  banned: boolean;
}

const UserSchema: Schema = new Schema({
  sqlId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['candidate', 'recruiter', 'admin'], default: 'candidate' },
  firebaseUid: { type: String, unique: true, sparse: true },
  githubUid: { type: String, unique: true, sparse: true },
  banned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IMongoUser>('User', UserSchema);
