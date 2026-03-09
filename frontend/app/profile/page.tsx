'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../lib/api';

type VerifiedSkill = { skill: string; confidence: number; source: string };
type Profile = {
  bio: string;
  headline: string;
  location: string;
  skills: string[];
  githubUsername: string;
  githubVerifiedSkills: VerifiedSkill[];
  profileCompleteness: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
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
    } catch {
      // no profile yet
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      bio: form.bio,
      headline: form.headline,
      location: form.location,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      githubUsername: form.githubUsername,
    };

    try {
      if (profile) {
        await api.put(`/api/profile/${user.id}`, payload);
      } else {
        await api.post(`/api/profile/${user.id}`, payload);
      }
      setMessage({ text: 'Profile saved!', ok: true });
      await loadProfile(user.id);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Save failed', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const verifyGitHub = async () => {
    if (!user) return;
    if (!form.githubUsername.trim()) {
      setMessage({ text: 'Enter a GitHub username first', ok: false });
      return;
    }
    setVerifying(true);
    setMessage(null);
    try {
      // Save username first, then verify
      if (profile) {
        await api.put(`/api/profile/${user.id}`, { githubUsername: form.githubUsername });
      } else {
        await api.post(`/api/profile/${user.id}`, { githubUsername: form.githubUsername });
      }
      const data = await api.post(`/api/github/verify/${user.id}`);
      const count = data.verifiedSkills?.length ?? 0;
      setMessage({ text: `GitHub verified! Found ${count} skill${count !== 1 ? 's' : ''}.`, ok: true });
      await loadProfile(user.id);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Verification failed', ok: false });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading profile...</div>;
  }

  const verifiedSkills = profile?.githubVerifiedSkills ?? [];
  const completeness = profile?.profileCompleteness ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Keep your profile up to date for better job matches</p>
      </div>

      {message && (
        <div
          className={`mb-5 text-sm px-4 py-3 rounded-lg ${
            message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Completeness */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Profile Strength</h2>
            <div className="text-4xl font-bold text-indigo-600 mb-2">{completeness}%</div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {completeness < 50 ? 'Add more info to improve' : completeness < 80 ? 'Looking good!' : 'Excellent profile!'}
            </p>
          </div>

          {/* GitHub Skills */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">GitHub Verified Skills</h2>
            {verifiedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {verifiedSkills.map((s) => (
                  <span
                    key={s.skill}
                    title={`${s.confidence}% confidence · from ${s.source}`}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full cursor-default"
                  >
                    {s.skill} {s.confidence}%
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Not verified yet — enter your GitHub username below</p>
            )}
          </div>
        </div>

        {/* Main form */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={saveProfile} className="space-y-5">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Skills <span className="text-gray-400">(comma-separated)</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.skills}
                onChange={e => setForm({ ...form, skills: e.target.value })}
                placeholder="React, Node.js, Python, TypeScript"
              />
            </div>

            {/* GitHub section */}
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
                  type="button"
                  onClick={verifyGitHub}
                  disabled={verifying}
                  className="shrink-0 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition font-medium whitespace-nowrap"
                >
                  {verifying ? '⏳ Verifying...' : '🐙 Verify GitHub'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                We analyse your public repos and detect your real skills
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
