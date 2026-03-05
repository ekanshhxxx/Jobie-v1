import request from "supertest";
import express from "express";
import cors from "cors";
import sequelize from "../config/database";
import "../models";
import authRoutes from "../routes/authRoutes";
import profileRoutes from "../routes/profileRoutes";
import jobRoutes from "../routes/jobRoutes";
import applicationRoutes from "../routes/applicationRoutes";
import matchRoutes from "../routes/matchRoutes";

// ─── Build app (no server.listen — supertest handles it) ─────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/match", matchRoutes);

// ─── Shared state across tests ────────────────────────────────────────────────
let candidateToken: string;
let recruiterToken: string;
let adminToken: string;
let jobId: number;
let applicationId: number;

const timestamp = Date.now();
const CANDIDATE_EMAIL = `candidate_${timestamp}@test.com`;
const RECRUITER_EMAIL = `recruiter_${timestamp}@test.com`;
const ADMIN_EMAIL    = `admin_${timestamp}@test.com`;
const PASSWORD = "Test@1234";

// ─── Setup & Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1 — AUTH
// ═════════════════════════════════════════════════════════════════════════════
describe("Phase 1 — Auth: Registration", () => {
  it("[1] should register a candidate and return JWT + user object", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Candidate User", email: CANDIDATE_EMAIL, password: PASSWORD, role: "candidate" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("candidate");
    candidateToken = res.body.token;
  });

  it("[2] should register a recruiter and return JWT", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Recruiter User", email: RECRUITER_EMAIL, password: PASSWORD, role: "recruiter" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("recruiter");
    recruiterToken = res.body.token;
  });

  it("[3] should register an admin and return JWT", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Admin User", email: ADMIN_EMAIL, password: PASSWORD, role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("admin");
    adminToken = res.body.token;
  });

  it("[4] should reject duplicate email with 409", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dup", email: CANDIDATE_EMAIL, password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already registered");
  });
});

describe("Phase 1 — Auth: Login", () => {
  it("[5] should login with correct credentials and return JWT", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(CANDIDATE_EMAIL);
  });

  it("[6] should reject wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("[7] should reject non-existent email with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

describe("Phase 1 — Auth: Token Protection", () => {
  it("[8] should return 401 when no token is provided on protected route", async () => {
    const res = await request(app).get("/api/profile/1");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });

  it("[9] should return 401 when an invalid/fake token is provided", async () => {
    const res = await request(app)
      .get("/api/profile/1")
      .set("Authorization", "Bearer faketoken.invalid.xxx");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  it("[10] should return 401 when Authorization header has no Bearer prefix", async () => {
    const res = await request(app)
      .get("/api/profile/1")
      .set("Authorization", candidateToken);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1 — PROFILE
// ═════════════════════════════════════════════════════════════════════════════
describe("Phase 1 — Profile: Create", () => {
  it("[11] should return 404 when getting a profile that does not exist yet", async () => {
    // Re-login to get userId from token, try a high userId
    const res = await request(app)
      .get("/api/profile/99999")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[12] should create a candidate profile and auto-calculate completeness", async () => {
    // Get userId from login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .post(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        bio: "Full stack developer",
        skills: ["React", "Node", "MongoDB"],
        projects: [{ name: "Chat App", tech: ["Socket.io", "React"] }],
        githubUsername: "testuser"
      });

    expect(res.status).toBe(201);
    expect(res.body.bio).toBe("Full stack developer");
    expect(res.body.skills).toEqual(expect.arrayContaining(["React", "Node"]));
    expect(res.body.profileCompleteness).toBeGreaterThan(0);
    expect(res.body.profileCompleteness).toBeLessThanOrEqual(100);
  });

  it("[13] should reject duplicate profile creation with 409", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .post(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ bio: "Duplicate" });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already exists");
  });
});

describe("Phase 1 — Profile: Read & Update", () => {
  it("[14] should get the created profile successfully", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(res.body).toHaveProperty("skills");
    expect(res.body).toHaveProperty("profileCompleteness");
  });

  it("[15] profile completeness should increase after adding more fields", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    // Get current completeness
    const before = await request(app)
      .get(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    const prevCompleteness = before.body.profileCompleteness;

    // Update with more data
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        bio: "Senior Full Stack Dev",
        skills: ["React", "Node", "MongoDB", "TypeScript", "Docker", "Git"],
        experience: [{ company: "StartupX", role: "Frontend Dev", years: 2 }],
        education: [{ degree: "B.Tech", institution: "MIT", year: 2022 }],
        projects: [
          { name: "Chat App", tech: ["Socket.io", "React"] },
          { name: "Jobie", tech: ["Node", "MySQL"] }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.profileCompleteness).toBeGreaterThan(prevCompleteness);
  });

  it("[16] should return 404 when updating a non-existent profile", async () => {
    const res = await request(app)
      .put("/api/profile/99999")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ bio: "ghost" });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1 — JOBS
// ═════════════════════════════════════════════════════════════════════════════
describe("Phase 1 — Jobs: CRUD", () => {
  it("[17] should create a job with requiredSkills and techStack", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        title: "Full Stack Developer",
        company: "TechCorp",
        location: "Remote",
        salary: "80000",
        description: "We need a full stack dev",
        requiredSkills: ["React", "Node", "TypeScript", "Docker"],
        techStack: ["React", "Node.js", "MongoDB"],
        experienceLevel: "mid"
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Full Stack Developer");
    expect(res.body.requiredSkills).toEqual(expect.arrayContaining(["React", "Node"]));
    expect(res.body.experienceLevel).toBe("mid");
    jobId = res.body.id;
  });

  it("[18] should get all jobs", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("[19] should get a single job by ID", async () => {
    const res = await request(app).get(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
    expect(res.body).toHaveProperty("requiredSkills");
    expect(res.body).toHaveProperty("techStack");
  });

  it("[20] should return 404 for non-existent job", async () => {
    const res = await request(app).get("/api/jobs/99999");
    expect(res.status).toBe(404);
  });

  it("[21] should update a job", async () => {
    const res = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ salary: "90000" });

    expect(res.status).toBe(200);
    expect(res.body.salary).toBe("90000");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1 — APPLICATIONS
// ═════════════════════════════════════════════════════════════════════════════
describe("Phase 1 — Applications: Apply & Status Pipeline", () => {
  it("[22] should apply for a job with status=applied", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .post("/api/applications/apply")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ userId, jobId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("applied");
    expect(res.body.jobId).toBe(jobId);
    applicationId = res.body.id;
  });

  it("[23] should get all applications for a user", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/applications/user/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("[24] should get all applications for a job", async () => {
    const res = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  const pipeline = [
    "shortlisted",
    "interview_scheduled",
    "interview_done",
    "offer_sent",
    "offer_accepted",
    "hired"
  ] as const;

  pipeline.forEach((status) => {
    it(`[25-${status}] should update application status to "${status}"`, async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({ status });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    });
  });

  it("[26] should reject invalid status value with 400", async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ status: "flying" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid status value");
  });

  it("[27] should return 404 for non-existent application status update", async () => {
    const res = await request(app)
      .put("/api/applications/99999/status")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ status: "hired" });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 2 — MATCH ENGINE
// ═════════════════════════════════════════════════════════════════════════════
describe("Phase 2 — Match Engine: Score", () => {
  it("[28] should return match score with matched and missing skills", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/score/${userId}/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("matchScore");
    expect(res.body).toHaveProperty("matchedSkills");
    expect(res.body).toHaveProperty("missingSkills");
    expect(res.body).toHaveProperty("hiringProbability");
    expect(res.body.matchScore).toBeGreaterThanOrEqual(0);
    expect(res.body.matchScore).toBeLessThanOrEqual(100);
    expect(res.body.hiringProbability).toBeGreaterThanOrEqual(0);
    expect(res.body.hiringProbability).toBeLessThanOrEqual(100);
  });

  it("[29] match score should be higher after candidate adds more skills", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    // Get current score
    const before = await request(app)
      .get(`/api/match/score/${userId}/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    const prevScore = before.body.matchScore;

    // Add all required job skills to profile
    await request(app)
      .put(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ skills: ["React", "Node", "TypeScript", "Docker", "MongoDB", "Node.js"] });

    const after = await request(app)
      .get(`/api/match/score/${userId}/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(after.body.matchScore).toBeGreaterThanOrEqual(prevScore);
  });

  it("[30] should return 404 for match score with non-existent profile", async () => {
    const res = await request(app)
      .get(`/api/match/score/99999/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[31] should return 404 for match score with non-existent job", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/score/${userId}/99999`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });
});

describe("Phase 2 — Match Engine: Skill Gap", () => {
  it("[32] should return skill gap with missing skills and a message", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/gap/${userId}/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("missingSkills");
    expect(res.body).toHaveProperty("matchScore");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("jobTitle");
    expect(Array.isArray(res.body.missingSkills)).toBe(true);
  });

  it("[33] should return 404 for skill gap with non-existent user", async () => {
    const res = await request(app)
      .get(`/api/match/gap/99999/${jobId}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[34] should return 404 for skill gap with non-existent job", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/gap/${userId}/99999`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });
});

describe("Phase 2 — Match Engine: Career Roadmap", () => {
  const roles = ["backend developer", "frontend developer", "full stack developer", "data scientist"];

  roles.forEach((role) => {
    it(`[35-${role}] should return a roadmap for "${role}"`, async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
      const userId = loginRes.body.user.id;

      const res = await request(app)
        .get(`/api/match/roadmap/${userId}/${role}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("targetRole");
      expect(res.body).toHaveProperty("readiness");
      expect(res.body).toHaveProperty("acquiredSkills");
      expect(res.body).toHaveProperty("missingSkills");
      expect(res.body).toHaveProperty("learningPath");
      expect(res.body).toHaveProperty("recommendedProjects");
      expect(Array.isArray(res.body.learningPath)).toBe(true);
      expect(Array.isArray(res.body.recommendedProjects)).toBe(true);
    });
  });

  it("[36] should return 400 for invalid role with list of available roles", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/roadmap/${userId}/astronaut`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("availableRoles");
    expect(Array.isArray(res.body.availableRoles)).toBe(true);
  });

  it("[37] readiness should be 0% for a role with no matching skills", async () => {
    // Data Scientist has Python/Pandas/etc — our user has React/Node
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .get(`/api/match/roadmap/${userId}/data scientist`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.readiness).toBe("0%");
  });

  it("[38] should return 404 for roadmap with non-existent user", async () => {
    const res = await request(app)
      .get("/api/match/roadmap/99999/backend developer")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(404);
  });

  it("[39] match score should return 401 without token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: CANDIDATE_EMAIL, password: PASSWORD });
    const userId = loginRes.body.user.id;

    const res = await request(app).get(`/api/match/score/${userId}/${jobId}`);
    expect(res.status).toBe(401);
  });
});
