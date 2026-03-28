import request from "supertest";
import express from "express";
import cors from "cors";
import sequelize from "../config/database";
import "../models";
import authRoutes from "../routes/authRoutes";
import profileRoutes from "../routes/profileRoutes";
import jobRoutes from "../routes/jobRoutes";
import githubRoutes from "../routes/githubRoutes";
import resumeRoutes from "../routes/resumeRoutes";

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/resume", resumeRoutes);

// ─── Shared state ─────────────────────────────────────────────────────────────
let candidateToken: string;
let candidateId: number;
let recruiterToken: string;
let recruiterId: number;
let jobId: number;

const ts = Date.now();
const CANDIDATE_EMAIL = `phase3_c_${ts}@test.com`;
const RECRUITER_EMAIL = `phase3_r_${ts}@test.com`;
const PASSWORD = "Test@1234";

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await sequelize.sync({ force: false });

  // Register candidate
  const c = await request(app).post("/api/auth/register")
    .send({ name: "Phase3 Candidate", email: CANDIDATE_EMAIL, password: PASSWORD, role: "candidate" });
  candidateToken = c.body.token;
  candidateId = c.body.user.id;

  // Create profile with githubUsername
  await request(app).post(`/api/profile/${candidateId}`)
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({
      bio: "Full-stack developer",
      skills: ["JavaScript", "React"],
      experience: [{ company: "Acme", role: "Dev", years: 2 }],
      education: [{ institution: "MIT", degree: "B.Tech", year: 2022 }],
      projects: [{ name: "Jobie", description: "Job portal" }],
      githubUsername: "Amrit1604",
    });

  // Register recruiter + create a job
  const r = await request(app).post("/api/auth/register")
    .send({ name: "Phase3 Recruiter", email: RECRUITER_EMAIL, password: PASSWORD, role: "recruiter" });
  recruiterToken = r.body.token;
  recruiterId = r.body.user.id;

  const j = await request(app).post("/api/jobs")
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send({
      title: "Backend Engineer",
      company: "TestCorp",
      location: "Remote",
      salary: "80000",
      description: "Build APIs",
      requiredSkills: ["Node.js", "TypeScript", "C"],
      techStack: ["Express", "PostgreSQL"],
      experienceLevel: "mid",
    });
  jobId = j.body.job?.id ?? j.body.id;
}, 30000);

afterAll(async () => {
  await sequelize.close();
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GITHUB ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("GitHub — analyse public user", () => {
  it("[G1] analyse Amrit1604 → 200 with skills & repos", async () => {
    const res = await request(app).get("/api/github/analyse/Amrit1604");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("verifiedSkills");
    expect(res.body).toHaveProperty("topLanguages");
    expect(res.body).toHaveProperty("publicRepos");
    expect(res.body).toHaveProperty("activityScore");
    expect(Array.isArray(res.body.verifiedSkills)).toBe(true);
  }, 15000);

  it("[G2] analyse ekanshhxxx → 200", async () => {
    const res = await request(app).get("/api/github/analyse/ekanshhxxx");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("verifiedSkills");
    expect(res.body.publicRepos).toBeGreaterThanOrEqual(0);
  }, 15000);

  it("[G3] analyse gurmanpreetsinghaulakh → 200", async () => {
    const res = await request(app).get("/api/github/analyse/gurmanpreetsinghaulakh");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("verifiedSkills");
  }, 15000);

  it("[G4] analyse Ananya906 → 200", async () => {
    const res = await request(app).get("/api/github/analyse/Ananya906");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("verifiedSkills");
  }, 15000);

  it("[G5] analyse non-existent user → 404", async () => {
    const res = await request(app).get("/api/github/analyse/thisuserdoesnotexist999zzz");
    expect([404, 429]).toContain(res.status); // 429 if rate-limited
  }, 15000);
});

describe("GitHub — verify & save to profile", () => {
  it("[G6] verify Amrit1604 GitHub and save to profile → 200", async () => {
    const res = await request(app)
      .post(`/api/github/verify/${candidateId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("verifiedSkills");
    expect(res.body).toHaveProperty("updatedSkills");
    expect(res.body).toHaveProperty("profileCompleteness");
    expect(res.body.profileCompleteness).toBeGreaterThan(0);
  }, 15000);

  it("[G7] verified skills should persist on profile", async () => {
    const res = await request(app)
      .get(`/api/profile/${candidateId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(res.body.githubVerifiedSkills).toBeDefined();
    expect(Array.isArray(res.body.githubVerifiedSkills)).toBe(true);
  });

  it("[G8] verify without token → 401", async () => {
    const res = await request(app).post(`/api/github/verify/${candidateId}`);
    expect(res.status).toBe(401);
  });

  it("[G9] verify non-existent profile → 404", async () => {
    const res = await request(app)
      .post("/api/github/verify/99999")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });
});

describe("GitHub — compare with job", () => {
  it("[G10] compare Amrit1604 verified skills with job → 200", async () => {
    const res = await request(app)
      .get(`/api/github/compare/${candidateId}/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("credibilityScore");
    expect(res.body).toHaveProperty("verifiedMatch");
    expect(res.body).toHaveProperty("verifiedMissing");
    expect(typeof res.body.credibilityScore).toBe("number");
    expect(res.body.credibilityScore).toBeGreaterThanOrEqual(0);
    expect(res.body.credibilityScore).toBeLessThanOrEqual(100);
  });

  it("[G11] compare non-existent user → 404", async () => {
    const res = await request(app)
      .get(`/api/github/compare/99999/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[G12] compare with non-existent job → 404", async () => {
    const res = await request(app)
      .get(`/api/github/compare/${candidateId}/99999`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[G13] compare without token → 401", async () => {
    const res = await request(app).get(`/api/github/compare/${candidateId}/${jobId}`);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RESUME AI ENDPOINTS  (text-based — no PDF needed)
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_RESUME = `
Amrit Kumar
amrit@example.com | +91-9876543210

Summary:
Experienced full-stack developer with 3 years of experience building scalable web applications
using React, Node.js, TypeScript, and PostgreSQL. Passionate about clean code and agile.

Skills:
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git, Docker, AWS, Python

Experience:
Software Engineer at TechCorp (June 2021 - Present)
- Built RESTful APIs serving 10k+ users daily
- Migrated legacy codebase from JavaScript to TypeScript
- Implemented CI/CD pipelines using GitHub Actions

Junior Developer at StartupXYZ (Jan 2020 - May 2021)
- Developed dashboard using React and Redux
- Integrated third-party payment APIs

Education:
B.Tech Computer Science — MIT University (2020)

Projects:
Jobie — A skills-based job portal with AI matching
TaskTracker — A real-time collaboration tool built with Socket.io

Certifications:
AWS Certified Developer Associate
`;

describe("Resume — parse from text", () => {
  it("POST /api/resume/parse-text → 200 with parsed data", async () => {
    const res = await request(app)
      .post("/api/resume/parse-text")
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("parsed");
    expect(res.body.parsed).toHaveProperty("skills");
    expect(res.body.parsed).toHaveProperty("experience");
    expect(res.body.parsed).toHaveProperty("education");
    expect(Array.isArray(res.body.parsed.skills)).toBe(true);
    expect(res.body.parsed.skills.length).toBeGreaterThan(0);
  }, 30000);

  it("POST /api/resume/parse-text → 400 with short text", async () => {
    const res = await request(app)
      .post("/api/resume/parse-text")
      .send({ text: "Too short" });
    expect(res.status).toBe(400);
  });

  it("POST /api/resume/parse-text → 400 with no text", async () => {
    const res = await request(app)
      .post("/api/resume/parse-text")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("Resume — parse and save to profile", () => {
  it("POST /api/resume/parse-and-save/:userId → 200 with merged profile", async () => {
    const res = await request(app)
      .post(`/api/resume/parse-and-save/${candidateId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("parsed");
    expect(res.body).toHaveProperty("updatedProfile");
    expect(res.body.updatedProfile.skills.length).toBeGreaterThan(2); // original 2 + parsed
    expect(res.body.updatedProfile.profileCompleteness).toBeGreaterThan(0);
  }, 30000);

  it("POST /api/resume/parse-and-save/:userId → 401 without token", async () => {
    const res = await request(app)
      .post(`/api/resume/parse-and-save/${candidateId}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(401);
  });

  it("POST /api/resume/parse-and-save/99999 → 404 profile not found", async () => {
    const res = await request(app)
      .post("/api/resume/parse-and-save/99999")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(404);
  });
});

describe("Resume — match with job", () => {
  it("POST /api/resume/match/:jobId → 200 with analysis", async () => {
    const res = await request(app)
      .post(`/api/resume/match/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("matchPercentage");
    expect(res.body).toHaveProperty("matched");
    expect(res.body).toHaveProperty("missing");
    expect(typeof res.body.matchPercentage).toBe("number");
  }, 30000);

  it("POST /api/resume/match/99999 → 404 job not found", async () => {
    const res = await request(app)
      .post("/api/resume/match/99999")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(404);
  });

  it("POST /api/resume/match/:jobId → 401 without token", async () => {
    const res = await request(app)
      .post(`/api/resume/match/${jobId}`)
      .send({ text: SAMPLE_RESUME });
    expect(res.status).toBe(401);
  });
});

describe("Resume — PDF upload validation", () => {
  it("POST /api/resume/parse → 400 with no file", async () => {
    const res = await request(app).post("/api/resume/parse");
    expect(res.status).toBe(400);
  });
});
