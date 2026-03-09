import { Request, Response } from "express";
import Job from "../models/Job";

// Get all jobs
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.findAll();
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

// Create job
export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, company, location, salary, description, requiredSkills, techStack, experienceLevel, recruiterId } = req.body;

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      requiredSkills: requiredSkills || [],
      techStack: techStack || [],
      experienceLevel: experienceLevel || "mid",
      recruiterId: recruiterId || null
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error creating job", error });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.update(req.body);

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error updating job", error });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.destroy();

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job", error });
  }
};

// Get all jobs posted by a specific recruiter
export const getRecruiterJobs = async (req: Request, res: Response) => {
  try {
    const recruiterId = Number(req.query.recruiterId);

    if (!recruiterId) {
      return res.status(400).json({ message: "recruiterId query param is required" });
    }

    const jobs = await Job.findAll({ where: { recruiterId } });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recruiter jobs", error });
  }
};