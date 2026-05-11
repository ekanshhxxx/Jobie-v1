export type CandidateUser = {
  id: number;
  name: string;
  email?: string;
  role: "candidate" | "recruiter" | "admin" | string;
};

export type Job = {
  id: number;
  title: string;
  company?: string;
  location?: string;
  experienceLevel?: "junior" | "mid" | "senior" | string;
  createdAt?: string;
  salary?: string | number;
  salaryMin?: number;
  salaryMax?: number;
  type?: string;
  employmentType?: string;
  requiredSkills?: string[];
  techStack?: string[];
  status?: string;
};

export type Application = {
  id: number;
  jobId: number;
  userId?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VerifiedSkill = {
  skill: string;
  confidence: number;
};

export type Profile = {
  profileCompleteness?: number;
  githubVerifiedSkills?: VerifiedSkill[];
  skills?: string[];
  headline?: string;
  bio?: string;
  githubUsername?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  resumeReport?: unknown;
};

export type DashboardStats = {
  profileCompleteness: number;
  githubSkills: number;
  applications: number;
  openJobs: number;
};
