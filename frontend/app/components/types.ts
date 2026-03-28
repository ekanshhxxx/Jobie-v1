export type VerifiedSkill = { skill: string; confidence: number; evidence?: string[] };

export type PinnedRepo = {
  name: string; description: string | null; stars: number;
  forks: number; language: string | null; url: string;
  topics: string[]; updatedAt: string;
};

export type LanguageBreakdown = { language: string; bytes: number; percentage: number };

export type GitHubDeepScan = {
  username: string; profileUrl: string; publicRepos: number; totalStars: number;
  topLanguages: { language: string; repoCount: number; percentage: number }[];
  verifiedSkills: VerifiedSkill[]; activityScore: number; analysedAt: string;
  avatarUrl: string; bio: string | null; company: string | null;
  location: string | null; blogUrl: string | null;
  followers: number; following: number;
  pinnedRepos: PinnedRepo[]; languageBreakdown: LanguageBreakdown[];
  recentCommits: number; aiNarrative: string;
};

export type ResumeReportCard = {
  overallScore: number; strengths: string[]; weaknesses: string[];
  hiringRecommendation: string; suggestedRoles: string[]; generatedAt: string;
};

export type Profile = {
  bio: string;
  headline: string;
  location: string;
  skills: string[];
  experience: { title?: string; company?: string; role?: string; duration?: string; years?: string, address?: string, type?: string }[];
  education: { degree?: string; school?: string; institution?: string; years?: string }[];
  projects: { name?: string; description?: string; tech?: string[]; link?: string }[];
  githubUsername: string;
  githubVerifiedSkills: VerifiedSkill[];
  githubDeepScan?: GitHubDeepScan | null;
  resumeReport?: ResumeReportCard | null;
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
