'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { CalendarClock, CheckCircle2, DollarSign, MessageSquare, RefreshCw, Search, Send, UserRound, XCircle } from 'lucide-react';

type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_done'
  | 'offer_sent'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'hired'
  | 'rejected';

interface RecruiterApplication {
  id: number;
  userId: number;
  jobId: number;
  status: ApplicationStatus;
  createdAt: string | null;
  atsMatchScore?: number | null;
  offerDetails?: {
    salary?: string;
    startDate?: string;
    message?: string;
  } | null;
  User: {
    id: number;
    name: string;
    email: string;
    profile?: {
      title?: string;
      skills?: string[];
    };
  };
  Job: {
    id: number;
    title: string;
    company: string;
    location?: string;
  } | null;
  matchSummary?: {
    matchScore: number;
    hiringProbability: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
}

interface RecruiterMeeting {
  id: number;
  scheduledAt: string;
  duration: number;
  status: string;
  candidate?: { id: number; name: string };
  job?: { id: number; title: string };
}

interface OfferForm {
  salary: string;
  startDate: string;
  message: string;
}

const STATUSES: ApplicationStatus[] = [
  'applied',
  'shortlisted',
  'interview_scheduled',
  'interview_done',
  'offer_sent',
  'offer_accepted',
  'offer_rejected',
  'hired',
  'rejected',
];

function toLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function statusBadgeClass(status: ApplicationStatus) {
  const map: Record<ApplicationStatus, string> = {
    applied: 'bg-slate-100 text-slate-700 border-slate-200',
    shortlisted: 'bg-blue-50 text-blue-700 border-blue-200',
    interview_scheduled: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    interview_done: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    offer_sent: 'bg-violet-50 text-violet-700 border-violet-200',
    offer_accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    offer_rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    hired: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return 'Unknown';
  return new Date(dateValue).toLocaleString();
}

function toDateTimeLocalValue(date: Date) {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export default function RecruiterApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [meetings, setMeetings] = useState<RecruiterMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  // Interview schedule modal
  const [scheduleTarget, setScheduleTarget] = useState<RecruiterApplication | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleMeetingUrl, setScheduleMeetingUrl] = useState('');
  const [scheduleAt, setScheduleAt] = useState(() => toDateTimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [scheduleDuration, setScheduleDuration] = useState(45);

  // Offer letter modal
  const [offerTarget, setOfferTarget] = useState<RecruiterApplication | null>(null);
  const [offerForm, setOfferForm] = useState<OfferForm>({ salary: '', startDate: '', message: '' });

  const handleUnauthorized = () => {
    clearAuth();
    router.push('/login');
  };

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const user = getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'recruiter' && user.role !== 'admin') {
        router.push('/candidate/dashboard');
        return;
      }

      const [appData, meetingData] = await Promise.all([
        api.get(`/api/applications/recruiter/${user.id}`),
        api.get('/api/meetings/recruiter').catch(() => []),
      ]);

      setApplications(Array.isArray(appData) ? appData : []);
      setMeetings(Array.isArray(meetingData) ? meetingData : []);
    } catch (error) {
      const message = parseErrorMessage(error, 'Could not load applicant pipeline.');
      if (/unauthorized|jwt|token|access denied/i.test(message)) {
        handleUnauthorized();
        return;
      }
      toast({
        type: 'error',
        title: 'Pipeline unavailable',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meetingByCandidateJob = useMemo(() => {
    const map = new Map<string, RecruiterMeeting>();
    for (const meeting of meetings) {
      const candidateId = meeting.candidate?.id;
      const jobId = meeting.job?.id;
      if (!candidateId || !jobId) continue;
      const key = `${candidateId}:${jobId}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, meeting);
        continue;
      }
      const existingTime = new Date(existing.scheduledAt).getTime();
      const nextTime = new Date(meeting.scheduledAt).getTime();
      if (nextTime > Date.now() && (existingTime < Date.now() || nextTime < existingTime)) {
        map.set(key, meeting);
      }
    }
    return map;
  }, [meetings]);

  const filteredApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [
        app.User?.name,
        app.User?.email,
        app.Job?.title,
        app.Job?.company,
        ...(app.User?.profile?.skills ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [applications, search, statusFilter]);

  const updateStatus = async (applicationId: number, nextStatus: ApplicationStatus, extraPayload?: object) => {
    try {
      setBusyId(applicationId);
      await api.put(`/api/applications/${applicationId}/status`, { status: nextStatus, ...extraPayload });
      setApplications((prev) =>
        prev.map((item) => (item.id === applicationId ? { ...item, status: nextStatus, ...extraPayload } : item))
      );
      toast({
        type: 'success',
        title: 'Status updated',
        message: `Application moved to ${toLabel(nextStatus)}.`,
      });
    } catch (error) {
      toast({
        type: 'error',
        title: 'Status update failed',
        message: parseErrorMessage(error, 'Try again in a moment.'),
      });
    } finally {
      setBusyId(null);
    }
  };

  // ── Status change intercept ──────────────────────────────────────────────────
  const handleStatusChange = (application: RecruiterApplication, nextStatus: ApplicationStatus) => {
    if (nextStatus === 'offer_sent') {
      // Show offer modal instead of directly updating
      setOfferTarget(application);
      setOfferForm({ salary: '', startDate: '', message: '' });
      return;
    }
    void updateStatus(application.id, nextStatus);
  };

  const submitOffer = async () => {
    if (!offerTarget) return;
    await updateStatus(offerTarget.id, 'offer_sent', { offerDetails: offerForm });
    setOfferTarget(null);
  };

  // ── Interview schedule modal ─────────────────────────────────────────────────
  const openSchedule = (application: RecruiterApplication) => {
    setScheduleTarget(application);
    setScheduleTitle(`${application.Job?.title ?? 'Interview'} - ${application.User?.name ?? 'Candidate'}`);
    setScheduleDescription('Live interview discussion and role fit assessment.');
    setScheduleMeetingUrl('');
    setScheduleAt(toDateTimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setScheduleDuration(45);
  };

  const submitSchedule = async () => {
    if (!scheduleTarget) return;
    if (!scheduleAt) {
      toast({ type: 'warning', title: 'Missing date/time', message: 'Select an interview time first.' });
      return;
    }

    const cleanMeetingUrl = scheduleMeetingUrl.trim();
    if (!cleanMeetingUrl) {
      toast({ type: 'warning', title: 'Missing Google Meet link', message: 'Paste a Google Meet URL before confirming.' });
      return;
    }

    if (!/^https:\/\/meet\.google\.com\/.+/i.test(cleanMeetingUrl)) {
      toast({ type: 'warning', title: 'Invalid Google Meet link', message: 'Use a valid https://meet.google.com/... URL.' });
      return;
    }

    const iso = new Date(scheduleAt).toISOString();
    if (!iso || iso === 'Invalid Date') {
      toast({ type: 'warning', title: 'Invalid date/time', message: 'Please use a valid interview time.' });
      return;
    }

    try {
      setBusyId(scheduleTarget.id);
      await api.post('/api/meetings/schedule', {
        jobId: scheduleTarget.jobId,
        candidateId: scheduleTarget.userId,
        title: scheduleTitle,
        description: scheduleDescription,
        meetingUrl: cleanMeetingUrl,
        scheduledAt: iso,
        duration: scheduleDuration,
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === scheduleTarget.id
            ? {
                ...item,
                status: 'interview_scheduled',
              }
            : item
        )
      );

      setScheduleTarget(null);
      toast({
        type: 'success',
        title: 'Interview scheduled',
        message: `Interview added for ${scheduleTarget.User?.name ?? 'candidate'}.`,
      });
      await fetchPipeline();
    } catch (error) {
      toast({
        type: 'error',
        title: 'Could not schedule interview',
        message: parseErrorMessage(error, 'Please review candidate and role details.'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const pipelineStats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((app) => !['rejected', 'hired'].includes(app.status)).length;
    const interviewing = applications.filter((app) =>
      ['interview_scheduled', 'interview_done'].includes(app.status)
    ).length;
    const hires = applications.filter((app) => app.status === 'hired').length;
    return { total, active, interviewing, hires };
  }, [applications]);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--t1)]">Candidate Pipeline</h1>
            <p className="text-sm text-[var(--t2)] mt-1">
              Review applicants, start messaging, and schedule interviews from one workspace.
            </p>
          </div>
          <button
            onClick={() => void fetchPipeline()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2 text-sm font-medium text-[var(--t1)] hover:bg-[var(--s2)] transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <p className="text-xs text-[var(--t3)]">Total Applicants</p>
            <p className="text-2xl font-semibold text-[var(--t1)] mt-1">{pipelineStats.total}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <p className="text-xs text-[var(--t3)]">Active Pipeline</p>
            <p className="text-2xl font-semibold text-[var(--t1)] mt-1">{pipelineStats.active}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <p className="text-xs text-[var(--t3)]">Interview Stage</p>
            <p className="text-2xl font-semibold text-[var(--t1)] mt-1">{pipelineStats.interviewing}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <p className="text-xs text-[var(--t3)]">Hired</p>
            <p className="text-2xl font-semibold text-[var(--t1)] mt-1">{pipelineStats.hires}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <label className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--t3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate, email, role, company, skill"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s2)] text-[var(--t1)] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
              className="rounded-xl border border-[var(--border)] bg-[var(--s2)] text-[var(--t1)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-14 text-center text-sm text-gray-500">Loading applicant pipeline...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-500">No applications matched your current filters.</div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => {
                const nextMeeting = meetingByCandidateJob.get(`${application.userId}:${application.jobId}`);
                // Show ATS score if available, otherwise fall back to matchSummary score
                const displayScore = application.atsMatchScore ?? application.matchSummary?.matchScore ?? 0;
                const scoreLabel = application.atsMatchScore != null ? 'ATS Score' : 'Match';
                return (
                  <article key={application.id} className="rounded-2xl border border-[var(--border)] bg-[var(--s2)] p-4 sm:p-5">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-[var(--t1)] truncate">{application.User?.name ?? 'Candidate'}</h2>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusBadgeClass(application.status)}`}>
                            {toLabel(application.status)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--t3)] truncate">{application.User?.email || 'No email available'}</p>
                        <p className="text-sm text-[var(--t2)] font-medium">
                          {application.Job?.title ?? 'Role unavailable'}
                          <span className="text-[var(--t3)] font-normal"> · {application.Job?.company ?? 'Company unavailable'}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--t2)]">
                          <span className="rounded-full bg-[var(--s3)] px-2 py-1 border border-[var(--border)]">Applied: {formatDate(application.createdAt)}</span>
                          <span className={`rounded-full px-2 py-1 ${application.atsMatchScore != null ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                            {scoreLabel}: {displayScore}%
                          </span>
                          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-300 border border-blue-500/30">
                            Hire probability: {application.matchSummary?.hiringProbability ?? 0}%
                          </span>
                        </div>
                        {!!nextMeeting && (
                          <p className="text-xs text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 inline-flex rounded-lg px-2.5 py-1.5">
                            Next interview: {new Date(nextMeeting.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 xl:w-56">
                        <button
                          onClick={() => router.push(`/profile/${application.userId}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--s3)] px-3 py-2 text-sm font-medium text-[var(--t1)] hover:bg-[var(--s4)]"
                        >
                          <UserRound className="w-4 h-4" />
                          View Profile
                        </button>

                        <button
                          onClick={() => router.push(`/recruiter/messages?candidateId=${application.userId}&jobId=${application.jobId}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Open Chat
                        </button>

                        <button
                          onClick={() => openSchedule(application)}
                          disabled={busyId === application.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 disabled:opacity-60"
                        >
                          <CalendarClock className="w-4 h-4" />
                          Schedule Interview
                        </button>

                        <select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application, e.target.value as ApplicationStatus)}
                          disabled={busyId === application.id}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--s3)] text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {toLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Interview Schedule Modal ──────────────────────────────────────────── */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
              <p className="text-sm text-gray-500 mt-1">
                {scheduleTarget.User?.name} · {scheduleTarget.Job?.title}
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Title</span>
              <input
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Google Meet URL</span>
              <input
                value={scheduleMeetingUrl}
                onChange={(e) => setScheduleMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Description</span>
              <textarea
                value={scheduleDescription}
                onChange={(e) => setScheduleDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-600">Date & time</span>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-600">Duration (minutes)</span>
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={15}
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(Number(e.target.value) || 30)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setScheduleTarget(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitSchedule()}
                disabled={busyId === scheduleTarget.id}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
              >
                Confirm Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer Letter Modal ────────────────────────────────────────────────── */}
      {offerTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Offer Letter</h3>
                <p className="text-sm text-gray-500">{offerTarget.User?.name} · {offerTarget.Job?.title}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Fill in the offer details below. The candidate will receive an email notification and can Accept or Decline from their dashboard.
            </p>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Offered Salary / CTC</span>
              <input
                value={offerForm.salary}
                onChange={(e) => setOfferForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. ₹12 LPA or $80,000/yr"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Proposed Start Date</span>
              <input
                type="date"
                value={offerForm.startDate}
                onChange={(e) => setOfferForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-600">Personal Message (optional)</span>
              <textarea
                value={offerForm.message}
                onChange={(e) => setOfferForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Welcome to the team! We're excited to have you…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setOfferTarget(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitOffer()}
                disabled={busyId === offerTarget.id}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
