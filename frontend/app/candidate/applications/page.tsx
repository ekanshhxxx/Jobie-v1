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
  offerDetails?: {
    salary?: string;
    startDate?: string;
    message?: string;
  } | null;
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
  const [respondingId, setRespondingId] = useState<number | null>(null);

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

  // ── Respond to offer (Accept / Decline) ──────────────────────────────────────
  const respondToOffer = async (appId: number, decision: 'offer_accepted' | 'offer_rejected') => {
    setRespondingId(appId);
    try {
      await api.put(`/api/applications/${appId}/status`, { status: decision });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: decision } : a))
      );
      toast({
        type: decision === 'offer_accepted' ? 'success' : 'info',
        title: decision === 'offer_accepted' ? '🎉 Offer Accepted!' : 'Offer Declined',
        message: decision === 'offer_accepted'
          ? 'Congratulations! You have accepted the offer.'
          : 'You have declined the offer. Keep going!',
      });
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) { handleUnauthorized(); return; }
      toast({ type: 'error', title: 'Failed', message: 'Could not process your response. Try again.' });
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-transparent flex items-center justify-center text-[var(--muted)]">Loading applications...</div>;
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--white)]">My Applications</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{applications.length} total applications</p>
          </div>
          <Link href="/jobs" className="c-btn-primary">
            Browse Jobs
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="c-job-card p-20 text-center flex flex-col items-center justify-center">
            <p className="text-[var(--white)] text-lg">No applications yet</p>
            <p className="text-[var(--muted)] text-sm mt-2">Start applying to jobs to track your progress here.</p>
            <Link href="/jobs" className="c-btn-primary mt-6">
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
              const isOfferPending = app.status === 'offer_sent';

              return (
                <div key={app.id} className={`c-job-card !block p-6 ${isOfferPending ? 'ring-2 ring-[var(--green)]' : ''}`}>
                  {/* ── Offer Received Banner ─────────────────────────────────── */}
                  {isOfferPending && (
                    <div className="mb-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎉</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg">You've received a job offer!</p>
                          <p className="text-emerald-100 text-sm mt-0.5">
                            {job?.company ?? 'The company'} has extended an offer for <strong>{job?.title ?? 'this role'}</strong>.
                          </p>

                          {/* Offer details */}
                          {app.offerDetails && (app.offerDetails.salary || app.offerDetails.startDate || app.offerDetails.message) && (
                            <div className="mt-3 bg-white/15 rounded-lg p-3 space-y-1.5 text-sm">
                              {app.offerDetails.salary && (
                                <div className="flex justify-between">
                                  <span className="text-emerald-100">Offered Salary</span>
                                  <span className="font-semibold">{app.offerDetails.salary}</span>
                                </div>
                              )}
                              {app.offerDetails.startDate && (
                                <div className="flex justify-between">
                                  <span className="text-emerald-100">Start Date</span>
                                  <span className="font-semibold">{new Date(app.offerDetails.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              )}
                              {app.offerDetails.message && (
                                <p className="text-emerald-100 italic mt-2 border-t border-white/20 pt-2">&ldquo;{app.offerDetails.message}&rdquo;</p>
                              )}
                            </div>
                          )}

                          {/* Accept / Decline buttons */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => void respondToOffer(app.id, 'offer_accepted')}
                              disabled={respondingId === app.id}
                              className="flex items-center gap-1.5 rounded-lg bg-white text-emerald-700 font-semibold px-5 py-2 text-sm hover:bg-emerald-50 disabled:opacity-60 transition"
                            >
                              ✓ Accept Offer
                            </button>
                            <button
                              onClick={() => void respondToOffer(app.id, 'offer_rejected')}
                              disabled={respondingId === app.id}
                              className="flex items-center gap-1.5 rounded-lg border border-white/40 text-white font-medium px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60 transition"
                            >
                              ✗ Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="font-semibold text-[var(--white)] hover:text-[var(--blue-2)] transition-colors truncate"
                        >
                          {job?.title ?? `Job #${app.jobId}`}
                        </Link>
                        <span className="c-badge ai">
                          {app.status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
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
                          <div className="text-xs text-[var(--muted)]">match</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Application pipeline progress bar */}
                  {!isOfferPending && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1">
                        {STATUS_STAGES.slice(0, -1).map((stage, i) => (
                          <div key={stage} className="flex-1 flex items-center gap-1">
                            <div className={`h-1.5 w-full rounded-full transition-all ${isTerminal ? 'bg-indigo-500' : i <= stageIdx ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-700'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1 px-0.5">
                        <span>Applied</span>
                        <span className="capitalize">{app.status.replaceAll('_', ' ')}</span>
                        <span>Hired</span>
                      </div>
                    </div>
                  )}

                  {isTerminal && (
                    <div className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-lg inline-block text-[var(--muted)] bg-[var(--glass-20)]`}>
                      {app.status === 'hired'
                        ? '🎉 Congratulations! You got hired.'
                        : app.status === 'offer_accepted'
                        ? '✅ You accepted the offer — onboarding details coming soon!'
                        : app.status === 'offer_rejected'
                        ? 'You declined this offer. Best of luck with other applications!'
                        : `Final status: ${app.status.replaceAll('_', ' ')}`}
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
