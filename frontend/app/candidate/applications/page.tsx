'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

interface Application {
  id: number;
  jobId: number;
  status: string;
  createdAt: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
}

interface MatchData {
  matchScore: number;
  hiringProbability: number;
}

const STATUS_STAGES = [
  'applied',
  'shortlisted',
  'interview_scheduled',
  'interview_done',
  'offer_sent',
  'offer_accepted',
  'hired',
];

function getStatusIndex(status: string) {
  const idx = STATUS_STAGES.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    applied: 'bg-slate-100 text-slate-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interview_scheduled: 'bg-cyan-100 text-cyan-700',
    interview_done: 'bg-indigo-100 text-indigo-700',
    offer_sent: 'bg-purple-100 text-purple-700',
    offer_accepted: 'bg-emerald-100 text-emerald-700',
    offer_rejected: 'bg-rose-100 text-rose-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

function matchScoreColor(score: number) {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Record<number, Job>>({});
  const [matchScores, setMatchScores] = useState<Record<number, MatchData>>({});
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);

  const handleUnauthorized = () => {
    clearAuth();
    toast({ type: 'error', title: 'Session expired', message: 'Please sign in again.' });
    router.push('/login');
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApplications = async () => {
    try {
      const user = getUser();
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'candidate') { router.push('/recruiter/dashboard'); return; }

      const [data, allJobsData] = await Promise.all([
        api.get(`/api/applications/user/${user.id}`),
        api.get('/api/jobs'),
      ]);

      const apps: Application[] = Array.isArray(data) ? data : data.applications ?? [];
      const allJobs: Job[] = allJobsData.jobs ?? allJobsData ?? [];

      const jobMap: Record<number, Job> = {};
      allJobs.forEach((j) => { jobMap[j.id] = j; });

      setApplications(apps);
      setJobs(jobMap);

      // Fetch match scores for each applied job
      if (apps.length > 0) {
        setScoresLoading(true);
        const results = await Promise.allSettled(
          apps.map((app) =>
            api.get(`/api/match/score/${user.id}/${app.jobId}`).then((d) => ({ jobId: app.jobId, data: d }))
          )
        );
        const scores: Record<number, MatchData> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') scores[r.value.jobId] = r.value.data as MatchData;
        });
        setMatchScores(scores);
        setScoresLoading(false);
      }
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) { handleUnauthorized(); return; }
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center text-gray-500">Loading applications...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{applications.length} total applications</p>
          </div>
          <Link href="/jobs" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Browse Jobs
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-20 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No applications yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start applying to jobs to track your progress here.</p>
            <Link href="/jobs" className="inline-block mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const job = jobs[app.jobId];
              const match = matchScores[app.jobId];
              const stageIdx = getStatusIndex(app.status);
              const isTerminal = ['hired', 'rejected', 'offer_rejected', 'offer_accepted'].includes(app.status);

              return (
                <div key={app.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                        >
                          {job?.title ?? `Job #${app.jobId}`}
                        </Link>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${getStatusColor(app.status)}`}>
                          {app.status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job ? `${job.company}${job.location ? ` · ${job.location}` : ''}` : ''}
                        {' · Applied '}
                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Match score */}
                    <div className="text-right shrink-0">
                      {scoresLoading && !match ? (
                        <div className="w-16 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
                      ) : match ? (
                        <div>
                          <div className={`text-2xl font-bold ${matchScoreColor(match.matchScore)}`}>
                            {match.matchScore}%
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">match</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Application pipeline progress bar */}
                  {!isTerminal && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1">
                        {STATUS_STAGES.slice(0, -1).map((stage, i) => (
                          <div key={stage} className="flex-1 flex items-center gap-1">
                            <div className={`h-1.5 w-full rounded-full transition-all ${i <= stageIdx ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-700'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                        <span>Applied</span>
                        <span className="capitalize">{app.status.replaceAll('_', ' ')}</span>
                        <span>Hired</span>
                      </div>
                    </div>
                  )}
                  {isTerminal && (
                    <div className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${getStatusColor(app.status)}`}>
                      {app.status === 'hired' ? '🎉 Congratulations! You got hired.' : `Final status: ${app.status.replaceAll('_', ' ')}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
