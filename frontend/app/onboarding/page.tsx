'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, uploadFile } from '../lib/api';
import { CheckCircle2, Github, FileText, Rocket, ArrowRight, Loader2, Sparkles, UploadCloud } from 'lucide-react';

type VerifiedSkill = { skill: string; confidence: number; source: string };
type Profile = {
  bio: string;
  headline: string;
  location: string;
  skills: string[];
  githubUsername: string;
  githubVerifiedSkills: VerifiedSkill[];
  profileCompleteness: number;
  experience?: unknown[];
  education?: unknown[];
  projects?: unknown[];
};

const STEPS = [
  { id: 0, icon: Sparkles, label: 'Basic Info', sub: 'Tell recruiters who you are' },
  { id: 1, icon: Github, label: 'GitHub', sub: 'Verify skills from your repos' },
  { id: 2, icon: FileText, label: 'Resume', sub: 'Auto-fill your profile' },
  { id: 3, icon: Rocket, label: 'Next Steps', sub: 'How applications work' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (u.role === 'admin') { router.push('/admin'); return; }
    if (u.role !== 'candidate') { router.push('/recruiter/dashboard'); return; }
    setUser(u);
    loadProfile(u.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Mark step 0 as done if they have basic info
      if (p.bio || p.headline || (p.skills?.length ?? 0) > 0) {
        setCompletedSteps((prev) => new Set([...prev, 0]));
      }
      if ((p.githubVerifiedSkills?.length ?? 0) > 0) {
        setCompletedSteps((prev) => new Set([...prev, 1]));
      }
      if ((p.experience?.length ?? 0) > 0 || (p.projects?.length ?? 0) > 0) {
        setCompletedSteps((prev) => new Set([...prev, 2]));
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const ensureProfile = async () => {
    if (!user || profile) return;
    await api.post(`/api/profile/${user.id}`, { bio: '', headline: '', location: '', skills: [] });
  };

  const saveBasic = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const payload = {
      bio: form.bio,
      headline: form.headline,
      location: form.location,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      githubUsername: form.githubUsername?.trim() || undefined,
    };
    try {
      if (profile) {
        await api.put(`/api/profile/${user.id}`, payload);
      } else {
        await api.post(`/api/profile/${user.id}`, payload);
      }
      setMessage({ text: '✅ Profile saved!', ok: true });
      setCompletedSteps((prev) => new Set([...prev, 0]));
      await loadProfile(user.id);
      setTimeout(() => setStep(1), 600);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Save failed', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const verifyGitHub = async () => {
    if (!user) return;
    const cleaned = form.githubUsername.trim().replace(/^@+/, '');
    if (!cleaned) { setMessage({ text: 'Enter a GitHub username first', ok: false }); return; }
    setVerifying(true);
    setMessage(null);
    try {
      await ensureProfile();
      await api.put(`/api/profile/${user.id}`, { githubUsername: cleaned });
      const data = await api.post(`/api/github/verify/${user.id}`, { githubUsername: cleaned });
      const count = data.verifiedSkills?.length ?? 0;
      setMessage({ text: `🎉 GitHub verified! Found ${count} skills from your repos.`, ok: true });
      setCompletedSteps((prev) => new Set([...prev, 1]));
      await loadProfile(user.id);
      setTimeout(() => setStep(2), 800);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Verification failed', ok: false });
    } finally {
      setVerifying(false);
    }
  };

  const parseResume = async () => {
    if (!user) return;
    if (!resumeFile && !resumeText.trim()) { setMessage({ text: 'Upload a PDF or paste resume text', ok: false }); return; }
    setParsing(true);
    setMessage(null);
    try {
      await ensureProfile();
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (resumeText.trim()) formData.append('text', resumeText.trim());
      await uploadFile(`/api/resume/parse-and-save/${user.id}`, formData);
      setMessage({ text: '🚀 Resume parsed and profile updated!', ok: true });
      setCompletedSteps((prev) => new Set([...prev, 2]));
      await loadProfile(user.id);
      setTimeout(() => setStep(3), 800);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Resume parsing failed', ok: false });
    } finally {
      setParsing(false);
    }
  };

  const totalDone = completedSteps.size;
  const progressPct = Math.min(100, Math.round((totalDone / 3) * 100));

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0b0f1a]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-[#0b0f1a] dark:via-[#0f1528] dark:to-[#0b0f1a] flex flex-col">

      {/* Top bar */}
      <div className="max-w-5xl mx-auto w-full px-6 pt-8 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Job</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ie</span>
        </div>
        <button
          onClick={() => router.push('/candidate/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          Skip for now →
        </button>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={12} /> Complete your profile once — match jobs forever
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Let's set up your profile so recruiters can find and evaluate you faster.
          </p>

          {/* Progress bar */}
          <div className="mt-6 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
              <span>{totalDone}/3 steps complete</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{progressPct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step sidebar */}
          <div className="md:col-span-1 flex md:flex-col gap-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isDone = completedSteps.has(s.id);
              const isActive = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={`flex-1 md:flex-none text-left rounded-2xl p-4 transition border ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 dark:border-indigo-700'
                      : isDone
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-100 dark:bg-emerald-900/40' : isActive ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
                      )}
                    </div>
                    <div className="hidden md:block min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {s.label}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.sub}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step content */}
          <div className="md:col-span-3 bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 shadow-sm">
            {/* Step header */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
                <StepIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentStep.label}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentStep.sub}</p>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-5 flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${message.ok ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                {message.text}
              </div>
            )}

            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <div className="space-y-4">
                {[
                  { key: 'headline', label: 'Headline', placeholder: 'e.g. Full Stack Developer · 3 years experience', type: 'input' },
                  { key: 'location', label: 'Location', placeholder: 'e.g. Bangalore, Remote', type: 'input' },
                  { key: 'skills', label: 'Skills (comma-separated)', placeholder: 'React, Node.js, TypeScript, Python', type: 'input' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{f.label}</label>
                    <input
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                      value={(form as Record<string, string>)[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Bio</label>
                  <textarea
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell recruiters about yourself — your passions, stack, and what you're looking for..."
                  />
                </div>
                <button
                  onClick={saveBasic}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save & Continue'}
                  {!saving && <ArrowRight size={15} />}
                </button>
              </div>
            )}

            {/* ── Step 1: GitHub ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Github size={24} />
                    <span className="font-bold text-lg">GitHub Skill Verification</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    We scan your public repositories and detect skills from real code — giving you a <strong className="text-white">verified badge</strong> recruiters can trust. No GitHub? Skip to Resume.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">GitHub Username</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                      <input
                        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={form.githubUsername}
                        onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
                        placeholder="Amrit1604"
                      />
                    </div>
                    <button
                      onClick={verifyGitHub}
                      disabled={verifying}
                      className="shrink-0 flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                    >
                      {verifying ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Skip GitHub for now →
                </button>
              </div>
            )}

            {/* ── Step 2: Resume ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer" onClick={() => document.getElementById('resume-upload')?.click()}>
                  <UploadCloud size={32} className="text-indigo-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Drop your resume PDF here</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                  {resumeFile && <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium">📄 {resumeFile.name}</p>}
                  <input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="text-center text-sm text-gray-400 dark:text-gray-500">— or paste text —</div>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here to auto-fill experience, education, and projects..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={parseResume}
                    disabled={parsing}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200 dark:shadow-none"
                  >
                    {parsing ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                    {parsing ? 'Parsing...' : 'Parse & Auto-fill'}
                  </button>
                  <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-4">
                    Skip →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <div className="space-y-6 text-center pt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50">
                  <Rocket size={36} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">You're all set! 🎉</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-sm mx-auto">
                    Your profile is live. Jobie will now match you to jobs based on your verified skills and experience.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto">
                  {[
                    { icon: '🔍', text: 'Browse matching jobs and see your % match score' },
                    { icon: '⚡', text: 'Apply with one click — no cover letters needed' },
                    { icon: '📊', text: 'Track your applications in a live pipeline' },
                    { icon: '🎯', text: 'Recruiters see your verified skills first' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/candidate/dashboard')}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                >
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
