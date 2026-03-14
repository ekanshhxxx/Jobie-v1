'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, uploadFile, API_BASE_URL } from '../../lib/api';
import { User, Profile } from '../../components/types';
import { Camera, Save, Github, Eye, Loader, FileText, UploadCloud, AlertCircle } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    headline: '',
    bio: '',
    skills: '',
    githubUsername: '',
    location: '',
    website: '',
    linkedin: '',
  });

  const avatarSrc = profile?.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`)
    : '';

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    loadProfile(u.id);
  }, [router]);

  const loadProfile = async (userId: number) => {
    try {
      setLoading(true);
      const data = await api.get(`/api/profile/${userId}`);
      const p: Profile = data.profile ?? data;
      setProfile(p);
      setForm({
        headline: p.headline ?? '',
        bio: p.bio ?? '',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
        githubUsername: p.githubUsername ?? '',
        location: p.location ?? '',
        website: p.website ?? '',
        linkedin: p.linkedin ?? '',
      });
    } catch {
      // No profile yet, form will be empty
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      ...form,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const method = profile ? 'put' : 'post';
      await api[method](`/api/profile/${user.id}`, payload);
      setMessage({ text: 'Profile saved successfully!', ok: true });
      setTimeout(() => user && router.push(`/profile/${user.id}`), 1000);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Save failed', ok: false });
    } finally {
      setSaving(false);
    }
  };
  
  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setMessage(null);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const data = await uploadFile(`/api/uploads/avatar/${user.id}`, formData);
      setProfile(p => ({...(p as Profile), avatarUrl: data.url}));
      setMessage({ text: 'Avatar updated!', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Upload failed', ok: false });
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
      await api.put(`/api/profile/${user.id}`, { githubUsername: cleaned });
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
    return <div className="flex items-center justify-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Edit Your Profile</h1>
          <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Craft a profile that stands out to recruiters.</p>
        </div>

        <form onSubmit={saveProfile} className="space-y-8">
          {/* -- AVATAR & ACTIONS -- */}
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <img src={avatarSrc || 'https://i.pravatar.cc/300'} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md" />
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <Camera size={24} />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role === 'candidate' ? 'Job Seeker' : user?.role}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => user && router.push(`/profile/${user.id}`)} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <Eye size={16} /> Preview
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`flex items-center gap-3 text-sm px-4 py-3 rounded-lg ${message.ok ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
              <AlertCircle size={16} /> {message.text}
            </div>
          )}

          {/* -- CORE INFO -- */}
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Core Information</h3>
            <div>
              <label htmlFor="headline" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Headline</label>
              <input id="headline" name="headline" value={form.headline} onChange={handleInputChange} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Bio</label>
              <textarea id="bio" name="bio" value={form.bio} onChange={handleInputChange} rows={4} placeholder="Tell us about your professional journey..." className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          
          {/* -- SKILLS & GITHUB -- */}
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Skills & Verification</h3>
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Skills <span className="text-gray-400">(comma-separated)</span></label>
              <input id="skills" name="skills" value={form.skills} onChange={handleInputChange} placeholder="e.g. React, Node.js, Python" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">GitHub Username</label>
              <div className="flex gap-2">
                <input id="githubUsername" name="githubUsername" value={form.githubUsername} onChange={handleInputChange} placeholder="Your GitHub username" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={verifyGitHub} disabled={verifying} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition">
                  {verifying ? <Loader size={16} className="animate-spin" /> : <Github size={16} />}
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
          
          {/* -- ONLINE PRESENCE -- */}
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Online Presence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Location</label>
                <input id="location" name="location" value={form.location} onChange={handleInputChange} placeholder="e.g. San Francisco, CA" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Personal Website</label>
                <input id="website" name="website" value={form.website} onChange={handleInputChange} placeholder="https://yourportfolio.com" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">LinkedIn Profile</label>
                <input id="linkedin" name="linkedin" value={form.linkedin} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
