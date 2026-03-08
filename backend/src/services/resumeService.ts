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

// ─── Main function ────────────────────────────────────────────────────────────
export async function parseResume(resumeText: string): Promise<ParsedResume> {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error("Resume text is too short to parse");
  }

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

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  try {
    return JSON.parse(cleaned) as ParsedResume;
  } catch {
    throw new Error("Failed to parse AI response as JSON. Raw: " + cleaned.substring(0, 200));
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
