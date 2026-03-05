export interface MatchResult {
  score: number;
  matched: string[];
  missing: string[];
  techMatched: string[];
  techMissing: string[];
}

const normalize = (s: string) => s.toLowerCase().trim();

export const calculateMatchScore = (
  candidateSkills: string[],
  requiredSkills: string[],
  techStack: string[]
): MatchResult => {
  const candNorm = candidateSkills.map(normalize);
  const reqNorm = requiredSkills.map(normalize);
  const techNorm = techStack.map(normalize);

  const matched = requiredSkills.filter((s) => candNorm.includes(normalize(s)));
  const missing = requiredSkills.filter((s) => !candNorm.includes(normalize(s)));

  const techMatched = techStack.filter((s) => candNorm.includes(normalize(s)));
  const techMissing = techStack.filter((s) => !candNorm.includes(normalize(s)));

  const skillScore = reqNorm.length > 0 ? (matched.length / reqNorm.length) * 100 : 100;
  const techScore = techNorm.length > 0 ? (techMatched.length / techNorm.length) * 100 : 100;

  // Weighted: 60% skills + 40% tech stack
  const score = Math.round(skillScore * 0.6 + techScore * 0.4);

  return { score, matched, missing, techMatched, techMissing };
};
