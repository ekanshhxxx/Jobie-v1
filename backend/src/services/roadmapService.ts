import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface RoadmapPhase {
  week: string;
  title: string;
  focus: string;
  skills: string[];
  tasks: string[];
  resources: { title: string; url: string; type: 'video' | 'article' | 'course' | 'docs' | 'practice' }[];
}

export interface WowProject {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  githubUrl?: string;
  stars?: number;
  techStack: string[];
}

export interface GeneratedRoadmap {
  jobRole: string;
  title: string;
  summary: string;
  estimatedWeeks: number;
  phases: RoadmapPhase[];
  projects: WowProject[];
}

// ─── Step 1: Detect job role from JD using Groq ─────────────────────────────
export async function detectJobRole(jobDescription: string): Promise<string> {
  const snippet = jobDescription.slice(0, 500);
  const prompt = `
You are a technical job classification system. Read the following job description snippet and map it to the RESTRICTED LIST of canonical developer/tech roles below.

RESTRICTED ROLES:
["frontend developer", "backend developer", "full stack developer", "qa engineer", "devops engineer", "data scientist", "ml engineer", "android developer", "ios developer", "cloud architect", "data engineer", "product manager", "typescript developer", "react developer", "node.js developer"]

- You MUST pick exactly ONE role from the list above that best fits the JD.
- If the JD is completely unrelated to tech (e.g., Nurse, Sales, HR, "Health Technology Professional"), gracefully default to "full stack developer".
- NEVER output a role that is NOT in the restricted list.

Return ONLY a JSON object: { "role": "<chosen_role>" }

Job snippet: "${snippet}"
`;
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });
    const data = JSON.parse(response.choices[0]?.message?.content || '{}');
    const role = (data.role || 'full stack developer').toLowerCase();
    
    // Validate role against a basic tech list
    const validTechRoles = ['frontend developer', 'backend developer', 'full stack developer', 'qa engineer', 'devops engineer', 'data scientist', 'ml engineer', 'android developer', 'ios developer', 'cloud architect', 'data engineer', 'product manager', 'typescript developer', 'react developer', 'node.js developer'];
    if (!validTechRoles.includes(role)) {
      return 'full stack developer';
    }
    return role;
  } catch {
    return 'full stack developer';
  }
}

// ─── Step 2: Fetch wow projects from GitHub Search API ───────────────────────
async function fetchGitHubProjects(role: string): Promise<WowProject[]> {
  const roleQueryMap: Record<string, string> = {
    'qa engineer': 'playwright+testing+framework',
    'backend developer': 'api+backend+nodejs+typescript',
    'frontend developer': 'react+dashboard+typescript',
    'full stack developer': 'fullstack+nextjs+typescript',
    'devops engineer': 'kubernetes+devops+automation',
    'data scientist': 'machine-learning+python+data-analysis',
    'ml engineer': 'deep-learning+pytorch+mlops',
    'android developer': 'android+kotlin+architecture',
    'data engineer': 'data-pipeline+etl+python',
    'cloud architect': 'aws+terraform+infrastructure',
    'react developer': 'react+hooks+typescript',
    'node.js developer': 'nodejs+express+rest-api',
  };

  const query = roleQueryMap[role] || `${role.replace(/ /g, '+')}+project+topic:portfolio`;
  // Add filters for quality: only return repos with > 50 stars and explicitly filter out random config files
  const searchUrl = `https://api.github.com/search/repositories?q=${query}+stars:>50+-config+-dotfiles&sort=stars&order=desc&per_page=10`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });
    if (!res.ok) return [];
    const data = await res.json() as { items: { name: string; description: string; html_url: string; stargazers_count: number; topics: string[] }[] };

    // Filter out "projects" that don't have descriptions, as they are usually pure spam/configs
    const validRepos = (data.items || []).filter(repo => repo.description && repo.description.length > 20);

    return validRepos.slice(0, 4).map((repo, i) => ({
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: repo.description || 'Real-world open-source project for hands-on learning.',
      difficulty: i === 0 ? 'beginner' : i <= 2 ? 'intermediate' : 'advanced' as 'beginner' | 'intermediate' | 'advanced',
      githubUrl: repo.html_url,
      stars: repo.stargazers_count,
      techStack: (repo.topics || []).slice(0, 5),
    }));
  } catch {
    return [];
  }
}

// ─── Step 3: Generate Skill-Centric Roadmap via Groq ─────────────────────────
async function generateRoadmapWithGroq(
  jobRole: string,
  missingSkills: string[],
  matchScore: number
): Promise<Omit<GeneratedRoadmap, 'projects'>> {
  
  const skillFocusNote = missingSkills.length > 0 
    ? `The user's resume is specifically missing these exact skills from the job description: [${missingSkills.join(', ')}]. \nYOUR ENTIRE ROADMAP MUST BE BUILT AROUND TEACHING THESE SPECIFIC SKILLS. Each phase should tackle one or a few of these missing skills.`
    : `The user lacks general skills for a ${jobRole}. Build a core skills roadmap.`;

  const prompt = `
You are a senior tech mentor. A candidate wants to apply for a "${jobRole}" role, but they only scored ${matchScore}% on an ATS check. 

${skillFocusNote}

Create a CUSTOM, highly practical, SKILL-CENTRIC learning curriculum. 
Do NOT create a generic "how to be a developer" roadmap. Create a "How to learn exactly what you are missing" roadmap.
Use simple, direct, encouraging English. No corporate jargon.

Return ONLY valid JSON:
{
  "jobRole": "${jobRole}",
  "title": "Your Custom Skill Gap Curriculum",
  "summary": "<2-3 sentence encouraging summary in plain English. e.g. 'You're missing a few key technologies that this job requires. Here is a step-by-step plan to learn them so your resume isn't ignored next time.'>",
  "estimatedWeeks": <4-8>,
  "phases": [
    {
      "week": "Week 1",
      "title": "Mastering <Missing Skill Name>",
      "focus": "<plain English explanation of what they will achieve in this phase>",
      "skills": ["<skill1>", "<skill2>"],
      "tasks": [
        "Read the official docs for <skill>",
        "Build a tiny script doing <x>"
      ],
      "resources": [
        {
          "title": "<resource name>",
          "url": "<REAL working URL — use MDN, freeCodeCamp, official docs, YouTube>",
          "type": "video|article|course|docs|practice"
        }
      ]
    }
  ]
}

RULES:
- Focus heavily on the exact missing skills provided.
- Write tasks in plain, actionable English (e.g., "Set up a Postgres local database", not "Synergize data storage layer").
- Keep the roadmap tight and focused (4 to 6 phases max).
- Include 3-4 tasks and 2-3 resources per phase.
- ALL resource URLs must be REAL (guess standard high-quality domains like freecodecamp.org, developer.mozilla.org, react.dev, docker.com).
`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: GROQ_MODEL,
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned no roadmap content');
  return JSON.parse(raw);
}

// ─── Step 4: Replace hallucinated videos with real YouTube links ────────────
async function enrichWithYouTube(roadmap: Omit<GeneratedRoadmap, 'projects'>): Promise<void> {
  if (!YOUTUBE_API_KEY) return;

  const promises: Promise<void>[] = [];

  for (const phase of roadmap.phases) {
    for (const res of phase.resources) {
      if (res.type === 'video') {
        const query = encodeURIComponent(`${roadmap.jobRole} ${phase.title} ${res.title} tutorial`);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&type=video&key=${YOUTUBE_API_KEY}`;
        
        promises.push(
          fetch(url)
            .then(r => r.json())
            .then((data: any) => {
              if (data.items && data.items.length > 0) {
                res.url = `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
                res.title = data.items[0].snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").slice(0, 50) + (data.items[0].snippet.title.length > 50 ? '...' : '');
              }
            })
            .catch(() => {})
        );
      }
    }
  }

  await Promise.allSettled(promises);
}

// ─── Master: Generate Full Roadmap ──────────────────────────────────────────
export async function generateRoadmap(
  jobDescription: string,
  missingSkills: string[],
  matchScore: number
): Promise<GeneratedRoadmap> {
  // Parallel: detect role + fetch GitHub projects
  const [jobRole] = await Promise.all([
    detectJobRole(jobDescription),
  ]);

  // Now parallel: GitHub projects using the detected role
  const githubProjects = await fetchGitHubProjects(jobRole);

  // Generate main skill-centric roadmap
  const roadmapBase = await generateRoadmapWithGroq(jobRole, missingSkills, matchScore);

  // Post-process: Swap hallucinated video URLs with REAL YouTube searches
  await enrichWithYouTube(roadmapBase);

  // Curated fallback projects if GitHub returned nothing
  const fallbackProjects: WowProject[] = [
    {
      title: 'Real-Time Collaboration Board',
      description: 'WebSocket-powered collaborative whiteboard with presence indicators and live cursors.',
      difficulty: 'intermediate',
      techStack: ['WebSockets', 'Canvas API', 'Node.js', 'React'],
    },
    {
      title: 'Distributed Job Queue System',
      description: 'Redis-backed task queue with retry logic, dead-letter queues, and a monitoring dashboard.',
      difficulty: 'advanced',
      techStack: ['Redis', 'Node.js', 'PostgreSQL', 'TypeScript'],
    },
  ];

  return {
    ...roadmapBase,
    projects: githubProjects.length >= 2 ? githubProjects : fallbackProjects,
  };
}
