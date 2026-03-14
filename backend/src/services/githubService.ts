/**
 * ─── GitHub Skill Verification Service ────────────────────────────────────────
 *
 * A standalone, reusable service that analyses a GitHub user's public repos
 * and returns verified skills with confidence scores.
 *
 * Does NOT touch any models — it only returns data. Controllers decide
 * what to persist, making this safe to use from any part of the app.
 *
 * Uses: GitHub REST API v3 (no auth required for public data, but a
 *       GITHUB_TOKEN env var is supported for higher rate limits).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  size: number;
  fork: boolean;
  updated_at: string;
}

export interface VerifiedSkill {
  skill: string;
  confidence: number;   // 0–100
  evidence: string[];    // repo names / topics that proved this skill
}

export interface GitHubAnalysis {
  username: string;
  profileUrl: string;
  publicRepos: number;
  totalStars: number;
  topLanguages: { language: string; repoCount: number; percentage: number }[];
  verifiedSkills: VerifiedSkill[];
  activityScore: number; // 0–100
  analysedAt: string;
}

// ─── Language → Skills mapping ────────────────────────────────────────────────
// Extensible — add new entries any time without touching any other file.
const LANGUAGE_SKILL_MAP: Record<string, string[]> = {
  javascript:  ["JavaScript", "Node.js", "ES6+"],
  typescript:  ["TypeScript", "JavaScript", "Node.js"],
  python:      ["Python"],
  java:        ["Java"],
  "c++":       ["C++"],
  c:           ["C"],
  "c#":        ["C#", ".NET"],
  go:          ["Go", "Golang"],
  rust:        ["Rust"],
  ruby:        ["Ruby"],
  php:         ["PHP"],
  swift:       ["Swift", "iOS"],
  kotlin:      ["Kotlin", "Android"],
  dart:        ["Dart", "Flutter"],
  html:        ["HTML", "Frontend"],
  css:         ["CSS", "Frontend"],
  scss:        ["CSS", "SCSS", "Frontend"],
  shell:       ["Shell", "Bash", "DevOps"],
  dockerfile:  ["Docker", "DevOps"],
  hcl:         ["Terraform", "DevOps"],
};

// ─── Topic → Skills mapping (GitHub repo topics) ─────────────────────────────
const TOPIC_SKILL_MAP: Record<string, string[]> = {
  react:           ["React", "Frontend"],
  nextjs:          ["Next.js", "React", "Frontend"],
  angular:         ["Angular", "Frontend"],
  vue:             ["Vue.js", "Frontend"],
  svelte:          ["Svelte", "Frontend"],
  nodejs:          ["Node.js", "Backend"],
  express:         ["Express.js", "Backend"],
  fastapi:         ["FastAPI", "Python", "Backend"],
  django:          ["Django", "Python", "Backend"],
  flask:           ["Flask", "Python", "Backend"],
  "spring-boot":   ["Spring Boot", "Java", "Backend"],
  graphql:         ["GraphQL"],
  rest:            ["REST API"],
  mongodb:         ["MongoDB", "NoSQL"],
  postgresql:      ["PostgreSQL", "SQL"],
  mysql:           ["MySQL", "SQL"],
  redis:           ["Redis"],
  docker:          ["Docker", "DevOps"],
  kubernetes:      ["Kubernetes", "DevOps"],
  aws:             ["AWS", "Cloud"],
  gcp:             ["GCP", "Cloud"],
  azure:           ["Azure", "Cloud"],
  "machine-learning": ["Machine Learning", "AI"],
  "deep-learning":    ["Deep Learning", "AI"],
  tensorflow:      ["TensorFlow", "AI"],
  pytorch:         ["PyTorch", "AI"],
  "react-native":  ["React Native", "Mobile"],
  flutter:         ["Flutter", "Mobile"],
  tailwindcss:     ["Tailwind CSS", "Frontend"],
  bootstrap:       ["Bootstrap", "Frontend"],
  firebase:        ["Firebase", "Cloud"],
  sequelize:       ["Sequelize", "ORM", "SQL"],
  prisma:          ["Prisma", "ORM"],
  socket:          ["Socket.io", "WebSockets"],
  websocket:       ["WebSockets"],
  "ci-cd":         ["CI/CD", "DevOps"],
  "github-actions": ["GitHub Actions", "CI/CD"],
};

// ─── Confidence calculator ────────────────────────────────────────────────────
function computeConfidence(evidence: { repoCount: number; totalStars: number; isRecent: boolean }): number {
  let score = 0;

  // Number of repos using this skill (max 40 pts)
  score += Math.min(evidence.repoCount * 10, 40);

  // Stars (max 30 pts)
  score += Math.min(evidence.totalStars * 5, 30);

  // Recency bonus (within last 12 months)
  if (evidence.isRecent) score += 20;

  // Base score for any presence
  score += 10;

  return Math.min(score, 100);
}

// ─── Axios instance ───────────────────────────────────────────────────────────
function getGitHubClient() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  return axios.create({
    baseURL: "https://api.github.com",
    headers,
    timeout: 15000,
  });
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function analyseGitHubProfile(username: string): Promise<GitHubAnalysis> {
  const cleanUsername = username.trim().replace(/^@+/, "");
  if (!cleanUsername) {
    throw new Error("GitHub username is required");
  }
  const client = getGitHubClient();

  // 1. Verify user exists
  const { data: user } = await client.get(`/users/${encodeURIComponent(cleanUsername)}`);

  // 2. Fetch repos (up to 100 most recently pushed)
  const { data: repos } = await client.get<GitHubRepo[]>(
    `/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=pushed&type=owner`
  );

  // Filter out forks
  const ownRepos = repos.filter((r) => !r.fork);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  // 3. Aggregate language stats
  const langCount: Record<string, number> = {};
  ownRepos.forEach((r) => {
    if (r.language) {
      langCount[r.language] = (langCount[r.language] || 0) + 1;
    }
  });

  const topLanguages = Object.entries(langCount)
    .sort(([, a], [, b]) => b - a)
    .map(([language, repoCount]) => ({
      language,
      repoCount,
      percentage: Math.round((repoCount / ownRepos.length) * 100),
    }));

  // 4. Build skill evidence map
  const skillEvidence: Record<string, { repos: Set<string>; stars: number; isRecent: boolean }> = {};

  const addSkillEvidence = (skill: string, repoName: string, stars: number, isRecent: boolean) => {
    if (!skillEvidence[skill]) {
      skillEvidence[skill] = { repos: new Set(), stars: 0, isRecent: false };
    }
    skillEvidence[skill].repos.add(repoName);
    skillEvidence[skill].stars += stars;
    if (isRecent) skillEvidence[skill].isRecent = true;
  };

  for (const repo of ownRepos) {
    const recent = new Date(repo.updated_at) >= cutoff;

    // From language
    if (repo.language) {
      const normalized = repo.language.toLowerCase();
      const skills = LANGUAGE_SKILL_MAP[normalized] || [repo.language];
      skills.forEach((s) => addSkillEvidence(s, repo.name, repo.stargazers_count, recent));
    }

    // From topics
    for (const topic of repo.topics || []) {
      const normalized = topic.toLowerCase();
      const skills = TOPIC_SKILL_MAP[normalized];
      if (skills) {
        skills.forEach((s) => addSkillEvidence(s, repo.name, repo.stargazers_count, recent));
      }
    }
  }

  // 5. Convert to VerifiedSkill[]
  const verifiedSkills: VerifiedSkill[] = Object.entries(skillEvidence)
    .map(([skill, ev]) => ({
      skill,
      confidence: computeConfidence({
        repoCount: ev.repos.size,
        totalStars: ev.stars,
        isRecent: ev.isRecent,
      }),
      evidence: [...ev.repos],
    }))
    .sort((a, b) => b.confidence - a.confidence);

  // 6. Activity score (rough measure: repos updated in last year / total)
  const recentCount = ownRepos.filter((r) => new Date(r.updated_at) >= cutoff).length;
  const activityScore = ownRepos.length > 0
    ? Math.round((recentCount / ownRepos.length) * 100)
    : 0;

  const totalStars = ownRepos.reduce((acc, r) => acc + r.stargazers_count, 0);

  return {
    username: cleanUsername,
    profileUrl: user.html_url,
    publicRepos: ownRepos.length,
    totalStars,
    topLanguages,
    verifiedSkills,
    activityScore,
    analysedAt: new Date().toISOString(),
  };
}
