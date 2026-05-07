import { Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";
import { parseResume, analyseResumeSkills, generateResumeReport } from "../services/resumeService";
import Profile from "../models/Profile";
import Job from "../models/Job";
import { getProfileWithFallback, saveProfileDual } from "../services/dbFallbackService";

// Helper: extract text from a PDF buffer using pdf-parse v2
async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return { text: result.text, pages: result.total };
}

function persistResumeFile(file: Express.Multer.File): string {
  const uploadRoot = path.resolve(__dirname, "../../uploads/resumes");
  fs.mkdirSync(uploadRoot, { recursive: true });
  const safe = (file.originalname || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safe}`;
  const fullPath = path.join(uploadRoot, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return `/uploads/resumes/${filename}`;
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
      text,
      parsed,
      metadata: {
        pages: pdfData.pages,
        textLength: text.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error parsing resume", error: error.message });
  }
};

// ─── POST /api/resume/parse-text ─────────────────────────────────────────────
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
export const parseAndSaveToProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { data: profile } = await getProfileWithFallback(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found. Create profile first." });

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

    const isAcademicEducationEntry = (entry: { degree?: string; institution?: string; school?: string; year?: string; years?: string }) => {
      const degree = String(entry?.degree || "").toLowerCase();
      const institution = String(entry?.institution || entry?.school || "").toLowerCase();
      const combined = `${degree} ${institution}`.trim();
      if (!combined) return false;
      const academicSignals = [
        "bachelor", "master", "phd", "b.tech", "btech", "be ", "b.e", "m.tech", "mtech",
        "mba", "bca", "mca", "bsc", "msc", "university", "college", "school", "class x", "class xii",
        "10th", "12th", "high school", "intermediate", "diploma",
      ];
      return academicSignals.some((signal) => combined.includes(signal));
    };

    const isLikelyCertificationEducation = (entry: { degree?: string; institution?: string; school?: string; year?: string; years?: string }) => {
      const degree = String(entry?.degree || "").toLowerCase();
      const institution = String(entry?.institution || entry?.school || "").toLowerCase();
      const combined = `${degree} ${institution}`.trim();
      if (!combined) return false;
      if (isAcademicEducationEntry(entry)) return false;
      const certSignals = [
        "certification", "certificate", "course", "bootcamp", "training",
        "academy", "workshop", "nanodegree", "specialization",
      ];
      return certSignals.some((signal) => combined.includes(signal));
    };

    const sanitizeEducation = (list: any[]) =>
      (Array.isArray(list) ? list : [])
        .map((entry) => ({
          degree: String(entry?.degree || "").trim(),
          institution: String(entry?.institution || entry?.school || "").trim(),
          year: String(entry?.year || entry?.years || "").trim(),
        }))
        .filter((entry) => entry.degree || entry.institution || entry.year)
        .filter((entry) => !isLikelyCertificationEducation(entry));

    const currentEducation: any[] = sanitizeEducation((profile as any).education || []);
    const parsedEducation: any[] = sanitizeEducation(parsed.education || []);
    const mergedEducation = parsedEducation.length > 0 ? parsedEducation : currentEducation;

    const currentProjects: any[] = (profile as any).projects || [];
    const mergedProjects = [...currentProjects];
    const existingNames = currentProjects.map((p: any) => normalize(p.name || ""));
    parsed.projects.forEach((p) => {
      if (!existingNames.includes(normalize(p.name))) mergedProjects.push(p);
    });

    const updateData: any = {
      skills: mergedSkills,
      experience: mergedExperience,
      education: mergedEducation,
      projects: mergedProjects,
    };
    if (req.file) {
      updateData.resumeUrl = persistResumeFile(req.file);
    }
    if (!((profile as any).bio) && parsed.summary) updateData.bio = parsed.summary;

    let resumeReport: any = null;
    try {
      resumeReport = await generateResumeReport(parsed);
      updateData.resumeReport = resumeReport;
    } catch (e) {
      console.error("Resume report generation failed (non-fatal):", e);
    }

    const { mysqlResult, mongoResult } = await saveProfileDual(userId, updateData);
    const finalProfile = mysqlResult || mongoResult;

    res.status(200).json({
      message: "Resume parsed and profile updated",
      parsed,
      resumeReport,
      updatedProfile: {
        skills: mergedSkills,
        experience: mergedExperience,
        education: mergedEducation,
        projects: mergedProjects,
        resumeUrl: (finalProfile as any).resumeUrl || (profile as any).resumeUrl || null,
        profileCompleteness: (finalProfile as any).profileCompleteness,
      },
      suggestedRoles: parsed.suggestedRoles,
      overallSummary: parsed.overallSummary,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error parsing resume", error: error.message });
  }
};

// ─── POST /api/resume/match/:jobId ──────────────────────────────────────────
export const matchResumeToJob = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

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
    const allRequired = [...((job as any).requiredSkills || []), ...((job as any).techStack || [])];
    const analysis = analyseResumeSkills(parsed, allRequired);

    res.status(200).json({
      jobId, ...analysis, suggestedRoles: parsed.suggestedRoles,
      message: analysis.matchPercentage >= 80 ? "Excellent fit!" : "Incomplete match."
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error matching resume", error: error.message });
  }
};

// ─── GET /api/resume/report/:userId ─────────────────────────────────────────
export const getResumeReport = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { data: profile } = await getProfileWithFallback(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const report = (profile as any).resumeReport;
    if (!report) return res.status(404).json({ message: "No report found. Upload resume first." });
    res.status(200).json({ userId, resumeReport: report });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching resume report", error: error.message });
  }
};
