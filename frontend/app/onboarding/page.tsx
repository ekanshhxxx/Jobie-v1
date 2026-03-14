'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, uploadFile } from '../lib/api';

type VerifiedSkill = { skill: string; confidence: number; source: string };
type Profile = {
  bio: string;
  headline: string;
  location: string;
  skills: string[];
  githubUsername: string;
  githubVerifiedSkills: VerifiedSkill[];
  profileCompleteness: number;
  experience?: any[];
  education?: any[];
  projects?: any[];
};

const COMPLETENESS_TARGET = 40;

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    bio: '',
    headline: '',
    location: '',
    skills: '',
    githubUsername: '',
  });

  const steps = useMemo(() => ([
    { title: 'Basic Info', desc: 'Tell recruiters who you are' },
    { title: 'GitHub', desc: 'Verify skills from your repos' },
    { title: 'Resume', desc: 'Auto-fill experience and projects' },
    { title: 'Next Steps', desc: 'How applications work' },
  ]), []);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (u.role !== 'candidate') { router.push('/dashboard'); return; }
    setUser(u);
    loadProfile(u.id);
  }, [router]);

  const loadProfile = async (userId: number) => {
    try {
      const data = await api.get(`/api/profile/${userId}`);
      const p: Profile = data.profile ?? data;
      setProfile(p);
      setForm({
        bio: p.bio ?? '',
        headline: p.headline ?? '',
        location: p.location ?? '',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
        githubUsername: p.githubUsername ?? '',
      });
      if ((p.profileCompleteness ?? 0) >= COMPLETENESS_TARGET) {
        setStep(3);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const ensureProfile = async () => {
    if (!user) return;
    if (profile) return;
    const payload = {
      bio: '',
      headline: '',
      location: '',
      skills: [],
      githubUsername: form.githubUsername?.trim() || undefined,
    };
    await api.post(`/api/profile/${user.id}`, payload);
  };

  const saveBasic = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const payload = {
      bio: form.bio,
      headline: form.headline,
      location: form.location,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      githubUsername: form.githubUsername?.trim() || undefined,
    };
    try {
      if (profile) {
        await api.put(`/api/profile/${user.id}`, payload);
      } else {
        await api.post(`/api/profile/${user.id}`, payload);
      }
      setMessage({ text: 'Profile saved', ok: true });
      await loadProfile(user.id);
      setStep(1);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Save failed', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const verifyGitHub = async () => {
    if (!user) return;
    const cleaned = form.githubUsername.trim().replace(/^@+/, '');
    if (!cleaned) {
      setMessage({ text: 'Enter a GitHub username first', ok: false });
      return;
    }
    setVerifying(true);
    setMessage(null);
    try {
      if (cleaned !== form.githubUsername) {
        setForm((f) => ({ ...f, githubUsername: cleaned }));
      }
      await ensureProfile();
      await api.put(`/api/profile/${user.id}`, { githubUsername: cleaned });
      const data = await api.post(`/api/github/verify/${user.id}`);
      const count = data.verifiedSkills?.length ?? 0;
      setMessage({ text: `GitHub verified. Found ${count} skills.`, ok: true });
      await loadProfile(user.id);
      setStep(2);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Verification failed', ok: false });
    } finally {
      setVerifying(false);
    }
  };

  const parseResume = async () => {
    if (!user) return;
    if (!resumeFile && !resumeText.trim()) {
      setMessage({ text: 'Upload a PDF or paste resume text', ok: false });
      return;
    }
    setParsing(true);
    setMessage(null);
    try {
      await ensureProfile();
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (resumeText.trim()) formData.append('text', resumeText.trim());
      await uploadFile(`/api/resume/parse-and-save/${user.id}`, formData);
      setMessage({ text: 'Resume parsed and profile updated', ok: true });
      setResumeText('');
      setResumeFile(null);
      await loadProfile(user.id);
      setStep(3);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Resume parsing failed', ok: false });
    } finally {
      setParsing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Complete your profile to unlock better matches</p>
      </div>

      {message && (
        <div className={`mb-5 text-sm px-4 py-3 rounded-lg ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          {steps.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`text-left w-full border rounded-xl p-4 transition ${step === i ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white hover:border-indigo-200'}`}
            >
              <div className="text-sm font-semibold text-gray-900">{i + 1}. {s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Headline</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.headline}
                  onChange={e => setForm({ ...form, headline: e.target.value })}
                  placeholder="e.g. Full Stack Developer · 3 years experience"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell recruiters about yourself..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. New York, Remote"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  placeholder="React, Node.js, Python"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveBasic}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">GitHub Verification</h2>
              <p className="text-sm text-gray-500">We scan your public repos and verify your skills.</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GitHub Username</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.githubUsername}
                    onChange={e => setForm({ ...form, githubUsername: e.target.value })}
                    placeholder="e.g. Amrit1604"
                  />
                  <button
                    onClick={verifyGitHub}
                    disabled={verifying}
                    className="shrink-0 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition font-medium whitespace-nowrap"
                  >
                    {verifying ? 'Verifying...' : 'Verify GitHub'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Resume Upload</h2>
              <p className="text-sm text-gray-500">Upload a PDF or paste your resume text to auto-fill profile sections.</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Upload PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Or paste text</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none"
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste resume text here..."
                />
              </div>
              <button
                onClick={parseResume}
                disabled={parsing}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {parsing ? 'Parsing...' : 'Parse & Continue'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">How applications work</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p>1. Complete your profile so recruiters can evaluate you quickly.</p>
                <p>2. Verify your GitHub to prove real, project-based skills.</p>
                <p>3. Upload your resume to auto-fill experience, education, and projects.</p>
                <p>4. Browse jobs and apply with one click.</p>
                <p>5. Track application status in your dashboard.</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
