import Groq from 'groq-sdk';
import Job from '../models/Job';
import Profile from '../models/Profile';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface AtsResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

export async function analyseWithAts(jobId: number, userId: number): Promise<AtsResult> {
  const job = await Job.findByPk(jobId);
  if (!job) throw new Error('Job not found');

  const profile = await Profile.findOne({ where: { userId } });
  if (!profile) throw new Error('Profile not found');

  const jobDescription = (job as any).description;
  const candidateProfile = `
    Skills: ${((profile as any).skills || []).join(', ')}
    Experience: ${((profile as any).experience || []).map((e: any) => `${e.title} at ${e.company}`).join('; ')}
    Bio: ${(profile as any).bio || ''}
  `;

  const prompt = `
    Here is a job description:
    ---
    ${jobDescription}
    ---
    Here is a candidate's profile:
    ---
    ${candidateProfile}
    ---
    Please act as an expert ATS (Applicant Tracking System). Analyze the candidate's profile against the job description and provide ONLY a valid JSON object with the following structure:
    {
      "matchScore": <a number from 0 to 100>,
      "matchedKeywords": ["<an array of keywords from the job description that the candidate's profile matches>"],
      "missingKeywords": ["<an array of keywords from the job description that are missing from the candidate's profile>"],
      "summary": "<a brief (2-3 sentence) summary of why the candidate is a good or poor fit for the role>"
    }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = chatCompletion.choices[0]?.message?.content;
    if (!result) throw new Error('Groq API returned no result.');

    return JSON.parse(result) as AtsResult;
  } catch (error) {
    console.error('Groq API request failed:', error);
    throw new Error('Failed to get analysis from AI. Please check the API key and try again.');
  }
}
