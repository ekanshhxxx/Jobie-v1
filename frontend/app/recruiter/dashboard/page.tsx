'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import 'iconify-icon';

interface DashboardSummary {
  openRoles: number;
  draftRoles: number;
  pendingApproval: number;
  closedRoles: number;
  totalApplicants: number;
  newApplicants: number;
  activePipeline: number;
  interviewing: number;
  offers: number;
  hired: number;
}

interface RecentApplicant {
  id: number;
  status: string;
  createdAt: string;
  candidate: {
    id: number;
    name: string;
    email: string;
    headline: string;
  };
  job: {
    id: number;
    title: string;
  };
  matchSummary: {
    matchScore: number;
    hiringProbability: number;
  };
}

interface JobRole {
  id: number;
  title: string;
  company: string;
  location: string;
  type?: string;
  status: string;
  lifecycleStatus: string;
  approvalStatus: string;
  applicantCount: number;
  newApplicantCount: number;
  requiredSkills: string[];
  createdAt: string;
}

interface PipelinePreview {
  applied: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
}

interface DashboardData {
  recruiterId: number;
  summary: DashboardSummary;
  roles: JobRole[];
  roleHealth: JobRole[];
  recentApplicants: RecentApplicant[];
  pipelinePreview: PipelinePreview;
}

function emptyDashboardData(recruiterId: number): DashboardData {
  return {
    recruiterId,
    summary: {
      openRoles: 0,
      draftRoles: 0,
      pendingApproval: 0,
      closedRoles: 0,
      totalApplicants: 0,
      newApplicants: 0,
      activePipeline: 0,
      interviewing: 0,
      offers: 0,
      hired: 0,
    },
    roles: [],
    roleHealth: [],
    recentApplicants: [],
    pipelinePreview: {
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    },
  };
}

function getStatusBadgeClasses(status: string) {
  const map: Record<string, string> = {
    applied: 'bg-slate-100 text-slate-600 border-slate-200',
    shortlisted: 'bg-blue-50 text-blue-600 border-blue-200',
    interview_scheduled: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    interview_done: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    offer_sent: 'bg-violet-50 text-violet-700 border-violet-200',
    offer_accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    offer_rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    hired: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

function matchScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgoShort(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function generateCopilotInsight(summary: DashboardSummary, recentApplicants: RecentApplicant[]): string {
  const topMatch = recentApplicants.reduce<RecentApplicant | null>((best, app) => {
    if (!best || app.matchSummary.matchScore > best.matchSummary.matchScore) return app;
    return best;
  }, null);

  if (topMatch && topMatch.matchSummary.matchScore >= 80) {
    return `You have ${summary.newApplicants} new applicant${summary.newApplicants !== 1 ? 's' : ''} this week. <strong>${topMatch.candidate.name}</strong> has a <span class="text-green-600 font-medium">${topMatch.matchSummary.matchScore}%</span> match for <strong>${topMatch.job.title}</strong>, consider moving them to an interview.`;
  }

  if (summary.interviewing > 0) {
    return `<span class="text-violet-600 font-medium">${summary.interviewing}</span> candidate${summary.interviewing !== 1 ? 's' : ''} are currently in the interview stage. You have ${summary.openRoles} active role${summary.openRoles !== 1 ? 's' : ''} and ${summary.totalApplicants} total applicants in your pipeline.`;
  }

  return `Your pipeline has <span class="text-green-600 font-medium">${summary.totalApplicants}</span> total applicant${summary.totalApplicants !== 1 ? 's' : ''} across <strong>${summary.openRoles}</strong> active role${summary.openRoles !== 1 ? 's' : ''}. ${summary.newApplicants > 0 ? `${summary.newApplicants} applied recently and haven't been reviewed yet.` : 'Review your candidates to keep your pipeline moving.'}`;
}

export default function RecruiterDashboard() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUnauthorized = () => {
    clearAuth();
    router.push('/login');
  };

  const fetchDashboardData = async () => {
    let recruiterId = 0;
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) { router.push('/login'); return; }
      if (user.role === 'candidate') { router.push('/candidate/dashboard'); return; }
      recruiterId = Number(user.id) || 0;

      // Soft check only: never redirect from dashboard.
      try {
        const profileRes = await api.get(`/api/profile/${user.id}`);
        const profile = profileRes.profile ?? profileRes;
        const approvalState = String(profile?.headline ?? '').trim().toUpperCase();
        if (approvalState === 'PENDING_ADMIN_APPROVAL') {
          setError('Your recruiter account is pending verification. Showing limited dashboard data for now.');
        }
      } catch {
        // Ignore profile read errors in dashboard route.
      }

      try {
        const data: DashboardData = await api.get(`/api/dashboard/recruiter/${user.id}`);
        setDashboardData(data);
      } catch (dashErr: unknown) {
        if (isApiError(dashErr) && dashErr.status === 401) {
          handleUnauthorized();
          return;
        }
        setDashboardData(emptyDashboardData(recruiterId));
        setError('Live dashboard data is temporarily unavailable. Showing fallback view.');
        console.error(dashErr);
      }
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 401) {
        handleUnauthorized();
        return;
      }
      setDashboardData(emptyDashboardData(recruiterId));
      setError('Could not load dashboard data. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const summary = dashboardData?.summary;
  const roles = dashboardData?.roles ?? [];
  const recentApplicants = dashboardData?.recentApplicants ?? [];
  const pipelinePreview = dashboardData?.pipelinePreview;

  const copilotInsight = useMemo(() => {
    if (!summary) return '';
    return generateCopilotInsight(summary, recentApplicants);
  }, [summary, recentApplicants]);

  const pipelineTotal = pipelinePreview
    ? Object.values(pipelinePreview).reduce((a, b) => a + b, 0)
    : 0;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 dark:bg-[#0b0f1a] transition-colors">
        <div className="max-w-[1400px] mx-auto space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-white/60 dark:bg-white/5 rounded-3xl border border-white/80 dark:border-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-white/60 dark:bg-white/5 rounded-3xl border border-white/80 dark:border-white/10" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white/60 dark:bg-white/5 rounded-3xl border border-white/80 dark:border-white/10" />
            <div className="h-64 bg-white/60 dark:bg-white/5 rounded-3xl border border-white/80 dark:border-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0b0f1a] p-4 sm:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here&apos;s your hiring pipeline overview for today.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/recruiter/applications')}
                className="px-4 py-2 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-all shadow-sm"
              >
                View All Applicants
                <iconify-icon icon="solar:alt-arrow-right-linear" width="16" height="16" />
              </button>
            </div>
          </div>

          {/* AI Summary Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-white/80 to-white/40 dark:from-[#121b2f]/95 dark:to-[#0f1729]/95 border border-white/80 dark:border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)] flex gap-4 items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-2.5 bg-violet-50 dark:bg-violet-500/15 rounded-2xl text-violet-600 dark:text-violet-300 shrink-0 border border-violet-100/50 dark:border-violet-400/20 shadow-sm relative z-10">
              <iconify-icon icon="solar:stars-linear" width="22" height="22" />
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                Copilot Insights
                <span className="text-[10px] font-medium uppercase tracking-wider bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md">Live</span>
              </h3>
              <p
                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-1"
                dangerouslySetInnerHTML={{ __html: copilotInsight }}
              />
            </div>
            <button
              onClick={() => router.push('/recruiter/applications')}
              className="hidden sm:flex ml-auto items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25 px-3 py-1.5 rounded-lg transition-colors border border-violet-200/50 dark:border-violet-400/30 relative z-10 shrink-0 mt-2"
            >
              View Pipeline
              <iconify-icon icon="solar:arrow-right-linear" width="14" height="14" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Stat Card 1: Active Jobs */}
          <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow cursor-pointer group" onClick={() => router.push('/recruiter/manage-jobs')}>
            <div className="flex items-center justify-between z-10">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Active Jobs</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <iconify-icon icon="solar:briefcase-linear" width="16" height="16" class="text-gray-600" />
              </div>
            </div>
            <div className="flex items-end justify-between z-10">
              <div>
                <span className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white">{summary?.openRoles ?? 0}</span>
                <div className="flex items-center gap-1 mt-1">
                  {(summary?.draftRoles ?? 0) > 0 && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100/80 dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-gray-200/50 dark:border-white/10 flex items-center">
                      +{summary?.draftRoles} draft
                    </span>
                  )}
                </div>
              </div>
              {/* Mini Bar Chart */}
              <div className="flex items-end gap-1 h-10">
                {[30, 50, 40, 70, 60, 100].map((h, i) => (
                  <div key={i} className={`w-1.5 rounded-full ${i === 5 ? 'bg-gray-900' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Stat Card 2: Total Candidates */}
          <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow cursor-pointer" onClick={() => router.push('/recruiter/applications')}>
            <div className="absolute inset-0 bg-gradient-to-b from-violet-50/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Candidates</span>
              <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shadow-sm border border-violet-100">
                <iconify-icon icon="solar:users-group-rounded-linear" width="16" height="16" class="text-violet-600" />
              </div>
            </div>
            <div className="flex items-end justify-between z-10">
              <div>
                <span className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white">{summary?.totalApplicants ?? 0}</span>
                <div className="flex items-center gap-1 mt-1">
                  {(summary?.newApplicants ?? 0) > 0 && (
                    <span className="text-xs font-medium text-violet-600 bg-violet-50/80 px-1.5 py-0.5 rounded-md border border-violet-200/50 flex items-center gap-0.5">
                      <iconify-icon icon="solar:stars-linear" width="12" height="12" />
                      {summary?.newApplicants} new
                    </span>
                  )}
                </div>
              </div>
              {/* Sparkline */}
              <svg className="w-16 h-8 text-violet-400 opacity-60" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M0 25 Q 15 20, 25 25 T 50 15 T 75 20 T 100 5" />
              </svg>
            </div>
          </div>

          {/* Stat Card 3: Interviewing */}
          <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="flex items-center justify-between z-10">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Interviewing</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <iconify-icon icon="solar:clock-circle-linear" width="16" height="16" class="text-gray-600" />
              </div>
            </div>
            <div className="flex items-end justify-between z-10">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white">{summary?.interviewing ?? 0}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">active</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {(summary?.offers ?? 0) > 0 && (
                    <span className="text-xs font-medium text-green-600 bg-green-50/80 px-1.5 py-0.5 rounded-md border border-green-200/50 flex items-center">
                      <iconify-icon icon="solar:arrow-right-up-linear" width="12" height="12" />
                      {summary?.offers} offer{(summary?.offers ?? 0) !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">in pipeline</span>
                </div>
              </div>
              {/* Circular Progress */}
              <div className="relative w-10 h-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#171717" strokeWidth="4"
                    strokeDasharray={`${Math.min(((summary?.interviewing ?? 0) / Math.max(summary?.totalApplicants ?? 1, 1)) * 100, 100)}, 100`}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Stat Card 4: Hired */}
          <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="flex items-center justify-between z-10">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Hired This Cycle</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <iconify-icon icon="solar:diploma-linear" width="16" height="16" class="text-gray-600" />
              </div>
            </div>
            <div className="flex items-end justify-between z-10">
              <div>
                <span className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white">{summary?.hired ?? 0}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-200 bg-gray-100/80 dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-gray-200/50 dark:border-white/10 flex items-center">
                    {summary?.activePipeline ?? 0} in pipeline
                  </span>
                </div>
              </div>
              {/* Avatar Stack from recent applicants */}
              <div className="flex -space-x-2">
                {recentApplicants.slice(0, 3).map((app, i) => {
                  const colors = ['bg-blue-100 text-blue-700', 'bg-pink-100 text-pink-700', 'bg-violet-100 text-violet-700'];
                  return (
                    <div key={app.id} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium ${colors[i]} z-${30 - i * 10}`}>
                      {getInitials(app.candidate.name)}
                    </div>
                  );
                })}
                {recentApplicants.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-500 z-0">
                    +{recentApplicants.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Health Mini Bar */}
        {pipelinePreview && pipelineTotal > 0 && (
          <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-xl p-4 rounded-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                Pipeline Health
                <span className="text-xs text-gray-400 font-normal">{pipelineTotal} total</span>
              </h3>
              <button onClick={() => router.push('/recruiter/applications')} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
                Manage {'->'}
              </button>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {pipelinePreview.applied > 0 && <div className="bg-slate-400 rounded-full transition-all" style={{ width: `${(pipelinePreview.applied / pipelineTotal) * 100}%` }} title={`Applied: ${pipelinePreview.applied}`} />}
              {pipelinePreview.shortlisted > 0 && <div className="bg-blue-400 rounded-full transition-all" style={{ width: `${(pipelinePreview.shortlisted / pipelineTotal) * 100}%` }} title={`Shortlisted: ${pipelinePreview.shortlisted}`} />}
              {pipelinePreview.interview > 0 && <div className="bg-violet-400 rounded-full transition-all" style={{ width: `${(pipelinePreview.interview / pipelineTotal) * 100}%` }} title={`Interview: ${pipelinePreview.interview}`} />}
              {pipelinePreview.offer > 0 && <div className="bg-amber-400 rounded-full transition-all" style={{ width: `${(pipelinePreview.offer / pipelineTotal) * 100}%` }} title={`Offer: ${pipelinePreview.offer}`} />}
              {pipelinePreview.hired > 0 && <div className="bg-emerald-400 rounded-full transition-all" style={{ width: `${(pipelinePreview.hired / pipelineTotal) * 100}%` }} title={`Hired: ${pipelinePreview.hired}`} />}
              {pipelinePreview.rejected > 0 && <div className="bg-red-300 rounded-full transition-all" style={{ width: `${(pipelinePreview.rejected / pipelineTotal) * 100}%` }} title={`Rejected: ${pipelinePreview.rejected}`} />}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {[
                { label: 'Applied', count: pipelinePreview.applied, color: 'bg-slate-400' },
                { label: 'Shortlisted', count: pipelinePreview.shortlisted, color: 'bg-blue-400' },
                { label: 'Interview', count: pipelinePreview.interview, color: 'bg-violet-400' },
                { label: 'Offer', count: pipelinePreview.offer, color: 'bg-amber-400' },
                { label: 'Hired', count: pipelinePreview.hired, color: 'bg-emerald-400' },
              ].filter(item => item.count > 0).map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-700">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Left Column: AI Prioritized Jobs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                Your Active Roles
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-medium uppercase tracking-wider">Live</span>
              </h2>
              <button onClick={() => router.push('/recruiter/manage-jobs')} className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Manage all
              </button>
            </div>

            <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
              {roles.length === 0 ? (
                <div className="p-10 text-center">
                  <iconify-icon icon="solar:briefcase-linear" width="36" height="36" class="text-gray-300 mx-auto block mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">No jobs posted yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Post your first role to start receiving applications.</p>
                  <button
                    onClick={() => router.push('/recruiter/post-job')}
                    className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    <iconify-icon icon="solar:add-square-linear" width="16" height="16" />
                    Post a Job
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100/50">
                  {roles.slice(0, 5).map(job => {
                    const appCount = job.applicantCount;
                    const isActive = job.lifecycleStatus === 'published' && job.approvalStatus !== 'rejected';
                    return (
                      <li
                        key={job.id}
                        className="p-5 hover:bg-white/40 transition-colors flex items-center justify-between group cursor-pointer"
                        onClick={() => router.push(`/recruiter/manage-jobs`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-white shadow-sm flex items-center justify-center shrink-0">
                            <iconify-icon icon="solar:code-square-linear" width="22" height="22" class="text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{job.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-300">{job.company}</span>
                              {job.location && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span className="text-xs text-gray-500 dark:text-gray-300">{job.location}</span>
                                </>
                              )}
                              {!isActive && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded capitalize">
                                    {job.approvalStatus === 'pending_review' ? 'Pending' : job.lifecycleStatus}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {/* AI Match */}
                          <div className="hidden md:flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              job.newApplicantCount > 0
                                ? 'bg-violet-50/80 dark:bg-violet-500/15 border border-violet-100 dark:border-violet-400/25 text-violet-700 dark:text-violet-300'
                                : 'bg-gray-100/80 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 text-gray-600 dark:text-gray-300'
                            }`}>
                              <iconify-icon icon={job.newApplicantCount > 0 ? 'solar:stars-linear' : 'solar:users-group-rounded-linear'} width="14" height="14" />
                              {job.newApplicantCount > 0 ? `${job.newApplicantCount} new` : 'No new apps'}
                            </div>
                          </div>

                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{appCount}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-300 uppercase tracking-wide">Total</p>
                          </div>

                          <div className="w-px h-8 bg-gray-200/50 hidden sm:block" />

                          <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200/50 dark:group-hover:border-white/10">
                            <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column: Recent Applicants Activity Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-medium text-gray-900 dark:text-white">Recent Applicants</h2>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => router.push('/recruiter/applications')}>
                <iconify-icon icon="solar:alt-arrow-right-linear" width="20" height="20" />
              </button>
            </div>

            <div className="bg-white/60 dark:bg-[#111a2b]/88 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden">
              {/* Top highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              {recentApplicants.length === 0 ? (
                <div className="text-center py-6">
                  <iconify-icon icon="solar:inbox-linear" width="36" height="36" class="text-gray-300 mx-auto block mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">No applicants yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Applications will appear here as candidates apply to your jobs.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {recentApplicants.map((app, idx) => {
                    const isFirst = idx === 0;
                    const scoreStyle = matchScoreColor(app.matchSummary.matchScore);
                    const statusClasses = getStatusBadgeClasses(app.status);
                    const hasMore = idx < recentApplicants.length - 1;

                    return (
                      <div
                        key={app.id}
                        className="flex gap-4 relative group cursor-pointer"
                        onClick={() => router.push('/recruiter/applications')}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full z-10 mt-1 shadow-sm transition-transform group-hover:scale-125 ${
                            isFirst
                              ? 'w-2.5 h-2.5 bg-violet-500 ring-4 ring-violet-50'
                              : 'w-2 h-2 bg-gray-300 ring-4 ring-white group-hover:bg-gray-400'
                          }`} />
                          {hasMore && (
                            <div className={`w-px flex-1 ${isFirst ? 'bg-gradient-to-b from-violet-200 to-gray-200' : 'bg-gray-200'} absolute top-4 left-[4.5px]`} />
                          )}
                        </div>
                        <div className={`flex-1 ${idx < recentApplicants.length - 1 ? 'pb-2' : ''} ${!isFirst ? 'opacity-75 group-hover:opacity-100 transition-opacity' : ''}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{app.candidate.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 truncate">{app.job.title}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg border shrink-0 ${scoreStyle}`}>
                              {app.matchSummary.matchScore}%
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border capitalize ${statusClasses}`}>
                              {app.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgoShort(app.createdAt)}</span>
                          </div>
                          {isFirst && (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push('/recruiter/applications'); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50/50 dark:bg-violet-500/15 border border-violet-100 dark:border-violet-400/30 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-500/25 transition-all"
                              >
                                <iconify-icon icon="solar:magic-stick-3-linear" width="14" height="14" />
                                AI Analysis
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => router.push('/recruiter/applications')}
                className="w-full mt-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-200 bg-white/50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white hover:shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:users-group-rounded-linear" width="16" height="16" />
                View Full Candidate Pipeline
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
