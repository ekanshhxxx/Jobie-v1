/**
 * ─── Resume AI Parser Service ─────────────────────────────────────────────────
 *
 * Standalone service: takes raw text (from a PDF or paste) and uses Groq's
 * blazing-fast LLM to extract structured data.
 *
 * Returns a clean object — controllers decide what to persist.
 * Works with any LLM-compatible API by swapping the base URL.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  projects: {
    name: string;
    description: string;
    tech: string[];
  }[];
  certifications: string[];
  languages: string[];
  suggestedRoles: string[];
  overallSummary: string;
}

// ─── Groq client ──────────────────────────────────────────────────────────────
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in environment");

  return axios.create({
    baseURL: "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert resume parser. Extract structured information from the given resume text.
Return ONLY valid JSON (no markdown, no explanation, no code fences) with this exact structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or empty string",
  "summary": "Brief professional summary (2-3 sentences)",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "company": "Company Name", "role": "Job Title", "duration": "Start - End", "highlights": ["achievement1"] }
  ],
  "education": [
    { "degree": "Degree Name", "institution": "University", "year": "Year or range" }
  ],
  "projects": [
    { "name": "Project Name", "description": "Brief description", "tech": ["tech1"] }
  ],
  "certifications": ["cert1"],
  "languages": ["English", "Hindi"],
  "suggestedRoles": ["Backend Developer", "Full Stack Developer"],
  "overallSummary": "One paragraph hiring recommendation"
}
Rules:
- Parse every detail you can find. If a field is not present in the text, return empty string or empty array.
- For skills, list individual technologies/tools/frameworks (e.g. "React" not "Frontend Development").
- suggestedRoles: Suggest 2-4 matching job titles based on the skills and experience.
- overallSummary: Write a brief hiring recommendation paragraph.`;

function extractSection(text: string, start: string, ends: string[]) {
  const lower = text.toLowerCase();
  const startIdx = lower.indexOf(start.toLowerCase());
  if (startIdx === -1) return "";
  const from = startIdx + start.length;
  const tail = text.slice(from);
  let endIdx = tail.length;
  for (const end of ends) {
    const idx = tail.toLowerCase().indexOf(end.toLowerCase());
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return tail.slice(0, endIdx).trim();
}

function parseResumeHeuristically(resumeText: string): ParsedResume {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const name = lines[0] || "Unknown Candidate";
  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = resumeText.match(/(\+?\d[\d\s\-()]{8,}\d)/)?.[0]?.trim() || "";

  const skillsSection = extractSection(resumeText, "Skills:", ["Experience:", "Education:", "Projects:", "Certifications:"]);
  const skills = [...new Set(
    skillsSection
      .split(/[,\n|]/)
      .map((s) => s.trim())
      .filter(Boolean)
  )];

  const experienceSection = extractSection(resumeText, "Experience:", ["Education:", "Projects:", "Certifications:"]);
  const experience = experienceSection
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((line) => ({
      company: line.includes(" at ") ? line.split(" at ")[1]?.split("(")[0]?.trim() || "Unknown Company" : "Unknown Company",
      role: line.includes(" at ") ? line.split(" at ")[0]?.trim() || "Developer" : line,
      duration: line.match(/\((.*?)\)/)?.[1] || "",
      highlights: [],
    }));

  const educationSection = extractSection(resumeText, "Education:", ["Projects:", "Certifications:"]);
  const education = educationSection
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((line) => ({
      degree: line.split("—")[0]?.trim() || line.split("-")[0]?.trim() || "Degree",
      institution: line.split("—")[1]?.trim() || line.split("-")[1]?.trim() || "Institution",
      year: line.match(/\b(19|20)\d{2}\b/)?.[0] || "",
    }));

  const projectsSection = extractSection(resumeText, "Projects:", ["Certifications:"]);
  const projects = projectsSection
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((line) => ({
      name: line.split("—")[0]?.trim() || line.split("-")[0]?.trim() || line,
      description: line.split("—")[1]?.trim() || line.split("-")[1]?.trim() || "",
      tech: skills.slice(0, 5),
    }));

  const certSection = extractSection(resumeText, "Certifications:", []);
  const certifications = certSection
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const suggestedRoles = skills.some((s) => /react|frontend|ui/i.test(s))
    ? ["Frontend Developer", "Full Stack Developer", "Software Engineer"]
    : ["Software Engineer", "Backend Developer", "Full Stack Developer"];

  return {
    name,
    email,
    phone,
    summary: `Candidate with ${skills.length} identified skills and practical project exposure.`,
    skills,
    experience,
    education,
    projects,
    certifications,
    languages: ["English"],
    suggestedRoles,
    overallSummary:
      "This candidate demonstrates practical engineering ability and can be considered for roles aligned with listed skills and experience.",
  };
}

// ─── Main function ────────────────────────────────────────────────────────────
export async function parseResume(resumeText: string): Promise<ParsedResume> {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error("Resume text is too short to parse");
  }

  try {
    const client = getGroqClient();

    const { data } = await client.post("/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Parse this resume:\n\n${resumeText}` }
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response from Groq API");

    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    return JSON.parse(cleaned) as ParsedResume;
  } catch {
    return parseResumeHeuristically(resumeText);
  }
}

// ─── Skill analysis helper (standalone, reusable) ─────────────────────────────
export function analyseResumeSkills(
  parsed: ParsedResume,
  targetSkills: string[]
): {
  matched: string[];
  missing: string[];
  matchPercentage: number;
  extraSkills: string[];
} {
  const normalize = (s: string) => s.toLowerCase().trim();
  const parsedNorm = parsed.skills.map(normalize);
  const targetNorm = targetSkills.map(normalize);

  const matched = targetSkills.filter((s) => parsedNorm.includes(normalize(s)));
  const missing = targetSkills.filter((s) => !parsedNorm.includes(normalize(s)));
  const extraSkills = parsed.skills.filter((s) => !targetNorm.includes(normalize(s)));
  const matchPercentage = targetSkills.length > 0
    ? Math.round((matched.length / targetSkills.length) * 100)
    : 100;

  return { matched, missing, matchPercentage, extraSkills };
}

// ─── Resume Report Card ────────────────────────────────────────────────────────
export interface ResumeReportCard {
  overallScore: number;           // 0–100
  strengths: string[];            // top 3 bullet points
  weaknesses: string[];           // top 3 gaps/concerns
  hiringRecommendation: string;   // one paragraph
  suggestedRoles: string[];
  generatedAt: string;
}

const REPORT_SYSTEM_PROMPT = `You are a senior technical recruiter and career coach.
Analyse the provided structured resume data and output ONLY valid JSON with this exact structure:
{
  "overallScore": <integer 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "hiringRecommendation": "One paragraph starting with 'This candidate...' summarising fit and recommendation.",
  "suggestedRoles": ["Role 1", "Role 2", "Role 3"]
}
Scoring guide:
- 85-100: Exceptional - strong skills, solid experience, impressive projects
- 70-84: Strong - good skills, some relevant experience
- 55-69: Average - decent skills but gaps in experience or depth
- 40-54: Below average - skill gaps, limited experience
- 0-39: Weak - major gaps, entry-level only
Rules for weaknesses:
- Base every weakness strictly on provided resume data.
- Never infer personal life events or completion status.
- If dates/details are missing, use neutral wording like "Education timeline details are limited in the resume."
Return ONLY the JSON object. No markdown, no preamble.`;

function sanitizeWeaknesses(weaknesses: string[]): string[] {
  return weaknesses.map((w) => {
    if (/gaps?\s+in\s+education\s+completion/i.test(w)) {
      return "Education timeline details are limited in the resume.";
    }
    return w;
  });
}

export async function generateResumeReport(parsed: ParsedResume): Promise<ResumeReportCard> {
  const summary = `
Name: ${parsed.name}
Skills (${parsed.skills.length}): ${parsed.skills.slice(0, 20).join(", ")}
Experience entries: ${parsed.experience.length}
  ${parsed.experience.map(e => `- ${e.role} at ${e.company} (${e.duration})`).join("\n  ")}
Education: ${parsed.education.map(e => `${e.degree} from ${e.institution} (${e.year})`).join("; ")}
Projects (${parsed.projects.length}): ${parsed.projects.map(p => p.name).join(", ")}
Certifications: ${parsed.certifications.join(", ") || "None"}
Suggested Roles: ${parsed.suggestedRoles.join(", ")}
Professional Summary: ${parsed.summary}
`;

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const client = axios.create({
      baseURL: "https://api.groq.com/openai/v1",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      timeout: 30000,
    });

    const { data } = await client.post("/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user", content: `Generate a report card for this resume:\n\n${summary}` },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response from Groq API");

    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const card = JSON.parse(cleaned) as ResumeReportCard;
    card.weaknesses = sanitizeWeaknesses(card.weaknesses || []);
    card.generatedAt = new Date().toISOString();
    return card;
  } catch {
    const experienceWeight = Math.min(parsed.experience.length * 12, 30);
    const projectWeight = Math.min(parsed.projects.length * 8, 24);
    const skillWeight = Math.min(parsed.skills.length * 2, 30);
    const overallScore = Math.min(95, Math.max(35, experienceWeight + projectWeight + skillWeight));
    return {
      overallScore,
      strengths: [
        parsed.skills.length > 0 ? `Broad skill coverage across ${parsed.skills.length} technologies.` : "Baseline technical profile present.",
        parsed.experience.length > 0 ? `Contains ${parsed.experience.length} documented experience entries.` : "Profile can benefit from more experience detail.",
        parsed.projects.length > 0 ? `Includes ${parsed.projects.length} projects demonstrating applied work.` : "Project section can be expanded for stronger evidence.",
      ],
      weaknesses: [
        parsed.certifications.length === 0 ? "No certifications listed." : "Certification depth can be expanded further.",
        parsed.projects.length < 2 ? "Limited number of projects for portfolio proof." : "Project impact metrics can be more quantified.",
        parsed.summary.length < 40 ? "Professional summary is brief and could be more specific." : "Summary can include more measurable achievements.",
      ],
      hiringRecommendation:
        "This candidate shows meaningful technical potential with practical experience and can be considered for roles aligned with the listed stack.",
      suggestedRoles: parsed.suggestedRoles?.length ? parsed.suggestedRoles.slice(0, 3) : ["Software Engineer"],
      generatedAt: new Date().toISOString(),
    };
  }
}


