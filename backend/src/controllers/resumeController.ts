import { Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { parseResume, analyseResumeSkills } from "../services/resumeService";
import Profile from "../models/Profile";
import Job from "../models/Job";

// Helper: extract text from a PDF buffer using pdf-parse v2
async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return { text: result.text, pages: result.total };
}

// ─── Multer: in-memory only (no files on disk) ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  }
});

export const uploadMiddleware = upload.single("resume");

// ─── POST /api/resume/parse ──────────────────────────────────────────────────
// Upload a PDF → extract text → AI parse → return structured data
export const parseResumeFromPDF = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded. Use form-data field 'resume'." });
    }

    const pdfData = await extractTextFromPDF(req.file.buffer);
    const text = pdfData.text;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ message: "Could not extract enough text from this PDF." });
    }

    const parsed = await parseResume(text);

    res.status(200).json({
      message: "Resume parsed successfully",
      parsed,
      metadata: {
        pages: pdfData.pages,
        textLength: text.length,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error parsing resume", error: error.message });
  }
};

// ─── POST /api/resume/parse-text ─────────────────────────────────────────────
// Paste raw text → AI parse → return structured data (no file upload needed)
export const parseResumeFromText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ message: "Resume text is required (minimum 50 characters)." });
    }

    const parsed = await parseResume(text);

    res.status(200).json({ message: "Resume parsed successfully", parsed });
  } catch (error: any) {
    res.status(500).json({ message: "Error parsing resume", error: error.message });
  }
};

// ─── POST /api/resume/parse-and-save/:userId ─────────────────────────────────
// Upload PDF → parse → auto-fill profile fields → save to DB
export const parseAndSaveToProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found. Create profile first." });

    // Accept either PDF upload or text body
    let text: string;
    if (req.file) {
      const pdfData = await extractTextFromPDF(req.file.buffer);
      text = pdfData.text;
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      return res.status(400).json({ message: "Upload a PDF or provide 'text' in body." });
    }

    if (text.trim().length < 50) {
      return res.status(400).json({ message: "Not enough text to parse." });
    }

    const parsed = await parseResume(text);

    // Smart merge: keep existing data, enrich with parsed
    const currentSkills: string[] = (profile as any).skills || [];
    const normalize = (s: string) => s.toLowerCase().trim();
    const currentNorm = currentSkills.map(normalize);
    const mergedSkills = [
      ...currentSkills,
      ...parsed.skills.filter((s) => !currentNorm.includes(normalize(s)))
    ];

    const currentExperience: any[] = (profile as any).experience || [];
    const mergedExperience = parsed.experience.length > currentExperience.length
      ? parsed.experience
      : currentExperience;

    const currentEducation: any[] = (profile as any).education || [];
    const mergedEducation = parsed.education.length > currentEducation.length
      ? parsed.education
      : currentEducation;

    const currentProjects: any[] = (profile as any).projects || [];
    const mergedProjects = [...currentProjects];
    const existingNames = currentProjects.map((p: any) => normalize(p.name || ""));
    parsed.projects.forEach((p) => {
      if (!existingNames.includes(normalize(p.name))) mergedProjects.push(p);
    });

    // Build updated profile data
    const updateData: any = {
      skills: mergedSkills,
      experience: mergedExperience,
      education: mergedEducation,
      projects: mergedProjects,
    };
    if (!((profile as any).bio) && parsed.summary) updateData.bio = parsed.summary;

    // Recompute completeness
    const merged = { ...(profile as any).dataValues, ...updateData };
    let completeness = 0;
    if (merged.bio) completeness += 10;
    if (merged.skills?.length > 0) completeness += 20;
    if (merged.experience?.length > 0) completeness += 20;
    if (merged.education?.length > 0) completeness += 15;
    if (merged.projects?.length > 0) completeness += 20;
    if (merged.githubUsername) completeness += 10;
    if (merged.githubVerifiedSkills?.length > 0) completeness += 5;
    updateData.profileCompleteness = completeness;

    await profile.update(updateData);

    res.status(200).json({
      message: "Resume parsed and profile updated",
      parsed,
      updatedProfile: {
        skills: mergedSkills,
        experience: mergedExperience,
        education: mergedEducation,
        projects: mergedProjects,
        profileCompleteness: completeness,
      },
      suggestedRoles: parsed.suggestedRoles,
      overallSummary: parsed.overallSummary,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error parsing resume", error: error.message });
  }
};

// ─── POST /api/resume/match/:jobId ──────────────────────────────────────────
// Upload PDF → parse → compare skills against a specific job (no save)
export const matchResumeToJob = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Accept PDF or text
    let text: string;
    if (req.file) {
      const pdfData = await extractTextFromPDF(req.file.buffer);
      text = pdfData.text;
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      return res.status(400).json({ message: "Upload a PDF or provide 'text' in body." });
    }

    if (text.trim().length < 50) {
      return res.status(400).json({ message: "Not enough text to parse." });
    }

    const parsed = await parseResume(text);

    const requiredSkills: string[] = (job as any).requiredSkills || [];
    const techStack: string[] = (job as any).techStack || [];
    const allRequired = [...requiredSkills, ...techStack];

    const analysis = analyseResumeSkills(parsed, allRequired);

    res.status(200).json({
      jobId,
      jobTitle: (job as any).title,
      candidateName: parsed.name,
      ...analysis,
      suggestedRoles: parsed.suggestedRoles,
      message: analysis.matchPercentage >= 80
        ? "Excellent fit! This candidate matches most requirements."
        : analysis.matchPercentage >= 50
          ? "Moderate fit — some skills are missing but transferable."
          : "Low match — significant skill gaps for this role."
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error matching resume to job", error: error.message });
  }
};
