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

function MatchScoreCircle({ score }: { score: number }) {
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
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match Score</span>
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
        const jobData = data.job ?? data;
        setJob(jobData);

        // Load match score + check if already applied
        if (currentUser && isCandidate) {
          setMatchLoading(true);
          const [matchRes, appsRes] = await Promise.allSettled([
            api.get(`/api/match/score/${currentUser.id}/${jobId}`),
            api.get(`/api/applications/user/${currentUser.id}`),
          ]);

          if (matchRes.status === 'fulfilled') {
            setMatchData(matchRes.value as MatchData);
          }
          if (appsRes.status === 'fulfilled') {
            const apps = (appsRes.value as Array<{ jobId: number }>);
            const applied = apps.some((a) => Number(a.jobId) === Number(jobId));
            setAlreadyApplied(applied);
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

  const apply = async () => {
    if (!currentUser) {
      setMessage({ text: 'Please log in to apply.', ok: false });
      return;
    }
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

  return (
    <>
      {showAtsModal && <AtsModal onClose={() => setShowAtsModal(false)} />}
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${levelColors[job.experienceLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {job.experienceLevel}
                </span>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-3">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400 mt-2">
                  <div className="flex items-center gap-2"><Briefcase size={16} /> {job.company}</div>
                  {job.location && <div className="flex items-center gap-2"><MapPin size={16} /> {job.location}</div>}
                  {job.salary && <div className="flex items-center gap-2"><DollarSign size={16} /> {job.salary}</div>}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                {/* Match Score Circle */}
                {isCandidate && (
                  matchLoading ? (
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  ) : matchData ? (
                    <MatchScoreCircle score={matchData.matchScore} />
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
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
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
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      <FileText size={16} /> Apply Now
                    </button>
                  ) : null}
                  <button
                    onClick={() => setShowAtsModal(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600 transition"
                  >
                    <ShieldCheck size={16} /> ATS Check
                  </button>
                </div>
              </div>
            </div>

            {/* Hiring Probability */}
            {isCandidate && matchData && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap size={16} className="text-indigo-500" />
                  <span className="text-gray-600 dark:text-gray-300">Hiring Probability:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchData.hiringProbability}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span className="text-gray-600 dark:text-gray-300">Skills matched:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {matchData.matchedSkills.length} / {matchData.matchedSkills.length + matchData.missingSkills.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 flex items-center gap-3 text-sm px-4 py-3 rounded-lg ${message.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* Skill Breakdown — only for candidates with match data */}
          {isCandidate && matchData && (matchData.matchedSkills.length > 0 || matchData.missingSkills.length > 0) && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Brain size={20} /> Your Skills Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchData.matchedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">
                      ✓ You Have ({matchData.matchedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.matchedSkills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm px-3 py-1 rounded-full">
                          <CheckCircle2 size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {matchData.missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mb-2">
                      ✗ Missing ({matchData.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.missingSkills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-3 py-1 rounded-full">
                          <XCircle size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {matchData.missingSkills.length > 0 && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  💡 Go to your <a href="/roadmap" className="text-indigo-600 dark:text-indigo-400 underline">Career Roadmap</a> to build a learning path for the missing skills.
                </p>
              )}
            </div>
          )}

          {/* Job Details */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Job Description</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <p>{job.description}</p>
            </div>

            {job.requiredSkills?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Brain size={18} /> Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.techStack?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Code size={18} /> Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.techStack.map((tech) => (
                    <span key={tech} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1 rounded-full">
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
