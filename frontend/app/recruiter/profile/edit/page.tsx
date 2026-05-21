'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { api, clearAuth, getUser, isApiError } from '../../../lib/api';
import { useToast } from '../../../components/ToastProvider';

type ProfileForm = {
  companyName: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  companyLogo: string;
  skills: string;
};

const EMPTY_FORM: ProfileForm = {
  companyName: '',
  headline: '',
  bio: '',
  location: '',
  website: '',
  companyLogo: '',
  skills: '',
};

export default function RecruiterProfileEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = getUser();

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'recruiter') {
        router.push('/candidate/dashboard');
        return;
      }
      const result = await api.get(`/api/profile/${user.id}`);
      const profile = result.profile ?? result;
      setForm({
        companyName: profile.companyName || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        companyLogo: profile.companyLogo || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
      });
    } catch {
      setForm((current) => ({
        ...current,
        companyName: current.companyName || '',
      }));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      await api.put(`/api/profile/${user.id}`, {
        companyName: form.companyName.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        companyLogo: form.companyLogo.trim(),
        skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
      });
      toast({ type: 'success', title: 'Profile saved' });
      router.push('/recruiter/profile');
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      toast({
        type: 'error',
        title: 'Save failed',
        message: isApiError(error) ? error.message : 'Could not save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="r-main"><div className="text-sm text-[var(--t2)]">Loading profile editor...</div></main>;
  }

  return (
    <main className="r-main">
      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--t3)]">Recruiter Profile</div>
        <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">Edit Company Presence</h1>
        <p className="mt-2 text-sm text-[var(--t2)]">These details appear in recruiter-facing views and help candidates trust your role listings.</p>
      </section>

      <form onSubmit={submit} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-[var(--t3)] md:col-span-2">
            Company Name
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
            />
          </label>
          <label className="text-xs text-[var(--t3)] md:col-span-2">
            Headline
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
              placeholder="What your team is building and why candidates should care"
            />
          </label>
          <label className="text-xs text-[var(--t3)]">
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
            />
          </label>
          <label className="text-xs text-[var(--t3)]">
            Website
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
              placeholder="https://company.com"
            />
          </label>
          <label className="text-xs text-[var(--t3)] md:col-span-2">
            Company Logo URL
            <input
              value={form.companyLogo}
              onChange={(e) => setForm({ ...form, companyLogo: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
            />
          </label>
          <label className="text-xs text-[var(--t3)] md:col-span-2">
            Tech Stack (comma-separated)
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-sm text-[var(--t1)] outline-none"
            />
          </label>
          <label className="text-xs text-[var(--t3)] md:col-span-2">
            Company Story
            <textarea
              required
              rows={7}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-sm text-[var(--t1)] outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/recruiter/profile')}
            className="rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs text-[var(--t2)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--p)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Profile
          </button>
        </div>
      </form>
    </main>
  );
}
