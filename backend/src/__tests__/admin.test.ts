import request from "supertest";
import express from "express";
import cors from "cors";
import sequelize from "../config/database";
import "../models";
import authRoutes from "../routes/authRoutes";
import adminRoutes from "../routes/adminRoutes";
import jobRoutes from "../routes/jobRoutes";
import applicationRoutes from "../routes/applicationRoutes";

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// ─── Shared state ─────────────────────────────────────────────────────────────
let adminToken: string;
let adminId: number;
let candidateToken: string;
let candidateId: number;
let recruiterId: number;
let recruiterToken: string;
let jobId: number;
let applicationId: number;
let deletableUserId: number;
let deletableJobId: number;

const ts = Date.now();
const ADMIN_EMAIL     = `admin_${ts}@test.com`;
const CANDIDATE_EMAIL = `candidate_${ts}@test.com`;
const RECRUITER_EMAIL = `recruiter_${ts}@test.com`;
const DELETE_EMAIL    = `delete_me_${ts}@test.com`;
const PASSWORD = "Test@1234";

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await sequelize.sync();

  // Register admin
  const a = await request(app).post("/api/auth/register")
    .send({ name: "Admin", email: ADMIN_EMAIL, password: PASSWORD, role: "admin" });
  adminToken = a.body.token;
  adminId = a.body.user.id;

  // Register candidate
  const c = await request(app).post("/api/auth/register")
    .send({ name: "Candidate", email: CANDIDATE_EMAIL, password: PASSWORD, role: "candidate" });
  candidateToken = c.body.token;
  candidateId = c.body.user.id;

  // Register recruiter
  const r = await request(app).post("/api/auth/register")
    .send({ name: "Recruiter", email: RECRUITER_EMAIL, password: PASSWORD, role: "recruiter" });
  recruiterToken = r.body.token;
  recruiterId = r.body.user.id;

  // Register a deletable user
  const d = await request(app).post("/api/auth/register")
    .send({ name: "Delete Me", email: DELETE_EMAIL, password: PASSWORD, role: "candidate" });
  deletableUserId = d.body.user.id;

  // Create a job (via jobs route, no auth required for basic create)
  const j = await request(app).post("/api/jobs")
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send({
      title: "Admin Test Job",
      company: "TestCo",
      location: "Remote",
      salary: "60000",
      description: "Test job for admin tests",
      requiredSkills: ["Node", "React"],
      techStack: ["Node.js"],
      experienceLevel: "junior",
      recruiterId
    });
  jobId = j.body.id;

  // Create a deletable job
  const dj = await request(app).post("/api/jobs")
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send({
      title: "Deletable Job",
      company: "TestCo",
      location: "Remote",
      salary: "50000",
      description: "Will be deleted",
      requiredSkills: [],
      techStack: [],
      experienceLevel: "junior",
      recruiterId
    });
  deletableJobId = dj.body.id;

  // Create an application
  const ap = await request(app).post("/api/applications/apply")
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({ userId: candidateId, jobId });
  applicationId = ap.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

// ═════════════════════════════════════════════════════════════════════════════
// ACCESS CONTROL
// ═════════════════════════════════════════════════════════════════════════════
describe("Admin — Access Control", () => {
  it("[A1] should block unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("[A2] should block candidate token with 403", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied");
  });

  it("[A3] should block recruiter token with 403", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);
  });

  it("[A4] should allow admin token through", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// STATS
// ═════════════════════════════════════════════════════════════════════════════
describe("Admin — Dashboard Stats", () => {
  it("[A5] should return platform stats with correct shape", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(res.body).toHaveProperty("jobs");
    expect(res.body).toHaveProperty("applications");
    expect(res.body.users).toHaveProperty("total");
    expect(res.body.users).toHaveProperty("candidates");
    expect(res.body.users).toHaveProperty("recruiters");
    expect(res.body.users).toHaveProperty("admins");
    expect(res.body.applications).toHaveProperty("byStatus");
    expect(Array.isArray(res.body.applications.byStatus)).toBe(true);
  });

  it("[A6] user totals should reflect registered users", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.body.users.total).toBeGreaterThanOrEqual(3); // admin + candidate + recruiter
    expect(res.body.users.candidates).toBeGreaterThanOrEqual(1);
    expect(res.body.users.recruiters).toBeGreaterThanOrEqual(1);
    expect(res.body.users.admins).toBeGreaterThanOrEqual(1);
  });

  it("[A7] job total should be at least 1", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.body.jobs.total).toBeGreaterThanOrEqual(1);
  });
});

// USER MANAGEMENT

describe("Admin — User Management", () => {
  it("[A8] should list all users without passwords", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((u: any) => {
      expect(u).not.toHaveProperty("password");
    });
  });

  it("[A9] should filter users by role=candidate", async () => {
    const res = await request(app)
      .get("/api/admin/users?role=candidate")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((u: any) => {
      expect(u.role).toBe("candidate");
    });
  });

  it("[A10] should filter users by role=recruiter", async () => {
    const res = await request(app)
      .get("/api/admin/users?role=recruiter")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((u: any) => {
      expect(u.role).toBe("recruiter");
    });
  });

  it("[A11] should get full user detail by ID", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${candidateId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(candidateId);
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).toHaveProperty("applications");
    expect(Array.isArray(res.body.applications)).toBe(true);
  });

  it("[A12] should return 404 for non-existent user", async () => {
    const res = await request(app)
      .get("/api/admin/users/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("[A13] should search users by name", async () => {
    const res = await request(app)
      .get("/api/admin/users/search?q=Candidate")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((u: any) => {
      expect(u).not.toHaveProperty("password");
    });
  });

  it("[A14] should search users by email fragment", async () => {
    const fragment = CANDIDATE_EMAIL.split("@")[0];
    const res = await request(app)
      .get(`/api/admin/users/search?q=${fragment}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].email).toBe(CANDIDATE_EMAIL);
  });

  it("[A15] should return 400 when search query is missing", async () => {
    const res = await request(app)
      .get("/api/admin/users/search")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("'q'");
  });

  it("[A16] should change a user's role", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${candidateId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "recruiter" });

    expect(res.status).toBe(200);
    expect(res.body.newRole).toBe("recruiter");
    expect(res.body.userId).toBe(candidateId);
  });

  it("[A17] should restore the role back to candidate", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${candidateId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "candidate" });

    expect(res.status).toBe(200);
    expect(res.body.newRole).toBe("candidate");
  });

  it("[A18] should reject invalid role values with 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${candidateId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("validRoles");
  });

  it("[A19] should not allow admin to change their own role", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "candidate" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("cannot change your own role");
  });

  it("[A20] should not allow admin to delete themselves", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("cannot delete your own account");
  });

  it("[A21] should return 404 when deleting non-existent user", async () => {
    const res = await request(app)
      .delete("/api/admin/users/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("[A22] should delete a user and return success message", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${deletableUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("[A23] deleted user should no longer appear in user list", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${deletableUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// JOB MANAGEMENT

describe("Admin — Job Management", () => {
  it("[A24] should list all jobs with recruiter info", async () => {
    const res = await request(app)
      .get("/api/admin/jobs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const job = res.body.find((j: any) => j.id === jobId);
    expect(job).toBeDefined();
    expect(job.recruiter).toBeDefined();
    expect(job.recruiter).toHaveProperty("email");
  });

  it("[A25] should filter jobs by recruiterId", async () => {
    const res = await request(app)
      .get(`/api/admin/jobs?recruiterId=${recruiterId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((j: any) => {
      expect(j.recruiterId).toBe(recruiterId);
    });
  });

  it("[A26] should return 404 when deleting non-existent job", async () => {
    const res = await request(app)
      .delete("/api/admin/jobs/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("[A27] should delete a job and return success", async () => {
    const res = await request(app)
      .delete(`/api/admin/jobs/${deletableJobId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Job deleted successfully");
  });
});

// APPLICATION MANAGEMENT

describe("Admin — Application Management", () => {
  it("[A28] should list all applications with user and job details", async () => {
    const res = await request(app)
      .get("/api/admin/applications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const app1 = res.body[0];
    expect(app1).toHaveProperty("status");
    expect(app1).toHaveProperty("User");
    expect(app1).toHaveProperty("Job");
    expect(app1.User).toHaveProperty("email");
    expect(app1.Job).toHaveProperty("title");
  });

  it("[A29] should filter applications by status=applied", async () => {
    const res = await request(app)
      .get("/api/admin/applications?status=applied")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((a: any) => {
      expect(a.status).toBe("applied");
    });
  });

  it("[A30] should return empty array for a status with no records", async () => {
    const res = await request(app)
      .get("/api/admin/applications?status=offer_rejected")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("[A31] applications list should contain the application created in setup", async () => {
    const res = await request(app)
      .get("/api/admin/applications")
      .set("Authorization", `Bearer ${adminToken}`);

    const found = res.body.find((a: any) => a.id === applicationId);
    expect(found).toBeDefined();
    expect(found.User.id).toBe(candidateId);
    expect(found.Job.id).toBe(jobId);
  });
});

