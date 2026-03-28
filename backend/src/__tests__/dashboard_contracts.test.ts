import request from "supertest";
import express from "express";
import cors from "cors";
import sequelize from "../config/database";
import "../models";
import authRoutes from "../routes/authRoutes";
import profileRoutes from "../routes/profileRoutes";
import jobRoutes from "../routes/jobRoutes";
import applicationRoutes from "../routes/applicationRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

let candidate1Token = "";
let candidate2Token = "";
let recruiterToken = "";
let adminToken = "";
let candidate1Id = 0;
let candidate2Id = 0;
let recruiterId = 0;
let jobId = 0;
let applicationId = 0;

const ts = Date.now();
const PASSWORD = "Test@1234";

beforeAll(async () => {
  await sequelize.sync({ force: false });

  const c1 = await request(app).post("/api/auth/register").send({
    name: "Candidate One",
    email: `dashboard_c1_${ts}@test.com`,
    password: PASSWORD,
    role: "candidate",
  });
  candidate1Token = c1.body.token;
  candidate1Id = c1.body.user.id;

  const c2 = await request(app).post("/api/auth/register").send({
    name: "Candidate Two",
    email: `dashboard_c2_${ts}@test.com`,
    password: PASSWORD,
    role: "candidate",
  });
  candidate2Token = c2.body.token;
  candidate2Id = c2.body.user.id;

  const r = await request(app).post("/api/auth/register").send({
    name: "Recruiter",
    email: `dashboard_r_${ts}@test.com`,
    password: PASSWORD,
    role: "recruiter",
  });
  recruiterToken = r.body.token;
  recruiterId = r.body.user.id;

  const a = await request(app).post("/api/auth/register").send({
    name: "Admin",
    email: `dashboard_a_${ts}@test.com`,
    password: PASSWORD,
    role: "admin",
  });
  adminToken = a.body.token;

  await request(app)
    .post(`/api/profile/${candidate1Id}`)
    .set("Authorization", `Bearer ${candidate1Token}`)
    .send({ bio: "Candidate one profile", skills: ["React"] });

  await request(app)
    .post(`/api/profile/${candidate2Id}`)
    .set("Authorization", `Bearer ${candidate2Token}`)
    .send({ bio: "Candidate two profile", skills: ["Node"] });

  const job = await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send({
      title: "Platform Engineer",
      company: "Jobie",
      location: "Remote",
      salary: "120000",
      description: "Build platform APIs",
      requiredSkills: ["Node", "TypeScript"],
      techStack: ["Express", "MySQL"],
      experienceLevel: "mid",
      recruiterId,
      status: "approved",
    });
  jobId = job.body.id;

  const appRes = await request(app)
    .post("/api/applications/apply")
    .set("Authorization", `Bearer ${candidate1Token}`)
    .send({ userId: candidate1Id, jobId });
  applicationId = appRes.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Dashboard Contracts and Access Control", () => {
  it("blocks candidate from reading another candidate profile", async () => {
    const res = await request(app)
      .get(`/api/profile/${candidate2Id}`)
      .set("Authorization", `Bearer ${candidate1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied");
  });

  it("allows admin to read any candidate profile", async () => {
    const res = await request(app)
      .get(`/api/profile/${candidate2Id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(candidate2Id);
  });

  it("blocks candidate from reading another candidate applications", async () => {
    const res = await request(app)
      .get(`/api/applications/user/${candidate2Id}`)
      .set("Authorization", `Bearer ${candidate1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied");
  });

  it("allows admin to read any candidate applications", async () => {
    const res = await request(app)
      .get(`/api/applications/user/${candidate1Id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns recruiter applications with candidate and job details", async () => {
    const res = await request(app)
      .get(`/api/applications/recruiter/${recruiterId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("User");
    expect(res.body[0]).toHaveProperty("Job");
  });

  it("blocks non-recruiter owner from recruiter applications endpoint", async () => {
    const res = await request(app)
      .get(`/api/applications/recruiter/${recruiterId}`)
      .set("Authorization", `Bearer ${candidate1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied");
  });

  it("supports canonical and alias status update endpoints", async () => {
    const aliasRes = await request(app)
      .put(`/api/applications/${applicationId}`)
      .set("Authorization", `Bearer ${candidate1Token}`)
      .send({ status: "shortlisted" });

    expect(aliasRes.status).toBe(200);
    expect(aliasRes.body.status).toBe("shortlisted");

    const canonicalRes = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${candidate1Token}`)
      .send({ status: "interview_scheduled" });

    expect(canonicalRes.status).toBe(200);
    expect(canonicalRes.body.status).toBe("interview_scheduled");
  });
});
