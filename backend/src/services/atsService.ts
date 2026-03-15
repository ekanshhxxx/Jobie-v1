import Groq from 'groq-sdk';
import Job from '../models/Job';
import Profile from '../models/Profile';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const JINA_API_KEY = process.env.JINA_API_KEY;

export interface AtsResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  diagnostics?: { label: string; score: number }[];
  telemetryLogs?: string[];
  detailedAnalysis?: string;
  recommendations?: string[];
}

// ─── Stopwords ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  // Articles, pronouns, prepositions, conjunctions
  'a','an','and','are','as','at','be','been','being','but','by','do','for',
  'from','had','has','have','he','her','him','his','how','i','if','in','is',
  'it','its','me','my','not','of','on','or','our','out','she','so','some',
  'than','that','the','their','them','then','there','they','this','to','us',
  'was','we','were','what','when','which','who','will','with','you','your',
  'any','all','both','few','each','every','own','same','too','just','once',
  'here','there','where','why','how','up','down','off','over','under',
  'again','then','once','further','into','during','before','after','above',

  // Org / company filler (only very specific company-name words, NOT generic tech terms)
  'company','private','limited','pvt','ltd','inc','corp','llp',
  'subsidiary','bankers','stgi','summit',

  // Generic business/HR filler verbs (only true filler, not skills)
  'role','position','candidate','team','teams','join','joining','member',
  'opportunity','opportunities','apply','application','submit','welcome',
  'overview','responsibilities','requirement','requirements','qualifications',
  'preferred','required','desired','bonus','must','nice','bring','forward',
  'help','helps','helping','need','needs','want','wants','use','using',
  'work','works','working','ensure','ensures','ensuring',
  'collaborate','collaborates','collaborating','contribute','contributes',
  'participate','participates','provide','provides','providing',
  'deliver','delivers','delivering','define','defines','defining',
  'manage','manages','managing','lead','leads','leading','own','owns',
  'owning','handle','handles','handling','resolve','resolves','resolving',
  'create','creates','creating','produce','communicate','communicates',
  'communicating','coordinate','coordinates',

  // Generic adjectives / adverbs (true filler only)
  'good','great','excellent','strong','solid','broad','wide',
  'modern','latest','new','current','existing','relevant','general',
  'various','multiple','different','diverse','key','main',
  'primary','secondary','additional','other','further',
  'basic','fundamental','critical','important','essential','significant',
  'effective','efficient','flexible','dynamic','innovative','creative','strategic',
  'high','low','large','small','big','best','better','leading',

  // Common filler nouns (only truly generic ones)
  'experience','knowledge','understanding','ability','skill','skills',
  'expertise','proficiency','environment','area','areas',
  'context','scenario','approach',
  'goal','goals','objective','objectives','outcome','result','results',
  'impact','value','standard','standards',
  'concept','concepts',
  'client','clients','customer','customers',
  'stakeholder','stakeholders','partner','partners','vendor','vendors',
  'etc','also','well','across','within','through','throughout','including',
  'such','like','along','per','via','vs','info','information',
  'details','part','parts','aspects','side','end','point','level','levels',
  'can','could','would','should','shall','may','might','let','make',
  'made','take','taken','get','got','set','keep','put','run','ran',
  'open','close','start','stop','look','see','go','come','think','know',

  // Soft skills (too vague)
  'passionate','motivated','learner','attitude','mindset','ownership',
  'accountability','initiative','proactive','adaptable','curious',
  'curiosity','thought','mentorship','mentoring','coaching','diversity',
]);

// ─── Keyword Extractor ────────────────────────────────────────────────────────
function extractKeywords(text: string): string[] {
  // Step 1: Aggressively strip non-alphanumeric EXCEPT # + - / (for C#, .NET via bigrams, CI/CD)
  // We split on whitespace, then clean trailing/leading punctuation from each token
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/^[^a-z0-9#]+|[^a-z0-9#]+$/g, '')) // strip leading/trailing punct
    .filter(t => {
      if (t.length < 3) return false;
      if (STOPWORDS.has(t)) return false;
      if (/^\d+$/.test(t)) return false;   // pure numbers
      if (/^[^a-z0-9]+$/.test(t)) return false; // punct only
      return true;
    });

  // Step 2: Bigrams from the cleaned word list
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i], w2 = words[i + 1];
    if (w1 && w2 && !STOPWORDS.has(w1) && !STOPWORDS.has(w2)) {
      bigrams.push(`${w1} ${w2}`);
    }
  }

  return [...new Set([...words, ...bigrams])];
}

// ─── Keyword Match Score ──────────────────────────────────────────────────────
function computeKeywordScore(jdKeywords: string[], resumeText: string): {
  matched: string[];
  missing: string[];
  score: number;
} {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  // Weight technical-looking tokens more heavily
  const techPattern = /^[a-z]+[0-9#.+]+|python|java|react|node|aws|docker|sql|api|css|html|js|ts|ml|ai|git/;

  for (const kw of jdKeywords) {
    const isPresent = resumeLower.includes(kw);
    if (isPresent) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  // Coverage = matched / total, biased towards technical matches
  const totalWeight = jdKeywords.reduce((sum, kw) => sum + (techPattern.test(kw) ? 2 : 1), 0);
  const matchedWeight = matched.reduce((sum, kw) => sum + (techPattern.test(kw) ? 2 : 1), 0);
  const score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  return { matched, missing, score };
}

// ─── Jina Embedding + Cosine Similarity ──────────────────────────────────────
async function getJinaEmbedding(text: string): Promise<number[]> {
  // Truncate to avoid token limits (Jina handles up to 8192 tokens)
  const truncated = text.slice(0, 6000);
  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: 'text-matching',
      input: [truncated],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jina API error: ${err}`);
  }

  const data = await response.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Education / Experience Scoring ──────────────────────────────────────────
function computeEducationScore(jdText: string, resumeText: string): number {
  const jd = jdText.toLowerCase();
  const resume = resumeText.toLowerCase();

  // Degree requirements in JD
  const requiresDegree = /b\.?tech|b\.?e\b|bachelor|b\.?sc|undergraduate|computer science|engineering degree/i.test(jd);
  const requiresMasters = /m\.?tech|master|m\.?sc|mba|post.?grad/i.test(jd);

  // What candidate has
  const hasBachelors = /b\.?tech|b\.?e\b|bachelor|b\.?sc|undergraduate|pursuing.*degree|studying.*engineering|studying.*computer|engineering student|cse|ece|it undergrad/i.test(resume);
  const hasMasters = /m\.?tech|master|m\.?sc|mba|post.?grad/i.test(resume);

  if (!requiresDegree && !requiresMasters) return 100; // No degree req
  if (requiresMasters && hasMasters) return 100;
  if (requiresMasters && hasBachelors) return 70; // Has Bachelor but not Master
  if (requiresDegree && hasBachelors) return 100; // Enrolled counts as meeting requirement
  if (requiresDegree && !hasBachelors) return 30;

  return 80;
}

function computeExperienceScore(jdText: string, resumeText: string): number {
  const jd = jdText.toLowerCase();
  const resume = resumeText.toLowerCase();

  // Extract required years from JD (e.g. "2+ years", "3 years of experience")
  const jdYearsMatch = jd.match(/(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s+(?:of\s+)?(?:relevant\s+)?experience/i);
  const requiredYears = jdYearsMatch ? parseInt(jdYearsMatch[1]) : 0;

  // Extract candidate experience
  const resumeYearsMatches = resume.matchAll(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/gi);
  const resumeYears = [...resumeYearsMatches].map(m => parseInt(m[1]));
  const maxResumeYears = resumeYears.length > 0 ? Math.max(...resumeYears) : 0;

  // Check for internships/projects as proxy experience for freshers
  const hasInternship = /internship|intern\b|trainee|apprentice/i.test(resume);
  const hasProjects = /project|built|developed|created|implemented/i.test(resume);
  const isFresha = /undergraduate|student|fresher|entry.?level|recent graduate/i.test(resume);

  if (requiredYears === 0) {
    // No specific experience required — reward internships/projects
    if (isFresha && (hasInternship || hasProjects)) return 80;
    return 75;
  }

  if (maxResumeYears >= requiredYears) return 100;
  if (maxResumeYears > 0) {
    return Math.round((maxResumeYears / requiredYears) * 100);
  }

  // No years mentioned but has internships/projects — partial credit
  if (hasInternship) return 55;
  if (hasProjects) return 45;
  return 25;
}

// ─── Groq Qualitative Analysis ────────────────────────────────────────────────
const ANALYSIS_PROMPT = `
You are a senior HR recruiter with 15+ years of experience. You have already been given a pre-computed ATS match score of {matchScore}% for this candidate.

Your job is ONLY to write the qualitative analysis and recommendations — DO NOT change or re-compute the score.

JOB DESCRIPTION:
---
{jobDescription}
---

CANDIDATE RESUME:
---
{candidateProfile}
---

COMPUTED SCORES:
- Overall Match Score: {matchScore}%
- Matched Keywords (present in resume): {matchedKeywords}
- Missing Keywords (absent from resume): {missingKeywords}

Return ONLY a valid JSON object with these fields:
{
  "summary": "<2-3 sentence honest summary of the match, referencing the {matchScore}% score. Be direct about strengths and weaknesses.>",
  "detailedAnalysis": "<4-5 sentence analysis: what makes this candidate strong for the role, what key gaps hurt their score, how competitive they are overall.>",
  "recommendations": [
    "<Specific, actionable step. E.g.: 'Add a dedicated Skills section explicitly listing Python and SQL' or 'Quantify achievements — instead of worked on X, say reduced load time by 40%'.>"
  ],
  "telemetryLogs": [
    "Parsing resume structure...",
    "Extracting keywords from job description...",
    "Computing semantic similarity via embeddings...",
    "Matching technical skills and tools...",
    "Evaluating experience and education alignment...",
    "Generating final hybrid match score..."
  ]
}

IMPORTANT:
- If the candidate mentions being an undergraduate, pursuing B.Tech/B.E., or being a student — they ARE meeting the education requirement. Do NOT say they should "pursue a degree."
- Keep recommendations focused on what the candidate can realistically improve in their resume RIGHT NOW.
`;

async function getGroqAnalysis(
  jobDescription: string,
  candidateProfile: string,
  matchScore: number,
  matchedKeywords: string[],
  missingKeywords: string[]
): Promise<{
  summary: string;
  detailedAnalysis: string;
  recommendations: string[];
  telemetryLogs: string[];
}> {
  const prompt = ANALYSIS_PROMPT
    .replace(/{matchScore}/g, String(matchScore))
    .replace('{jobDescription}', jobDescription)
    .replace('{candidateProfile}', candidateProfile)
    .replace('{matchedKeywords}', matchedKeywords.slice(0, 20).join(', '))
    .replace('{missingKeywords}', missingKeywords.slice(0, 20).join(', '));

  const chat = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: GROQ_MODEL,
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const raw = chat.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned no content.');
  return JSON.parse(raw);
}

// ─── Master Hybrid Scorer ─────────────────────────────────────────────────────
async function getAtsResult(jobDescription: string, candidateProfile: string): Promise<AtsResult> {
  // Step 1: Extract keywords from JD
  const jdKeywords = extractKeywords(jobDescription);

  // Step 2: Keyword match score (deterministic)
  const { matched, missing, score: kwScore } = computeKeywordScore(jdKeywords, candidateProfile);

  // Step 3: Semantic similarity via Jina AI embeddings
  let semanticScore = 0;
  try {
    const [jdEmbedding, resumeEmbedding] = await Promise.all([
      getJinaEmbedding(jobDescription),
      getJinaEmbedding(candidateProfile),
    ]);
    const similarity = cosineSimilarity(jdEmbedding, resumeEmbedding);
    // cosine similarity is 0-1, scale to 0-100
    semanticScore = Math.round(Math.min(similarity * 130, 100)); // scale factor — raw cosine will typically be 0.5-0.8
  } catch (err) {
    console.error('Jina embedding failed, falling back to keyword only:', err);
    semanticScore = kwScore; // Fallback
  }

  // Step 4: Education + Experience scores (rule-based)
  const eduScore = computeEducationScore(jobDescription, candidateProfile);
  const expScore = computeExperienceScore(jobDescription, candidateProfile);

  // Step 5: Weighted final score
  // Semantic: 40%, Keyword: 30%, Experience: 20%, Education: 10%
  const matchScore = Math.round(
    semanticScore * 0.40 +
    kwScore * 0.30 +
    expScore * 0.20 +
    eduScore * 0.10
  );

  // Step 6: Get qualitative analysis from Groq (score is NOT re-computed here)
  const analysis = await getGroqAnalysis(
    jobDescription,
    candidateProfile,
    matchScore,
    matched.slice(0, 20),
    missing.slice(0, 15)
  );

  return {
    matchScore,
    matchedKeywords: matched.slice(0, 25),
    missingKeywords: missing.slice(0, 20),
    summary: analysis.summary,
    detailedAnalysis: analysis.detailedAnalysis,
    recommendations: analysis.recommendations,
    telemetryLogs: analysis.telemetryLogs,
    diagnostics: [
      { label: 'Experience Alignment', score: expScore },
      { label: 'Technical Skills Match', score: kwScore },
      { label: 'Semantic Similarity', score: semanticScore },
    ],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
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

  return getAtsResult(jobDescription, candidateProfile);
}

export async function analyseTextWithAts(jobDescription: string, resumeText: string): Promise<AtsResult> {
  if (!jobDescription || !resumeText) {
    throw new Error('Job Description and Resume Text are required.');
  }
  return getAtsResult(jobDescription, resumeText);
}
