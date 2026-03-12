import { Request, Response } from "express";
import Application from "../models/Application";
import Job from "../models/Job";

/* Apply for a job */

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


/* Get applications by user */

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


/* Get applications for a specific job */

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


/* NEW: Get applications for all jobs posted by a recruiter */

export const getRecruiterApplications = async (req: Request, res: Response) => {

  try {

    const recruiterId = Number(req.params.recruiterId);

    const jobs = await Job.findAll({
      where: { recruiterId }
    });

    const jobIds = jobs.map((job: any) => job.id);

    const applications = await Application.findAll({
      where: { jobId: jobIds }
    });

    res.status(200).json(applications);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching recruiter applications",
      error
    });

  }

};