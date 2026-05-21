'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import {
  Briefcase, MapPin, DollarSign, Brain, Code, ShieldCheck,
  FileText, Loader, CheckCircle2, XCircle, TrendingUp, Zap,
} from 'lucide-react';
import AtsModal from '../../components/AtsModal';

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string[];
  techStack: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
};

type MatchData = {
  matchScore: number;
  hiringProbability: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedTech: string[];
  missingTech: string[];
};

const levelColors: { [key: string]: string } = {
  junior: 'bg-emerald-100 text-emerald-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
};

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function MatchScoreCircle({ score, isAts }: { score: number; isAts: boolean }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}%</span>
        </div>
      </div>
      {isAts ? (
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300 bg-violet-500/15 border border-violet-400/25 rounded-full px-2 py-0.5">
          AI Score
        </span>
      ) : (
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Match Score</span>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showAtsModal, setShowAtsModal] = useState(false);

  const jobId = params.jobId as string;
  const currentUser = getUser();
  const isCandidate = currentUser?.role === 'candidate';

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/jobs/${jobId}`);
        const rawJob = data.job ?? data;
        const jobData = {
          ...rawJob,
          requiredSkills: normalizeList(rawJob.requiredSkills),
          techStack: normalizeList(rawJob.techStack),
        };
        setJob(jobData);

        // Load match score + ATS AI score + check if already applied — all in parallel
        if (currentUser && isCandidate) {
          setMatchLoading(true);
          const [matchRes, appsRes, atsRes] = await Promise.allSettled([
            api.get(`/api/match/score/${currentUser.id}/${jobId}`),
            api.get(`/api/applications/user/${currentUser.id}`),
            api.get(`/api/ats/latest/${jobId}/${currentUser.id}`),
          ]);

          if (matchRes.status === 'fulfilled') {
            setMatchData(matchRes.value as MatchData);
          }
          if (appsRes.status === 'fulfilled') {
            const appsPayload = appsRes.value as { applications?: Array<{ jobId: number }> } | Array<{ jobId: number }>;
            const apps = Array.isArray(appsPayload) ? appsPayload : appsPayload.applications ?? [];
            setAlreadyApplied(apps.some((a) => Number(a.jobId) === Number(jobId)));
          }
          if (atsRes.status === 'fulfilled') {
            const atsData = atsRes.value as any;
            if (atsData?.check?.matchScore != null) {
              setAtsScore(atsData.check.matchScore);
            }
          }
          setMatchLoading(false);
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Failed to load job details.', ok: false });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // After ATS modal closes with a result, refresh the ats score
  const handleAtsClose = () => {
    setShowAtsModal(false);
    if (currentUser && isCandidate) {
      api.get(`/api/ats/latest/${jobId}/${currentUser.id}`)
        .then((d: any) => {
          if (d?.check?.matchScore != null) setAtsScore(d.check.matchScore);
        })
        .catch(() => {});
    }
  };

  const apply = async () => {
    if (!currentUser) { setMessage({ text: 'Please log in to apply.', ok: false }); return; }
    if (alreadyApplied) return;
    setApplying(true);
    setMessage(null);
    try {
      await api.post('/api/applications/apply', { jobId: job?.id, userId: currentUser.id });
      setAlreadyApplied(true);
      setMessage({ text: '🎉 Application submitted successfully!', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to apply', ok: false });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-20 text-gray-500">Job not found.</div>;
  }

  // Prefer ATS AI score; fall back to keyword match
  const displayScore = atsScore ?? matchData?.matchScore ?? null;
  const isAtsScore = atsScore !== null;

  return (
    <>
      {showAtsModal && (
        <AtsModal
          onClose={handleAtsClose}
          jobId={job.id}
          jobTitle={job.title}
          jobDescription={job.description}
        />
      )}
      <div className="min-h-screen bg-[#0b0f1a] text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

          {/* Header Card */}
          <div className="mb-6 rounded-3xl border border-white/10 bg-[#111a2b]/90 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${levelColors[job.experienceLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {job.experienceLevel}
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{job.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2"><Briefcase size={16} /> {job.company}</div>
                  {job.location && <div className="flex items-center gap-2"><MapPin size={16} /> {job.location}</div>}
                  {job.salary && <div className="flex items-center gap-2"><DollarSign size={16} /> {job.salary}</div>}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                {/* Match Score Circle — shows ATS AI score if available, else keyword match */}
                {isCandidate && (
                  matchLoading ? (
                    <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse" />
                  ) : displayScore !== null ? (
                    <MatchScoreCircle score={displayScore} isAts={isAtsScore} />
                  ) : null
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-40">
                  {isCandidate ? (
                    <button
                      onClick={apply}
                      disabled={applying || alreadyApplied}
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold transition ${
                        alreadyApplied
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 cursor-default'
                          : 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50'
                      }`}
                    >
                      {applying ? (
                        <><Loader size={16} className="animate-spin" /> Applying...</>
                      ) : alreadyApplied ? (
                        <><CheckCircle2 size={16} /> Applied ✓</>
                      ) : (
                        <><FileText size={16} /> Apply Now</>
                      )}
                    </button>
                  ) : !currentUser ? (
                    <button
                      onClick={apply}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                    >
                      <FileText size={16} /> Apply Now
                    </button>
                  ) : null}
                  <button
                    onClick={() => setShowAtsModal(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/15 transition border border-white/10"
                  >
                    <ShieldCheck size={16} /> ATS Check
                  </button>
                </div>
              </div>
            </div>

            {/* Hiring Probability */}
            {isCandidate && matchData && (
              <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Zap size={16} className="text-indigo-500" />
                  <span className="text-slate-300">Hiring Probability:</span>
                  <span className="font-bold text-violet-300">{matchData.hiringProbability}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span className="text-slate-300">Skills matched:</span>
                  <span className="font-bold text-emerald-300">
                    {matchData.matchedSkills.length} / {matchData.matchedSkills.length + matchData.missingSkills.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${message.ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20' : 'bg-red-500/15 text-red-300 border border-red-400/20'}`}>
              {message.text}
            </div>
          )}

          {/* Skill Breakdown */}
          {isCandidate && matchData && (matchData.matchedSkills.length > 0 || matchData.missingSkills.length > 0) && (
            <div className="mb-6 rounded-3xl border border-white/10 bg-[#111a2b]/90 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Brain size={20} /> Your Skills Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchData.matchedSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      ✓ You Have ({matchData.matchedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.matchedSkills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                          <CheckCircle2 size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {matchData.missingSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
                      ✗ Missing ({matchData.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.missingSkills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm text-red-300">
                          <XCircle size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {matchData.missingSkills.length > 0 && (
                <p className="mt-4 text-xs text-slate-400">
                  💡 Go to your <a href="/roadmap" className="text-indigo-400 underline">Career Roadmap</a> to build a learning path for the missing skills.
                </p>
              )}
            </div>
          )}

          {/* Job Details */}
          <div className="rounded-3xl border border-white/10 bg-[#111a2b]/90 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] sm:p-8">
            <h2 className="mb-4 text-xl font-semibold text-white">Job Description</h2>
            <div className="max-w-none text-sm leading-7 text-slate-300">
              <p className="whitespace-pre-line">{job.description}</p>
            </div>

            {job.requiredSkills?.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                  <Brain size={18} /> Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.techStack?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                  <Code size={18} /> Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.techStack.map((tech) => (
                    <span key={tech} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
