'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { ChevronRight, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

type LifecycleStatus = 'draft' | 'published' | 'closed';
type ApprovalStatus = 'approved' | 'pending_review' | 'rejected';

type RecruiterJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string[];
  techStack: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  lifecycleStatus: LifecycleStatus;
  approvalStatus: ApprovalStatus;
  applicantCount: number;
  newApplicantCount: number;
  lastActivityAt: string | null;
  createdAt: string | null;
};

function badgeTone(status: LifecycleStatus, approval: ApprovalStatus) {
  if (approval === 'rejected') return 'bg-red-500/10 text-red-300 border-red-500/25';
  if (approval === 'pending_review') return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  if (status === 'published') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  if (status === 'closed') return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/25';
  return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
}

function statusLabel(status: LifecycleStatus, approval: ApprovalStatus) {
  if (approval === 'rejected') return 'Rejected';
  if (approval === 'pending_review') return 'Pending Review';
  if (status === 'published') return 'Published';
  if (status === 'closed') return 'Closed';
  return 'Draft';
}

function timeAgo(value: string | null) {
  if (!value) return '-';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function RecruiterManageJobsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<'all' | LifecycleStatus>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | ApprovalStatus>('all');
  const [busyJobId, setBusyJobId] = useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const user = getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'recruiter') {
        router.push('/candidate/dashboard');
        return;
      }
      const result = await api.get(`/api/jobs/recruiter?recruiterId=${user.id}`);
      setJobs(Array.isArray(result) ? result : result.jobs || []);
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      toast({
        type: 'error',
        title: 'Unable to load jobs',
        message: 'Please refresh. We could not fetch your role listings.',
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (lifecycleFilter !== 'all' && job.lifecycleStatus !== lifecycleFilter) return false;
      if (approvalFilter !== 'all' && job.approvalStatus !== approvalFilter) return false;
      if (!search.trim()) return true;
      const bag = `${job.title} ${job.company} ${job.location} ${job.requiredSkills.join(' ')} ${job.techStack.join(' ')}`.toLowerCase();
      return bag.includes(search.toLowerCase());
    });
  }, [jobs, lifecycleFilter, approvalFilter, search]);

  const summary = useMemo(() => {
    return {
      total: jobs.length,
      published: jobs.filter((j) => j.lifecycleStatus === 'published' && j.approvalStatus === 'approved').length,
      drafts: jobs.filter((j) => j.lifecycleStatus === 'draft').length,
      pending: jobs.filter((j) => j.approvalStatus === 'pending_review').length,
      applicants: jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
    };
  }, [jobs]);

  const updateJob = async (jobId: number, payload: Record<string, unknown>, successTitle: string) => {
    try {
      setBusyJobId(jobId);
      await api.put(`/api/jobs/${jobId}`, payload);
      await loadJobs();
      toast({ type: 'success', title: successTitle });
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Action failed',
        message: isApiError(error) ? error.message : 'Could not update this role.',
      });
    } finally {
      setBusyJobId(null);
    }
  };

  const removeJob = async (jobId: number) => {
    const ok = window.confirm('Delete this role and all related applications?');
    if (!ok) return;
    try {
      setBusyJobId(jobId);
      await api.delete(`/api/jobs/${jobId}`);
      await loadJobs();
      toast({ type: 'success', title: 'Role deleted' });
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Delete failed',
        message: isApiError(error) ? error.message : 'Could not delete this role.',
      });
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <main className="r-main">
      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--t3)]">Recruiter Jobs</div>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">Role Command Center</h1>
            <p className="mt-2 text-sm text-[var(--t2)]">Manage lifecycle, approvals, applicant flow, and role quality from one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadJobs}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs font-medium text-[var(--t2)] transition hover:text-[var(--t1)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => router.push('/recruiter/post-job')}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--p)] px-3 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New Role
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">Roles</div>
            <div className="mt-1 text-lg font-semibold text-[var(--t1)]">{summary.total}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">Published</div>
            <div className="mt-1 text-lg font-semibold text-[var(--t1)]">{summary.published}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">Drafts</div>
            <div className="mt-1 text-lg font-semibold text-[var(--t1)]">{summary.drafts}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">Pending</div>
            <div className="mt-1 text-lg font-semibold text-[var(--t1)]">{summary.pending}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">Applicants</div>
            <div className="mt-1 text-lg font-semibold text-[var(--t1)]">{summary.applicants}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr,180px,190px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, company, location, stack..."
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none placeholder:text-[var(--t3)]"
          />
          <select
            value={lifecycleFilter}
            onChange={(event) => setLifecycleFilter(event.target.value as 'all' | LifecycleStatus)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
          >
            <option value="all">All lifecycle states</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={approvalFilter}
            onChange={(event) => setApprovalFilter(event.target.value as 'all' | ApprovalStatus)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
          >
            <option value="all">All approval states</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--border)] bg-[var(--s2)] text-[10px] uppercase tracking-[0.14em] text-[var(--t3)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Signals</th>
                <th className="px-4 py-3 font-semibold">Applicants</th>
                <th className="px-4 py-3 font-semibold">Lifecycle</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-[var(--t3)]" colSpan={6}>Loading recruiter roles...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-[var(--t3)]" colSpan={6}>
                    No roles match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--t1)]">{job.title}</div>
                      <div className="mt-1 text-xs text-[var(--t3)]">{job.company} • {job.location || 'Location not set'}</div>
                      <div className="mt-2 text-[11px] text-[var(--t2)]">Level: <span className="capitalize">{job.experienceLevel}</span></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {job.techStack.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2 py-0.5 text-[11px] text-[var(--t2)]">{skill}</span>
                        ))}
                        {job.techStack.length > 3 && (
                          <span className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2 py-0.5 text-[11px] text-[var(--t3)]">
                            +{job.techStack.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--t2)]">
                      <div className="font-semibold text-[var(--t1)]">{job.applicantCount}</div>
                      {job.newApplicantCount > 0 && (
                        <div className="mt-1 inline-flex rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                          +{job.newApplicantCount} new
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeTone(job.lifecycleStatus, job.approvalStatus)}`}>
                        {statusLabel(job.lifecycleStatus, job.approvalStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--t2)]">{timeAgo(job.lastActivityAt || job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-[11px] text-[var(--t2)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          disabled={busyJobId === job.id}
                          onClick={() => updateJob(job.id, { intent: 'draft' }, 'Role moved to draft')}
                          className="rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-[11px] text-[var(--t2)] disabled:opacity-50"
                        >
                          Draft
                        </button>
                        <button
                          type="button"
                          disabled={busyJobId === job.id}
                          onClick={() => updateJob(job.id, { intent: 'publish' }, 'Role published')}
                          className="rounded-md border border-[var(--p-hi)] bg-[var(--p-lo)] px-2 py-1 text-[11px] text-[var(--p)] disabled:opacity-50"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          disabled={busyJobId === job.id}
                          onClick={() => updateJob(job.id, { lifecycleStatus: 'closed' }, 'Role closed')}
                          className="rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-[11px] text-[var(--t2)] disabled:opacity-50"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-[11px] text-[var(--t2)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyJobId === job.id}
                          onClick={() => removeJob(job.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/recruiter/applications?job=${job.id}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-[11px] text-[var(--t2)]"
                        >
                          Pipeline
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
