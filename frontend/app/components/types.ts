export type VerifiedSkill = { skill: string; confidence: number; source: string };

export type Profile = {
  bio: string;
  headline: string;
  location: string;
  skills: string[];
  experience: { title?: string; company?: string; role?: string; duration?: string; years?: string, address?: string, type?: string }[];
  education: { degree?: string; school?:string; institution?: string; years?: string }[];
  projects: { name?: string; description?: string; tech?: string[]; link?: string }[];
  githubUsername: string;
  githubVerifiedSkills: VerifiedSkill[];
  profileCompleteness: number;
  phone?: string;
  website?: string;
  linkedin?: string;
  birthday?: string;
  gender?: string;
  avatarUrl?: string;
  resumeUrl?: string;
};

export type User = { id: number; name: string; email: string; role: string };
