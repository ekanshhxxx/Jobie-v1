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
  TrendingUp,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { GlassStats } from '../../../components/GlassStats';
import { GlassBadge } from '../../../components/GlassBadge';
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

function compensation(job: Job) {
  if (typeof job.salary === 'string' && job.salary.trim()) {
    const numeric = Number(job.salary);
    return !Number.isNaN(numeric) && numeric > 999 ? `$${Math.round(numeric / 1000)}k` : job.salary;
  }
  if (typeof job.salaryMin === 'number' && typeof job.salaryMax === 'number') {
    return `$${job.salaryMin}k - $${job.salaryMax}k`;
  }
  return 'Competitive';
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
          userId: user.id,
          createdAt: created.createdAt ?? new Date().toISOString(),
          updatedAt: created.updatedAt ?? new Date().toISOString(),
        },
        ...current,
      ]);
      toast({ type: 'success', title: 'Application submitted', message: 'You're now in the pipeline!' });
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        handleUnauthorized();
        return;
      }
      toast({ type: 'error', title: 'Application failed', message: 'Please try again later.' });
    } finally {
      setApplyingIds((current) => current.filter((id) => id !== jobId));
    }
  }, [appliedJobIds, handleUnauthorized, router, toast, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.name ? user.name.split(' ')[0] : 'there';
  const verifiedSkills = profile?.githubVerifiedSkills?.length ?? 0;
  const totalSkills = profile?.skills?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Gradient Mesh Background */}
      <div className="gradient-mesh" />

      {/* Main Container */}
      <div className="relative max-w-[1800px] mx-auto px-4 md:px-6 py-6">
        
        {/* Hero Section */}
        <GlassCard className="p-6 md:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Hi, {userName}
              </h1>
              <p className="text-slate-300 text-lg mb-4">
                We reviewed <span className="text-blue-400 font-semibold">{jobs.length} open roles</span> against your profile and surfaced the strongest next steps for you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/candidate/resume">
                  <GlassButton variant="secondary" size="sm" icon={<FileSearch className="w-4 h-4" />}>
                    Resume Scanner
                  </GlassButton>
                </Link>
                <Link href="/profile">
                  <GlassButton variant="secondary" size="sm" icon={<Target className="w-4 h-4" />}>
                    Edit Profile
                  </GlassButton>
                </Link>
                <Link href="/candidate/applications">
                  <GlassButton variant="secondary" size="sm" icon={<CalendarClock className="w-4 h-4" />}>
                    View Pipeline
                  </GlassButton>
                </Link>
              </div>
            </div>
            
            {/* Mini Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:w-80">
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {topJob ? `${matchScores[topJob.id]?.matchScore ?? 0}%` : '—'}
                </div>
                <div className="text-xs text-slate-400 uppercase mt-1">Best Fit</div>
                {topJob && (
                  <div className="text-sm text-slate-300 mt-1 truncate">{topJob.title}</div>
                )}
              </GlassCard>
              
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {activeApplications.length}
                </div>
                <div className="text-xs text-slate-400 uppercase mt-1">Active</div>
                <div className="text-sm text-slate-300 mt-1">{interviews} interviews</div>
              </GlassCard>
              
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {savedJobIds.length}
                </div>
                <div className="text-xs text-slate-400 uppercase mt-1">Saved</div>
                <div className="text-sm text-slate-300 mt-1">Roles for later</div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <GlassStats
            title="Average Match"
            value={`${avgMatch}%`}
            subtitle="across visible jobs"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          
          <GlassStats
            title="Profile"
            value={`${readiness}%`}
            subtitle="readiness based on data"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          
          <GlassStats
            title="Verified"
            value={verifiedSkills}
            subtitle="GitHub skills improving quality"
            icon={<Zap className="w-5 h-5" />}
          />
          
          <GlassStats
            title="Skills"
            value={totalSkills}
            subtitle="currently attached to profile"
            icon={<BriefcaseBusiness className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column - Jobs */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Recommended Jobs */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  Recommended for you
                </h2>
                <div className="flex items-center gap-3">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={refreshDashboard}
                    disabled={refreshing}
                    icon={<RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </GlassButton>
                  <Link href="/candidate/jobs">
                    <GlassButton variant="ghost" size="sm">
                      See all jobs
                      <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                Roles ranked highest against your skills, experience, and profile quality
              </p>

              <div className="space-y-4">
                {recommendedJobs.map((job) => {
                  const matchData = matchScores[job.id];
                  const matchScore = matchData?.matchScore ?? 0;
                  const isSaved = savedJobIds.includes(job.id);
                  const isApplied = appliedJobIds.has(job.id);
                  const isApplying = applyingIds.includes(job.id);

                  return (
                    <GlassCard key={job.id} className="p-5" hover>
                      <div className="flex items-start gap-4">
                        {/* Company Initial */}
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold text-lg">
                            {job.company?.[0]?.toUpperCase() ?? 'C'}
                          </span>
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <Link 
                                href={`/jobs/${job.id}`}
                                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors line-clamp-1"
                              >
                                {job.title}
                              </Link>
                              <p className="text-slate-400 text-sm">
                                {job.company} · {job.location} · {timeAgo(job.createdAt)}
                              </p>
                            </div>
                            
                            {/* Match Score Badge */}
                            {matchScore > 0 && (
                              <GlassBadge 
                                variant={matchScore >= 70 ? 'success' : matchScore >= 50 ? 'info' : 'warning'}
                                size="sm"
                              >
                                {matchScore}% match
                              </GlassBadge>
                            )}
                          </div>

                          {/* Job Details */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <GlassBadge size="sm" variant="default">
                              {jobMode(job)}
                            </GlassBadge>
                            <GlassBadge size="sm" variant="default">
                              {compensation(job)}
                            </GlassBadge>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSave(job.id)}
                              icon={isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            >
                              {isSaved ? 'Saved' : 'Save'}
                            </GlassButton>
                            
                            {isApplied ? (
                              <Link href="/candidate/applications">
                                <GlassButton variant="secondary" size="sm">
                                  In Pipeline
                                </GlassButton>
                              </Link>
                            ) : (
                              <GlassButton
                                variant="primary"
                                size="sm"
                                onClick={() => applyToJob(job.id)}
                                disabled={isApplying}
                              >
                                {isApplying ? 'Applying...' : 'Apply Now'}
                              </GlassButton>
                            )}
                            
                            <Link href={`/jobs/${job.id}`}>
                              <GlassButton variant="ghost" size="sm">
                                View Role
                              </GlassButton>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </GlassCard>

            {/* Fresh Openings & Saved Roles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Fresh Openings */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Fresh Openings</h3>
                <div className="space-y-3">
                  {otherJobs.map((job) => {
                    const matchScore = matchScores[job.id]?.matchScore ?? 0;
                    return (
                      <Link 
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="block glass hover:bg-white/10 p-4 rounded-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                              {job.title}
                            </h4>
                            <p className="text-slate-400 text-xs">
                              {job.company} · {compensation(job)}
                            </p>
                          </div>
                          {matchScore > 0 && (
                            <span className="text-xs font-medium text-blue-400">
                              {matchScore}%
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Saved Roles */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Saved Roles</h3>
                  <span className="text-sm text-slate-400">{savedJobIds.length} saved</span>
                </div>
                
                {savedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {savedJobs.slice(0, 4).map((job) => {
                      const matchScore = matchScores[job.id]?.matchScore ?? 0;
                      const isApplied = appliedJobIds.has(job.id);
                      
                      return (
                        <div key={job.id} className="glass p-4 rounded-lg">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Link 
                              href={`/jobs/${job.id}`}
                              className="flex-1 min-w-0"
                            >
                              <h4 className="font-semibold text-white text-sm line-clamp-1 hover:text-blue-400 transition-colors">
                                {job.title}
                              </h4>
                              <p className="text-slate-400 text-xs">
                                {job.company} · {compensation(job)}
                              </p>
                            </Link>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSave(job.id)}
                              className="!p-1"
                            >
                              <BookmarkCheck className="w-4 h-4" />
                            </GlassButton>
                          </div>
                          
                          {matchScore > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-400">{matchScore}% match</span>
                              {isApplied && (
                                <GlassBadge size="sm" variant="success">Applied</GlassBadge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm mb-3">No saved roles yet</p>
                    <Link href="/candidate/jobs">
                      <GlassButton variant="secondary" size="sm">
                        Browse Jobs
                      </GlassButton>
                    </Link>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Active Applications Pipeline */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Active Applications</h2>
                <Link href="/candidate/applications">
                  <GlassButton variant="ghost" size="sm">
                    Open full pipeline
                    <ArrowRight className="w-4 h-4" />
                  </GlassButton>
                </Link>
              </div>

              {activeApplications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeApplications.slice(0, 6).map((app) => {
                    const job = jobs.find((j) => j.id === app.jobId);
                    if (!job) return null;

                    const statusColors: Record<string, string> = {
                      applied: 'default',
                      shortlisted: 'info',
                      interview_scheduled: 'success',
                      interview_done: 'success',
                      offer_sent: 'warning',
                    };

                    return (
                      <Link 
                        key={app.id}
                        href={`/jobs/${job.id}`}
                        className="glass hover:bg-white/10 p-4 rounded-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                              {job.title}
                            </h4>
                            <p className="text-slate-400 text-xs">
                              {job.company} · Applied {timeAgo(app.createdAt)}
                            </p>
                          </div>
                        </div>
                        <GlassBadge 
                          size="sm" 
                          variant={statusColors[app.status] as any || 'default'}
                          dot
                        >
                          {statusLabel(app.status)}
                        </GlassBadge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseBusiness className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No active applications</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Profile Health */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Profile Health</h3>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{readiness}% ready</div>
                  <p className="text-slate-400 text-sm">
                    Profile readiness based on your current candidate data
                  </p>
                </div>
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90" width="80" height="80">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#3B82F6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - readiness / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{readiness}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link 
                  href="/profile"
                  className="flex items-center justify-between glass hover:bg-white/10 px-4 py-3 rounded-lg transition-all text-sm text-slate-300 hover:text-white"
                >
                  <span>Add or refine skills</span>
                  <span className="font-mono text-xs text-blue-400">+20</span>
                </Link>
                <Link 
                  href="/candidate/resume"
                  className="flex items-center justify-between glass hover:bg-white/10 px-4 py-3 rounded-lg transition-all text-sm text-slate-300 hover:text-white"
                >
                  <span>Run resume scanner</span>
                  <span className="font-mono text-xs text-blue-400">+35</span>
                </Link>
                <Link 
                  href="/profile"
                  className="flex items-center justify-between glass hover:bg-white/10 px-4 py-3 rounded-lg transition-all text-sm text-slate-300 hover:text-white"
                >
                  <span>Preview public profile</span>
                  <span className="font-mono text-xs text-slate-500">View</span>
                </Link>
              </div>
            </GlassCard>

            {/* AI Insights */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                  Jobie AI Insights
                </h3>
                <GlassBadge size="sm" variant="success" dot>
                  Live
                </GlassBadge>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                {topJob && matchScores[topJob.id] && (
                  <p className="glass p-3 rounded-lg">
                    <span className="text-blue-400 font-medium">{topJob.title}</span> at {topJob.company} is your top match at{' '}
                    <span className="text-emerald-400 font-medium">{matchScores[topJob.id].matchScore}%</span>. Consider applying today.
                  </p>
                )}

                {topJob && matchScores[topJob.id]?.missingSkills && matchScores[topJob.id].missingSkills.length > 0 && (
                  <p className="glass p-3 rounded-lg">
                    Add <span className="text-amber-400 font-medium">{matchScores[topJob.id].missingSkills.slice(0, 2).join(', ')}</span> to your profile to close the gap.
                  </p>
                )}

                {interviews > 0 && (
                  <p className="glass p-3 rounded-lg">
                    You have <span className="text-emerald-400 font-medium">{interviews} interview{interviews > 1 ? 's' : ''}</span> in progress. Great momentum!
                  </p>
                )}

                {readiness < 100 && (
                  <p className="glass p-3 rounded-lg">
                    Your profile is <span className="text-amber-400 font-medium">{readiness}% complete</span>. Increasing it can improve match quality.
                  </p>
                )}

                {savedJobIds.length > 0 && (
                  <p className="glass p-3 rounded-lg">
                    You have <span className="text-blue-400 font-medium">{savedJobIds.length} saved role{savedJobIds.length > 1 ? 's' : ''}</span>. Review them when you're ready.
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
