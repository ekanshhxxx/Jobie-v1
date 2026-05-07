'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  RefreshCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import type { Application, CandidateUser, Job, Profile } from './types';

interface MatchResult {
  matchScore: number;
  hiringProbability: number;
  matchedSkills: string[];
  missingSkills: string[];
}

const SAVED_JOBS_PREFIX = 'jobie:saved-jobs';
const TERMINAL_STATUSES = ['rejected', 'hired', 'offer_rejected', 'offer_accepted'];

function timeAgo(value?: string) {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function statusTone(status: string) {
  switch (status) {
    case 'applied':
    case 'shortlisted':
      return 'border-[rgba(79,172,254,0.2)] bg-[rgba(79,172,254,0.12)] text-[var(--blue-2)]';
    case 'interview_scheduled':
    case 'interview_done':
      return 'border-[rgba(34,211,123,0.2)] bg-[rgba(34,211,123,0.12)] text-[var(--green)]';
    case 'offer_sent':
    case 'offer_accepted':
      return 'border-[rgba(155,127,255,0.2)] bg-[rgba(155,127,255,0.12)] text-[var(--violet)]';
    case 'offer_rejected':
    case 'rejected':
      return 'border-[rgba(255,92,92,0.2)] bg-[rgba(255,92,92,0.12)] text-[var(--red)]';
    default:
      return 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[var(--white-dim)]';
  }
}

function compensation(job: Job) {
  if (typeof job.salary === 'string' && job.salary.trim()) {
    const numeric = Number(job.salary);
    return !Number.isNaN(numeric) && numeric > 999 ? `$${Math.round(numeric / 1000)}k` : job.salary;
  }
  if (typeof job.salaryMin === 'number' && typeof job.salaryMax === 'number') {
    return `$${job.salaryMin}k - $${job.salaryMax}k`;
  }
  return 'Compensation shared later';
}

function jobMode(job: Job) {
  return job.type || job.employmentType || job.experienceLevel || 'Full time';
}

function profileScore(profile: Profile | null) {
  if (typeof profile?.profileCompleteness === 'number') {
    return Math.max(0, Math.min(100, Math.round(profile.profileCompleteness)));
  }
  if (!profile) return 22;
  let score = 25;
  if (profile.headline) score += 20;
  if (profile.bio) score += 15;
  if (profile.skills?.length) score += 20;
  if (profile.githubUsername) score += 10;
  if (profile.githubVerifiedSkills?.length) score += 10;
  return Math.min(score, 100);
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,12,24,0.7)] p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[rgba(79,172,254,0.12)] p-3 text-[var(--blue-2)]">{icon}</span>
        <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{label}</span>
      </div>
      <p className="mt-5 font-['Syne'] text-4xl font-bold text-[var(--white)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--white-dim)]">{note}</p>
    </div>
  );
}

function SideLink({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--white-dim)] transition hover:border-[rgba(79,172,254,0.18)] hover:text-[var(--white)]"
    >
      <span>{label}</span>
      <span className="font-mono text-xs text-[var(--blue-2)]">{meta}</span>
    </Link>
  );
}

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchScores, setMatchScores] = useState<Record<number, MatchResult>>({});
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [applyingIds, setApplyingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleUnauthorized = useCallback(() => {
    clearAuth();
    toast({ type: 'error', title: 'Session expired', message: 'Please sign in again.' });
    router.push('/login');
  }, [router, toast]);

  const loadDashboard = useCallback(async (currentUser: CandidateUser, silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get(`/api/applications/user/${currentUser.id}`),
      ]);

      const loadedJobs = (jobsRes.jobs ?? jobsRes) as Job[];
      const loadedApps = (appsRes.applications ?? appsRes) as Application[];
      setJobs(loadedJobs);
      setApplications(
        [...loadedApps].sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
      );

      try {
        const profileRes = await api.get(`/api/profile/${currentUser.id}`);
        setProfile((profileRes.profile ?? profileRes) as Profile);
      } catch (error: unknown) {
        if (isApiError(error) && error.status === 404) {
          setProfile(null);
        } else if (isApiError(error) && error.status === 401) {
          handleUnauthorized();
          return;
        }
      }

      const scoreResults = await Promise.allSettled(
        loadedJobs.map((job) =>
          api.get(`/api/match/score/${currentUser.id}/${job.id}`).then((data) => ({ jobId: job.id, data }))
        )
      );

      const nextScores: Record<number, MatchResult> = {};
      scoreResults.forEach((result) => {
        if (result.status === 'fulfilled') nextScores[result.value.jobId] = result.value.data as MatchResult;
      });
      setMatchScores(nextScores);
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        handleUnauthorized();
        return;
      }
      toast({ type: 'error', title: 'Dashboard unavailable', message: 'We could not load your dashboard.' });
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [handleUnauthorized, toast]);

  useEffect(() => {
    const currentUser = getUser() as CandidateUser | null;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin') {
      router.push('/admin');
      return;
    }
    if (currentUser.role === 'recruiter') {
      router.push('/recruiter/dashboard');
      return;
    }
    setUser(currentUser);
    loadDashboard(currentUser);
  }, [loadDashboard, router]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`${SAVED_JOBS_PREFIX}:${user.id}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedJobIds(Array.isArray(parsed) ? parsed.filter((item): item is number => typeof item === 'number') : []);
    } catch {
      setSavedJobIds([]);
    }
  }, [user]);

  const saveJobs = useCallback((nextIds: number[]) => {
    if (!user) return;
    setSavedJobIds(nextIds);
    localStorage.setItem(`${SAVED_JOBS_PREFIX}:${user.id}`, JSON.stringify(nextIds));
  }, [user]);

  const appliedJobIds = useMemo(() => new Set(applications.map((app) => app.jobId)), [applications]);
  const activeApplications = useMemo(() => applications.filter((app) => !TERMINAL_STATUSES.includes(app.status)), [applications]);
  const interviews = useMemo(() => applications.filter((app) => ['interview_scheduled', 'interview_done'].includes(app.status)).length, [applications]);
  const readiness = useMemo(() => profileScore(profile), [profile]);
  const avgMatch = useMemo(() => {
    const values = Object.values(matchScores).map((item) => item.matchScore);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }, [matchScores]);

  const rankedJobs = useMemo(
    () =>
      [...jobs].sort((left, right) => {
        const scoreGap = (matchScores[right.id]?.matchScore ?? 0) - (matchScores[left.id]?.matchScore ?? 0);
        if (scoreGap !== 0) return scoreGap;
        return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
      }),
    [jobs, matchScores]
  );

  const recommendedJobs = useMemo(() => rankedJobs.slice(0, 4), [rankedJobs]);
  const otherJobs = useMemo(() => rankedJobs.filter((job) => !recommendedJobs.some((item) => item.id === job.id)).slice(0, 4), [rankedJobs, recommendedJobs]);
  const savedJobs = useMemo(() => rankedJobs.filter((job) => savedJobIds.includes(job.id)), [rankedJobs, savedJobIds]);
  const topJob = recommendedJobs[0] ?? null;

  const refreshDashboard = useCallback(async () => {
    if (!user) return;
    await loadDashboard(user, true);
    toast({ type: 'success', title: 'Dashboard refreshed', message: 'Latest roles and pipeline activity are ready.' });
  }, [loadDashboard, toast, user]);

  const toggleSave = useCallback((jobId: number) => {
    const isSaved = savedJobIds.includes(jobId);
    const next = isSaved ? savedJobIds.filter((id) => id !== jobId) : [jobId, ...savedJobIds];
    saveJobs(next);
    toast({
      type: 'success',
      title: isSaved ? 'Removed from saved roles' : 'Saved for later',
      message: isSaved ? 'This role was removed from your shortlist.' : 'You can revisit it from Saved Roles.',
    });
  }, [saveJobs, savedJobIds, toast]);

  const applyToJob = useCallback(async (jobId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (appliedJobIds.has(jobId)) {
      toast({ type: 'info', title: 'Already applied', message: 'This role is already in your pipeline.' });
      router.push('/candidate/applications');
      return;
    }

    setApplyingIds((current) => [...current, jobId]);
    try {
      const response = await api.post('/api/applications/apply', { userId: user.id, jobId });
      const created = (response.application ?? response) as Partial<Application>;
      setApplications((current) => [
        {
          id: typeof created.id === 'number' ? created.id : Date.now(),
          jobId,
          status: typeof created.status === 'string' ? created.status : 'applied',
          createdAt: created.createdAt ?? new Date().toISOString(),
          userId: user.id,
        },
        ...current,
      ]);
      toast({ type: 'success', title: 'Application submitted', message: 'The role has been added to your pipeline.' });
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        handleUnauthorized();
        return;
      }
      toast({
        type: 'error',
        title: 'Could not apply',
        message: error instanceof Error ? error.message : 'Something went wrong while applying.',
      });
    } finally {
      setApplyingIds((current) => current.filter((id) => id !== jobId));
    }
  }, [appliedJobIds, handleUnauthorized, router, toast, user]);

  if (!user || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[rgba(79,172,254,0.16)] border-t-[var(--blue-2)]" />
          <p className="font-['Syne'] text-xl font-bold text-[var(--white)]">Preparing your candidate dashboard</p>
          <p className="text-sm text-[var(--muted)]">Fetching jobs, matches, and application updates.</p>
        </div>
      </div>
    );
  }

  const renderJobCard = (job: Job, feature = false) => {
    const score = matchScores[job.id]?.matchScore ?? 0;
    const saved = savedJobIds.includes(job.id);
    const applied = appliedJobIds.has(job.id);
    const applying = applyingIds.includes(job.id);

    return (
      <article
        key={job.id}
        className={`rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(79,172,254,0.28)] ${
          feature
            ? 'border-[rgba(79,172,254,0.2)] bg-[linear-gradient(145deg,rgba(20,37,78,0.72),rgba(10,18,37,0.9))]'
            : 'border-[rgba(255,255,255,0.08)] bg-[rgba(8,12,24,0.68)]'
        }`}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] font-['Syne'] text-xl font-extrabold text-[var(--white)]">
              {(job.company ?? 'J').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/jobs/${job.id}`} className="font-['Syne'] text-xl font-bold text-[var(--white)] transition hover:text-[var(--blue-2)]">
                  {job.title}
                </Link>
                {feature && (
                  <span className="rounded-full border border-[rgba(79,172,254,0.2)] bg-[rgba(79,172,254,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--blue-2)]">
                    AI Match
                  </span>
                )}
                {saved && (
                  <span className="rounded-full border border-[rgba(245,166,35,0.2)] bg-[rgba(245,166,35,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                    Saved
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--white-dim)]">
                {job.company ?? 'Confidential company'} - {job.location || 'Location flexible'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-[var(--white-dim)]">
                  {compensation(job)}
                </span>
                <span className="rounded-full border border-[rgba(79,172,254,0.14)] bg-[rgba(79,172,254,0.08)] px-3 py-1.5 text-xs text-[var(--blue-2)]">
                  {jobMode(job)}
                </span>
                {matchScores[job.id]?.missingSkills?.[0] && (
                  <span className="rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-[var(--white-dim)]">
                    Gap: {matchScores[job.id]?.missingSkills?.[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex items-center gap-3 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(79,172,254,0.16)] bg-[rgba(79,172,254,0.08)] font-mono text-sm font-semibold text-[var(--blue-2)]">
                {score}%
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Match</p>
                <p className="text-sm text-[var(--white)]">{score >= 75 ? 'Strong fit' : score >= 55 ? 'Worth a look' : 'Emerging fit'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                onClick={() => toggleSave(job.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium text-[var(--white-dim)] transition hover:border-[rgba(245,166,35,0.22)] hover:text-[var(--amber)]"
              >
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? 'Saved' : 'Save role'}
              </button>

              {applied ? (
                <Link
                  href="/candidate/applications"
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,123,0.18)] bg-[rgba(34,211,123,0.12)] px-4 py-2 text-sm font-semibold text-[var(--green)]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  In pipeline
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => applyToJob(job.id)}
                  disabled={applying}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--blue-1),var(--blue-2))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {applying ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {applying ? 'Applying...' : 'Apply now'}
                </button>
              )}

              <Link
                href={`/jobs/${job.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,172,254,0.18)] bg-[rgba(79,172,254,0.08)] px-4 py-2 text-sm font-medium text-[var(--blue-2)]"
              >
                View role
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const insights = [
    topJob ? `${topJob.title} at ${topJob.company ?? 'this company'} is your strongest match right now.` : '',
    topJob && matchScores[topJob.id]?.missingSkills?.[0]
      ? `Closing the gap on ${matchScores[topJob.id]?.missingSkills?.[0]} should improve your top recommendation fast.`
      : '',
    interviews > 0 ? `You have ${interviews} interview-stage application${interviews === 1 ? '' : 's'} in motion.` : '',
    !profile ? 'Your profile is still missing detail. Add skills or parse your resume to unlock stronger matches.' : '',
    savedJobs.length > 0 ? `You already have ${savedJobs.length} saved role${savedJobs.length === 1 ? '' : 's'} to revisit.` : '',
  ].filter((message): message is string => Boolean(message));

  return (
    <div className="c-content-body candidate-dashboard-page">
      <div className="c-left-scroll">
        <section className="relative overflow-hidden rounded-[32px] border border-[rgba(79,172,254,0.16)] bg-[linear-gradient(135deg,rgba(16,28,64,0.96),rgba(10,18,35,0.92))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,242,254,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(79,172,254,0.16),transparent_34%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-2)]">Candidate Dashboard</p>
              <h1 className="mt-3 font-['Syne'] text-4xl font-extrabold tracking-[-0.04em] text-[var(--white)] sm:text-5xl">
                Your search is moving with direction.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--white-dim)]">
                We reviewed {jobs.length} open role{jobs.length === 1 ? '' : 's'} against your profile and surfaced the strongest next steps for {user.name.split(' ')[0]}.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/resume" className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--blue-1),var(--blue-2))] px-5 py-3 text-sm font-semibold text-white">
                  <FileSearch className="h-4 w-4" />
                  Resume Scanner
                </Link>
                <Link href="/profile/edit" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-medium text-[var(--white)]">
                  <Target className="h-4 w-4" />
                  Edit Profile
                </Link>
                <Link href="/candidate/applications" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-medium text-[var(--white)]">
                  <CalendarClock className="h-4 w-4" />
                  View Pipeline
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
              <div className="rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.05)] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Best fit</p>
                <p className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">{topJob ? `${matchScores[topJob.id]?.matchScore ?? 0}%` : '0%'}</p>
                <p className="mt-1 text-sm text-[var(--white-dim)]">{topJob?.title ?? 'Add more profile detail'}</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.05)] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Active apps</p>
                <p className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">{activeApplications.length}</p>
                <p className="mt-1 text-sm text-[var(--white-dim)]">{interviews} interview stage</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.05)] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Saved roles</p>
                <p className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">{savedJobs.length}</p>
                <p className="mt-1 text-sm text-[var(--white-dim)]">Shortlist for follow-up</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard icon={<BrainCircuit className="h-5 w-5" />} label="Average" value={`${avgMatch}%`} note="Average match rate across the visible job set." />
          <MetricCard icon={<BriefcaseBusiness className="h-5 w-5" />} label="Profile" value={`${readiness}%`} note="Profile readiness based on your current candidate data." />
          <MetricCard icon={<Sparkles className="h-5 w-5" />} label="Verified" value={`${profile?.githubVerifiedSkills?.length ?? 0}`} note="GitHub-verified skills improving signal quality." />
          <MetricCard icon={<Target className="h-5 w-5" />} label="Skills" value={`${profile?.skills?.length ?? 0}`} note="Core skills currently attached to your profile." />
        </section>

        <section id="matches" className="rounded-[32px] border border-[rgba(79,172,254,0.16)] bg-[rgba(7,11,22,0.74)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-2)]">AI matches</p>
              <h2 className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">Recommended for you</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--white-dim)]">
                Roles ranked highest against your skills, experience, and profile quality.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium text-[var(--white)] disabled:opacity-70"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh data'}
              </button>
              <Link href="/jobs" className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,172,254,0.18)] bg-[rgba(79,172,254,0.08)] px-4 py-2 text-sm font-medium text-[var(--blue-2)]">
                See all jobs
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {recommendedJobs.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
                <p className="font-['Syne'] text-2xl font-bold text-[var(--white)]">No recommended roles yet</p>
                <p className="mt-2 text-sm text-[var(--white-dim)]">Add more profile detail or return later after new jobs are posted.</p>
              </div>
            ) : (
              recommendedJobs.map((job) => renderJobCard(job, true))
            )}
          </div>
        </section>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,11,22,0.74)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-2)]">Opportunity feed</p>
            <h2 className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">Fresh openings</h2>
            <div className="mt-6 space-y-4">
              {(otherJobs.length ? otherJobs : rankedJobs.slice(0, 4)).map((job) => renderJobCard(job))}
            </div>
          </section>

          <section id="saved-roles" className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,11,22,0.74)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--amber)]">Saved roles</p>
                <h2 className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">Shortlist</h2>
              </div>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--white-dim)]">
                {savedJobs.length} saved
              </span>
            </div>

            {savedJobs.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
                <p className="font-['Syne'] text-2xl font-bold text-[var(--white)]">Build your shortlist</p>
                <p className="mt-2 text-sm text-[var(--white-dim)]">Save interesting roles from the dashboard so you can compare them later.</p>
                <Link href="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--blue-1),var(--blue-2))] px-4 py-2 text-sm font-semibold text-white">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {savedJobs.map((job) => (
                  <div key={job.id} className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={`/jobs/${job.id}`} className="font-['Syne'] text-xl font-bold text-[var(--white)] transition hover:text-[var(--blue-2)]">
                          {job.title}
                        </Link>
                        <p className="mt-1 text-sm text-[var(--white-dim)]">{job.company ?? 'Confidential company'} - {job.location || 'Location flexible'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[var(--white-dim)]">{compensation(job)}</span>
                          <span className="rounded-full border border-[rgba(79,172,254,0.15)] bg-[rgba(79,172,254,0.08)] px-3 py-1 text-xs text-[var(--blue-2)]">{matchScores[job.id]?.matchScore ?? 0}% match</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" onClick={() => toggleSave(job.id)} className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium text-[var(--white-dim)]">
                          <BookmarkCheck className="h-4 w-4" />
                          Remove
                        </button>
                        {appliedJobIds.has(job.id) ? (
                          <Link href="/candidate/applications" className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,123,0.18)] bg-[rgba(34,211,123,0.12)] px-4 py-2 text-sm font-semibold text-[var(--green)]">
                            <CheckCircle2 className="h-4 w-4" />
                            In pipeline
                          </Link>
                        ) : (
                          <button type="button" onClick={() => applyToJob(job.id)} disabled={applyingIds.includes(job.id)} className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--blue-1),var(--blue-2))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
                            {applyingIds.includes(job.id) ? 'Applying...' : 'Apply'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section id="pipeline" className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,11,22,0.74)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--green)]">Pipeline</p>
              <h2 className="mt-2 font-['Syne'] text-3xl font-bold text-[var(--white)]">Active applications</h2>
            </div>
            <Link href="/candidate/applications" className="text-sm font-medium text-[var(--blue-2)]">Open full pipeline</Link>
          </div>

          {applications.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
              <p className="font-['Syne'] text-2xl font-bold text-[var(--white)]">No applications yet</p>
              <p className="mt-2 text-sm text-[var(--white-dim)]">Start applying to roles from the recommendations above and your pipeline will appear here.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {applications.slice(0, 6).map((application) => {
                const job = jobs.find((item) => item.id === application.jobId);
                const active = !TERMINAL_STATUSES.includes(application.status);
                return (
                  <Link key={application.id} href={`/jobs/${application.jobId}`} className="flex flex-col gap-4 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[rgba(79,172,254,0.18)] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-['Syne'] text-xl font-bold text-[var(--white)]">{job?.title ?? `Job #${application.jobId}`}</p>
                      <p className="text-sm text-[var(--white-dim)]">{job?.company ?? 'Confidential company'} - Applied {timeAgo(application.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(application.status)}`}>{statusLabel(application.status)}</span>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? 'bg-[rgba(34,211,123,0.12)] text-[var(--green)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--white-dim)]'}`}>{active ? 'Active' : 'Closed'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="c-right-panel hidden xl:flex">
        <section className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,12,24,0.74)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-2)]">Profile health</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-['Syne'] text-3xl font-bold text-[var(--white)]">{readiness}% ready</p>
              <p className="mt-2 text-sm leading-6 text-[var(--white-dim)]">Improve profile detail to increase match quality and recruiter confidence.</p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(79,172,254,0.18)] bg-[rgba(79,172,254,0.08)] font-mono text-sm font-semibold text-[var(--blue-2)]">
              {readiness}%
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <SideLink href="/profile/edit" label="Add or refine skills" meta="+20" />
            <SideLink href="/resume" label="Run resume scanner" meta="+35" />
            <SideLink href={`/profile/${user.id}`} label="Preview public profile" meta="View" />
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(79,172,254,0.16)] bg-[linear-gradient(145deg,rgba(15,29,69,0.72),rgba(9,16,33,0.84))] p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[rgba(79,172,254,0.14)] p-2.5 text-[var(--blue-2)]">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="font-['Syne'] text-lg font-bold text-[var(--white)]">Jobie AI Insights</p>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live guidance</p>
              </div>
            </div>
            <span className="rounded-full border border-[rgba(79,172,254,0.18)] bg-[rgba(79,172,254,0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--blue-2)]">Live</span>
          </div>
          <div className="mt-5 space-y-3">
            {(insights.length ? insights : ['Update your profile and interact with more jobs to unlock richer guidance here.']).map((message) => (
              <div key={message} className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[var(--white-dim)]">
                {message}
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
