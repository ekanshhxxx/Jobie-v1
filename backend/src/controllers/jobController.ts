import { Request, Response } from "express";
import Job from "../models/Job";

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, description, company, location, recruiterId } = req.body;

    const job = await Job.create({
      title,
      description,
      company,
      location,
      recruiterId,
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    await job.update(req.body);

    res.json(job);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    await job.destroy();

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getRecruiterJobs = async (req: Request, res: Response) => {
  try {
    const recruiterId = Number(req.query.recruiterId);

    const jobs = await Job.findAll({
      where: { recruiterId },
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error });
  }
};