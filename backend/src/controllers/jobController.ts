import { Request, Response } from "express";
import Job from "../models/Job";
import Application from "../models/Application";

/* ---------------- Candidate APIs ---------------- */

// Get all active jobs
export const getAllJobs = async (req: Request, res: Response) => {
  try {

    const jobs = await Job.findAll({
      where: { status: "active" }
    });

    res.status(200).json(jobs);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching jobs",
      error
    });

  }
};


// Get single job
export const getJobById = async (req: Request, res: Response) => {
  try {

    const job = await Job.findByPk(Number(req.params.id));

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    res.status(200).json(job);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching job",
      error
    });

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

    res.status(500).json({
      message: "Error creating job",
      error
    });

  }
};


// Update job
export const updateJob = async (req: Request, res: Response) => {
  try {

    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    await job.update(req.body);

    res.status(200).json(job);

  } catch (error) {

    res.status(500).json({
      message: "Error updating job",
      error
    });

  }
};


// Delete job
export const deleteJob = async (req: Request, res: Response) => {
  try {

    const id = Number(req.params.id);

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    // delete all applications related to this job
    const deletedApplications = await Application.destroy({
      where: { jobId: id }
    });

    // delete the job
    await job.destroy();

    res.status(200).json({
      message: "Job and related applications deleted successfully",
      deletedApplications
    });

  } catch (error) {

    res.status(500).json({
      message: "Error deleting job",
      error
    });

  }
};


// Get jobs posted by recruiter
export const getRecruiterJobs = async (req: Request, res: Response) => {
  try {

    const recruiterId = Number(req.query.recruiterId);

    if (!recruiterId || isNaN(recruiterId)) {
      return res.status(400).json({
        message: "Valid recruiterId query parameter is required"
      });
    }

    const jobs = await Job.findAll({
      where: { recruiterId },
      order: [["createdAt", "DESC"]]
    });

    // Add applications count for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job: any) => {

        const count = await Application.count({
          where: { jobId: job.id }
        });

        return {
          ...job.toJSON(),
          applicationsCount: count
        };

      })
    );

    res.status(200).json(jobsWithApplications);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching recruiter jobs",
      error
    });

  }
};