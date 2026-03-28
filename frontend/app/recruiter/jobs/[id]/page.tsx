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
        message: isApiError(error) ? error.message : 'Could not load this role.',
      });
      router.push('/recruiter/manage-jobs');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!job) return null;
    const created = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-';
    const activity = job.lastActivityAt ? new Date(job.lastActivityAt).toLocaleString() : '-';
    return { created, activity };
  }, [job]);

  const updateField = <K extends keyof JobPayload>(key: K, value: JobPayload[K]) => {
    if (!job) return;
    setJob({ ...job, [key]: value });
  };

  const addTag = (kind: 'requiredSkills' | 'techStack', value: string) => {
    if (!job) return;
    const normalized = value.trim();
    if (!normalized) return;
    const existing = job[kind].map((item) => item.toLowerCase());
    if (existing.includes(normalized.toLowerCase())) return;
    updateField(kind, [...job[kind], normalized] as JobPayload[typeof kind]);
  };

  const removeTag = (kind: 'requiredSkills' | 'techStack', tag: string) => {
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
      toast({ type: 'success', title: 'Role updated' });
      await loadJob();
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Save failed',
        message: isApiError(error) ? error.message : 'Could not save this role.',
      });
    } finally {
      setSaving(false);
    }
  };

  const setIntent = async (intent: 'draft' | 'publish') => {
    if (!job) return;
    try {
      setSaving(true);
      await api.put(`/api/jobs/${job.id}`, { intent });
      toast({ type: 'success', title: intent === 'publish' ? 'Role published' : 'Role moved to draft' });
      await loadJob();
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Action failed',
        message: isApiError(error) ? error.message : 'Could not update lifecycle.',
      });
    } finally {
      setSaving(false);
    }
  };

  const closeRole = async () => {
    if (!job) return;
    try {
      setSaving(true);
      await api.put(`/api/jobs/${job.id}`, { lifecycleStatus: 'closed' });
      toast({ type: 'success', title: 'Role closed' });
      await loadJob();
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Action failed',
        message: isApiError(error) ? error.message : 'Could not close role.',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async () => {
    if (!job) return;
    if (!window.confirm('Delete this role and all related applications?')) return;
    try {
      setSaving(true);
      await api.delete(`/api/jobs/${job.id}`);
      toast({ type: 'success', title: 'Role deleted' });
      router.push('/recruiter/manage-jobs');
    } catch (error: unknown) {
      toast({
        type: 'error',
        title: 'Delete failed',
        message: isApiError(error) ? error.message : 'Could not delete role.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="r-main"><div className="text-sm text-[var(--t2)]">Loading role workspace...</div></main>;
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
            <h1 className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">{job.title}</h1>
            <p className="mt-2 text-sm text-[var(--t2)]">{job.company} • {job.location || 'Location not set'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIntent('draft')} className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs text-[var(--t2)]">Save Draft</button>
            <button type="button" onClick={() => setIntent('publish')} className="rounded-lg border border-[var(--p-hi)] bg-[var(--p-lo)] px-3 py-2 text-xs text-[var(--p)]">Publish</button>
            <button type="button" onClick={closeRole} className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs text-[var(--t2)]">Close</button>
            <button type="button" onClick={saveJob} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[var(--p)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button type="button" onClick={deleteRole} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--t3)]">
              Title
              <input value={job.title} onChange={(e) => updateField('title', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none" />
            </label>
            <label className="text-xs text-[var(--t3)]">
              Company
              <input value={job.company} onChange={(e) => updateField('company', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none" />
            </label>
            <label className="text-xs text-[var(--t3)]">
              Location
              <input value={job.location} onChange={(e) => updateField('location', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none" />
            </label>
            <label className="text-xs text-[var(--t3)]">
              Salary
              <input value={job.salary} onChange={(e) => updateField('salary', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none" />
            </label>
            <label className="text-xs text-[var(--t3)]">
              Experience
              <select value={job.experienceLevel} onChange={(e) => updateField('experienceLevel', e.target.value as JobPayload['experienceLevel'])} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none">
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </label>
            <label className="text-xs text-[var(--t3)]">
              Lifecycle
              <select value={job.lifecycleStatus} onChange={(e) => updateField('lifecycleStatus', e.target.value as JobPayload['lifecycleStatus'])} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-xs text-[var(--t3)]">
            Description
            <textarea
              rows={7}
              value={job.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-sm text-[var(--t1)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[var(--t3)]">Required skills</label>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag('requiredSkills', skillInput);
                    setSkillInput('');
                  }
                }}
                placeholder="Press enter to add skill"
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((item) => (
                  <button key={item} type="button" onClick={() => removeTag('requiredSkills', item)} className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2 py-0.5 text-[11px] text-[var(--t2)]">
                    {item} ×
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--t3)]">Tech stack</label>
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag('techStack', techInput);
                    setTechInput('');
                  }
                }}
                placeholder="Press enter to add stack item"
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.techStack.map((item) => (
                  <button key={item} type="button" onClick={() => removeTag('techStack', item)} className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2 py-0.5 text-[11px] text-[var(--t2)]">
                    {item} ×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--t3)]">Role Health</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Applicants</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--t1)]">{job.applicantCount}</div>
              <div className="mt-1 text-xs text-[var(--t2)]">{job.newApplicantCount} new since last review</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Approval</div>
              <div className="mt-1 text-lg font-semibold capitalize text-[var(--t1)]">{job.approvalStatus.replace('_', ' ')}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Created</div>
              <div className="mt-1 text-sm text-[var(--t1)]">{summary?.created}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Last Activity</div>
              <div className="mt-1 text-sm text-[var(--t1)]">{summary?.activity}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/recruiter/applications?job=${job.id}`)}
            className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-sm font-medium text-[var(--t2)] hover:text-[var(--t1)]"
          >
            Open Pipeline For This Role
          </button>
        </aside>
      </section>
    </main>
  );
}
