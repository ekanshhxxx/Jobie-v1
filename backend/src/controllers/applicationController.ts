import { Request, Response } from "express";
import Application from "../models/Application";

export const applyJob = async (req: Request, res: Response) => {
  try {
    const { userId, jobId } = req.body;

    const application = await Application.create({
      userId,
      jobId
    });

    res.status(201).json(application);

  } catch (error) {
    res.status(500).json({
      message: "Error applying for job",
      error
    });
  }
};

export const getUserApplications = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    const applications = await Application.findAll({
      where: { userId }
    });

    res.status(200).json(applications);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching applications",
      error
    });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);

    const applications = await Application.findAll({
      where: { jobId }
    });

    res.status(200).json(applications);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching job applications",
      error
    });
  }
};