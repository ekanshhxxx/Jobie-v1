'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { api, clearAuth, getUser, isApiError } from '../../../lib/api';
import { useToast } from '../../../components/ToastProvider';

type JobPayload = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string[];
  techStack: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  lifecycleStatus: 'draft' | 'published' | 'closed';
  approvalStatus: 'approved' | 'pending_review' | 'rejected';
  applicantCount: number;
  newApplicantCount: number;
  createdAt: string | null;
  lastActivityAt: string | null;
};

export default function RecruiterJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = Number(params.id);

  const [job, setJob] = useState<JobPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
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

      const result = await api.get(`/api/jobs/${jobId}`);
      setJob(result);

    } catch (error: unknown) {

      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }

      toast({
        type: 'error',
        title: 'Role unavailable',
        message: isApiError(error)
          ? error.message
          : 'Could not load this role.',
      });

      router.push('/recruiter/manage-jobs');

    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!job) return null;

    const created = job.createdAt
      ? new Date(job.createdAt).toLocaleDateString()
      : '-';

    const activity = job.lastActivityAt
      ? new Date(job.lastActivityAt).toLocaleString()
      : '-';

    return { created, activity };
  }, [job]);

  const updateField = <K extends keyof JobPayload>(
    key: K,
    value: JobPayload[K]
  ) => {
    if (!job) return;

    setJob({
      ...job,
      [key]: value,
    });
  };

  const addTag = (
    kind: 'requiredSkills' | 'techStack',
    value: string
  ) => {

    if (!job) return;

    const normalized = value.trim();

    if (!normalized) return;

    const existing = job[kind].map((item) =>
      item.toLowerCase()
    );

    if (existing.includes(normalized.toLowerCase())) return;

    updateField(
      kind,
      [...job[kind], normalized] as JobPayload[typeof kind]
    );
  };

  const removeTag = (
    kind: 'requiredSkills' | 'techStack',
    tag: string
  ) => {

    if (!job) return;

    updateField(
      kind,
      job[kind].filter((item) => item !== tag) as JobPayload[typeof kind]
    );
  };

  const saveJob = async () => {

    if (!job) return;

    try {

      setSaving(true);

      await api.put(`/api/jobs/${job.id}`, {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim(),
        salary: job.salary.trim(),
        description: job.description.trim(),
        experienceLevel: job.experienceLevel,
        requiredSkills: job.requiredSkills,
        techStack: job.techStack,
        lifecycleStatus: job.lifecycleStatus,
      });

      toast({
        type: 'success',
        title: 'Role updated',
      });

      await loadJob();

    } catch (error: unknown) {

      toast({
        type: 'error',
        title: 'Save failed',
        message: isApiError(error)
          ? error.message
          : 'Could not save this role.',
      });

    } finally {
      setSaving(false);
    }
  };

  const setIntent = async (
    intent: 'draft' | 'publish'
  ) => {

    if (!job) return;

    try {

      setSaving(true);

      await api.put(`/api/jobs/${job.id}`, {
        intent,
      });

      toast({
        type: 'success',
        title:
          intent === 'publish'
            ? 'Role published'
            : 'Role moved to draft',
      });

      await loadJob();

    } catch (error: unknown) {

      toast({
        type: 'error',
        title: 'Action failed',
        message: isApiError(error)
          ? error.message
          : 'Could not update lifecycle.',
      });

    } finally {
      setSaving(false);
    }
  };

  const closeRole = async () => {

    if (!job) return;

    try {

      setSaving(true);

      await api.put(`/api/jobs/${job.id}`, {
        lifecycleStatus: 'closed',
      });

      toast({
        type: 'success',
        title: 'Role closed',
      });

      await loadJob();

    } catch (error: unknown) {

      toast({
        type: 'error',
        title: 'Action failed',
        message: isApiError(error)
          ? error.message
          : 'Could not close role.',
      });

    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async () => {

    if (!job) return;

    if (
      !window.confirm(
        'Delete this role and all related applications?'
      )
    ) return;

    try {

      setSaving(true);

      await api.delete(`/api/jobs/${job.id}`);

      toast({
        type: 'success',
        title: 'Role deleted',
      });

      router.push('/recruiter/manage-jobs');

    } catch (error: unknown) {

      toast({
        type: 'error',
        title: 'Delete failed',
        message: isApiError(error)
          ? error.message
          : 'Could not delete role.',
      });

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="r-main">
        <div className="text-sm text-[var(--t2)]">
          Loading role workspace...
        </div>
      </main>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <main className="r-main">

      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">

        <button
          type="button"
          onClick={() => router.push('/recruiter/manage-jobs')}
          className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-[var(--t2)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3">

          <div>
            <h1 className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">
              {job.title}
            </h1>

            <p className="mt-2 text-sm text-[var(--t2)]">
              {job.company} • {job.location || 'Location not set'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={() => setIntent('draft')}
              className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs text-[var(--t2)]"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => setIntent('publish')}
              className="rounded-lg border border-[var(--p-hi)] bg-[var(--p-lo)] px-3 py-2 text-xs text-[var(--p)]"
            >
              Publish
            </button>

            <button
              type="button"
              onClick={closeRole}
              className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs text-[var(--t2)]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={saveJob}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--p)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>

            <button
              type="button"
              onClick={deleteRole}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

          </div>
        </div>
      </section>
    </main>
  );
}