'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { ArrowRight, CircleUserRound, Filter, Loader2, Search } from 'lucide-react';

type RecruiterJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  lifecycleStatus: 'draft' | 'published' | 'closed';
  approvalStatus: 'approved' | 'pending_review' | 'rejected';
  applicantCount: number;
  newApplicantCount: number;
};

type RecruiterApplication = {
  id: number;
  userId: number;
  jobId: number;
  status: string;
  createdAt: string | null;
  User: {
    id: number;
    name: string;
    email: string;
    role: string;
    profile: {
      title: string;
      skills: string[];
    };
  };
  Job: {
    id: number;
    title: string;
    company: string;
    location: string;
    lifecycleStatus: string;
    approvalStatus: string;
  } | null;
  matchSummary: {
    matchScore: number;
    hiringProbability: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchedTech: string[];
    missingTech: string[];
  };
};

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
] as const;

function stageKey(status: string) {
  if (status === 'applied') return 'applied';
  if (status === 'shortlisted') return 'shortlisted';
  if (status.startsWith('interview')) return 'interview';
  if (status.startsWith('offer')) return 'offer';
  if (status === 'hired') return 'hired';
  return 'applied';
}

function matchBadge(score: number) {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (score >= 60) return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (score >= 40) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-red-500/15 text-red-300 border-red-500/30';
}

function timeAgo(value: string | null) {
  if (!value) return '-';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function RecruiterApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RecruiterJob[]>([]);
  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<RecruiterApplication | null>(null);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
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

      const [rolesResult, appsResult] = await Promise.all([
        api.get(`/api/jobs/recruiter?recruiterId=${user.id}`),
        api.get(`/api/applications/recruiter/${user.id}`),
      ]);

      const nextRoles: RecruiterJob[] = Array.isArray(rolesResult) ? rolesResult : rolesResult.jobs || [];
      const nextApps: RecruiterApplication[] = Array.isArray(appsResult) ? appsResult : appsResult.applications || [];
      setRoles(nextRoles);
      setApplications(nextApps);

      const urlJob = Number(searchParams.get('job'));
      if (urlJob && nextRoles.some((role) => role.id === urlJob)) {
        setSelectedRoleId(urlJob);
      } else {
        setSelectedRoleId(nextRoles[0]?.id ?? null);
      }
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      toast({
        type: 'error',
        title: 'Could not load pipeline',
        message: isApiError(error) ? error.message : 'Please refresh and try again.',
      });
      setRoles([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const roleApplications = useMemo(() => {
    return applications
      .filter((application) => application.jobId === selectedRoleId)
      .filter((application) => {
        if (!search.trim()) return true;
        const bag = `${application.User?.name || ''} ${application.User?.profile?.title || ''} ${application.User?.email || ''}`.toLowerCase();
        return bag.includes(search.toLowerCase());
      });
  }, [applications, selectedRoleId, search]);

  const grouped = useMemo(() => {
    const buckets: Record<string, RecruiterApplication[]> = {
      applied: [],
      shortlisted: [],
      interview: [],
      offer: [],
      hired: [],
    };
    roleApplications.forEach((application) => {
      buckets[stageKey(application.status)].push(application);
    });
    return buckets;
  }, [roleApplications]);

  const updateStatus = async (applicationId: number, status: string) => {
    try {
      setUpdatingId(applicationId);
      await api.put(`/api/applications/${applicationId}`, { status });
      setApplications((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status } : item)));
      setSelectedApp((current) => (current?.id === applicationId ? { ...current, status } : current));
      toast({ type: 'success', title: 'Candidate moved', message: `Status updated to ${status.replace('_', ' ')}` });
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Status update failed',
        message: isApiError(error) ? error.message : 'Could not update candidate status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main className="r-main">
        <div className="flex items-center gap-2 text-sm text-[var(--t2)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading recruiter pipeline...
        </div>
      </main>
    );
  }

  return (
    <main className="r-main">
      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--t3)]">Pipeline</div>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">Role-Centric Candidate Flow</h1>
            <p className="mt-2 text-sm text-[var(--t2)]">Every role appears here, even with zero applicants. Select a role to manage its candidate stages.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/recruiter/post-job')}
            className="rounded-lg bg-[var(--p)] px-3 py-2 text-xs font-semibold text-white"
          >
            + Create Role
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[290px,1fr]">
        <aside className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-3">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[var(--t3)]">
            <span>Roles</span>
            <span>{roles.length}</span>
          </div>
          <div className="space-y-2">
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-[var(--p-hi)] bg-[var(--p-lo)]'
                      : 'border-[var(--border)] bg-[var(--s2)]'
                  }`}
                >
                  <div className="text-sm font-medium text-[var(--t1)]">{role.title}</div>
                  <div className="mt-1 text-[11px] text-[var(--t3)]">{role.company}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--t2)]">
                    <span>{role.applicantCount} applicants</span>
                    {role.newApplicantCount > 0 ? <span>+{role.newApplicantCount} new</span> : <span>0 new</span>}
                  </div>
                </button>
              );
            })}
            {roles.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-8 text-center text-xs text-[var(--t3)]">
                No roles yet.
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[260px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--t3)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidate name, title, email..."
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-9 text-sm text-[var(--t1)] outline-none placeholder:text-[var(--t3)]"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-xs text-[var(--t2)]"
              >
                <Filter className="h-3.5 w-3.5" />
                {selectedRole ? selectedRole.title : 'No role selected'}
              </button>
            </div>
          </section>

          {selectedRole ? (
            <section className="overflow-x-auto">
              <div className="grid min-w-[900px] grid-cols-5 gap-3">
                {STAGES.map((stage) => (
                  <div key={stage.key} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--t3)]">{stage.label}</div>
                      <div className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2 py-0.5 text-[10px] text-[var(--t2)]">
                        {grouped[stage.key].length}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {grouped[stage.key].map((application) => (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedApp(application)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] p-2 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-[var(--t1)]">{application.User?.name || 'Candidate'}</div>
                              <div className="mt-0.5 text-[11px] text-[var(--t3)]">{application.User?.profile?.title || 'Applicant'}</div>
                            </div>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${matchBadge(application.matchSummary?.matchScore || 0)}`}>
                              {application.matchSummary?.matchScore ?? 0}%
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--t3)]">
                            <span>{timeAgo(application.createdAt)}</span>
                            <span className="inline-flex items-center gap-1 text-[var(--t2)]">
                              Open
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                      {grouped[stage.key].length === 0 && (
                        <div className="rounded-lg border border-dashed border-[var(--border)] px-2 py-6 text-center text-[11px] text-[var(--t3)]">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-[var(--r-lg)] border border-dashed border-[var(--border)] bg-[var(--s1)] p-8 text-center text-sm text-[var(--t3)]">
              Select a role to view its pipeline.
            </section>
          )}
        </div>
      </section>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedApp(null)} />
          <div className="relative z-10 w-full max-w-3xl rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--s2)] text-[var(--t2)]">
                  <CircleUserRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-[var(--t1)]">{selectedApp.User?.name || 'Candidate'}</div>
                  <div className="text-xs text-[var(--t3)]">{selectedApp.User?.email}</div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedApp(null)} className="rounded-md border border-[var(--border)] bg-[var(--s2)] px-2 py-1 text-xs text-[var(--t2)]">
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">AI Match</div>
                <div className={`mt-1 inline-flex rounded-md border px-2 py-1 text-sm font-semibold ${matchBadge(selectedApp.matchSummary?.matchScore || 0)}`}>
                  {selectedApp.matchSummary?.matchScore ?? 0}% score
                </div>
                <div className="mt-2 text-xs text-[var(--t2)]">Hiring probability: {selectedApp.matchSummary?.hiringProbability ?? 0}%</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Status</div>
                <select
                  value={selectedApp.status}
                  onChange={(event) => updateStatus(selectedApp.id, event.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--s1)] px-3 text-sm text-[var(--t1)] outline-none"
                  disabled={updatingId === selectedApp.id}
                >
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interview_done">Interview Done</option>
                  <option value="offer_sent">Offer Sent</option>
                  <option value="offer_accepted">Offer Accepted</option>
                  <option value="offer_rejected">Offer Rejected</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Matched Skills</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(selectedApp.matchSummary?.matchedSkills || []), ...(selectedApp.matchSummary?.matchedTech || [])].map((skill) => (
                    <span key={skill} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">{skill}</span>
                  ))}
                  {selectedApp.matchSummary?.matchedSkills?.length === 0 && selectedApp.matchSummary?.matchedTech?.length === 0 && (
                    <span className="text-xs text-[var(--t3)]">No direct matches yet.</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Missing Skills</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(selectedApp.matchSummary?.missingSkills || []), ...(selectedApp.matchSummary?.missingTech || [])].map((skill) => (
                    <span key={skill} className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">{skill}</span>
                  ))}
                  {selectedApp.matchSummary?.missingSkills?.length === 0 && selectedApp.matchSummary?.missingTech?.length === 0 && (
                    <span className="text-xs text-[var(--t3)]">Candidate covers current role requirements.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
