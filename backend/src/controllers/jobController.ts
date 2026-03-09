import { Request, Response } from "express";
import Job from "../models/Job";

/* ---------------- Candidate APIs ---------------- */

// Get all jobs
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.findAll({
      where: { status: "active" }
    });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs", error });
  }
};

// Get single job
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByPk(Number(req.params.id));

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job", error });
  }
};

/* ---------------- Recruiter APIs ---------------- */

// Create job
export const createJob = async (req: Request, res: Response) => {
  try {

    const {
      title,
      description,
      company,
      location,
      salary,
      experience,
      jobType,
      skills,
      techSkills,
      recruiterId,
      status
    } = req.body;

    if (
      !title ||
      !company ||
      !location ||
      !salary ||
      !experience ||
      !jobType ||
      !description
    ) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    const job = await Job.create({
      title,
      description,
      company,
      location,
      salary,
      experience,
      jobType,
      skills,
      techSkills,
      recruiterId,
      status
    });

    res.status(201).json(job);

  } catch (error) {
    res.status(500).json({ error });
  }
};

// Update job
export const updateJob = async (req: Request, res: Response) => {
  try {

    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.update(req.body);

    res.json(job);

  } catch (error) {
    res.status(500).json({ error });
  }
};

// Delete job
export const deleteJob = async (req: Request, res: Response) => {
  try {

    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.destroy();

    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    res.status(500).json({ error });
  }
};

// Recruiter job list
export const getRecruiterJobs = async (req: Request, res: Response) => {
  try {

    const recruiterId = Number(req.query.recruiterId);

    const jobs = await Job.findAll({
      where: { recruiterId },
      order: [["createdAt", "DESC"]]
    });

    res.json(jobs);

  } catch (error) {
    res.status(500).json({ error });
  }
};