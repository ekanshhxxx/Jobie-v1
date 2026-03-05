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

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = [
      "applied", "shortlisted", "interview_scheduled", "interview_done",
      "offer_sent", "offer_accepted", "offer_rejected", "hired", "rejected"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    await application.update({ status });
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: "Error updating application status", error });
  }
};