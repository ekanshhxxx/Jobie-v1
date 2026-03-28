'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getUser, API_BASE_URL, isApiError } from '../../lib/api';
import { User, Profile } from '../../components/types';
import ProfileHeader from '../../components/ProfileHeader';
import SkillGraph from '../../components/SkillGraph';
import GitHubDeepCard from '../../components/GitHubDeepCard';
import ResumeReportCard from '../../components/ResumeReportCard';
import { Briefcase, GraduationCap, Code, Share2, FileText, Edit3, Star, ArrowRight } from 'lucide-react';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [viewer, setViewer] = useState<ReturnType<typeof getUser>>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    const raw = params?.userId;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const id = Number(val);
    return Number.isFinite(id) ? id : null;
  }, [params]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setViewer(u);
  }, [router]);

  useEffect(() => {
    if (!viewer || !userId) return;
    const load = async () => {
      try {
        const data = await api.get(`/api/profile/view/${userId}`);
        setUser(data.user ?? null);
        setProfile(data.profile ?? null);
      } catch (err: unknown) {
        // Missing/invalid profile route should render the "Profile not found" state silently.
        if (isApiError(err) && err.status === 404) {
          setUser(null);
          setProfile(null);
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewer, userId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900">Loading profile...</div>;
  }

  if (!user || !profile) {
    return <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900">Profile not found</div>;
  }

  const resumeHref = profile.resumeUrl
    ? (profile.resumeUrl.startsWith('http') ? profile.resumeUrl : `${API_BASE_URL}${profile.resumeUrl}`)
    : '';
  const canEdit = viewer?.id === user.id;
  const openResume = () => {
    if (!resumeHref) return;
    window.open(resumeHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProfileHeader user={user} profile={profile} editHref={canEdit ? '/profile/edit' : undefined} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="flex flex-col space-y-3">
                <button
                  type="button"
                  onClick={openResume}
                  disabled={!resumeHref}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-colors ${resumeHref ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  <FileText size={18} /><span>View Resume</span>
                </button>
                <button onClick={async () => await navigator.clipboard.writeText(window.location.href)} className="flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Share2 size={18} /><span>Share Profile</span>
                </button>
                {canEdit && (
                  <button onClick={() => router.push('/profile/edit')} className="flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                    <Edit3 size={18} /><span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Star size={20} className="text-yellow-400" /> Skill Radar</h3>
              <SkillGraph profile={profile} />
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            </div>

            {profile.githubDeepScan && <GitHubDeepCard scan={profile.githubDeepScan} />}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            {profile.resumeReport && <ResumeReportCard report={profile.resumeReport} />}

            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{profile.bio}</p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Briefcase size={22} /> Experience</h3>
              <div className="relative border-l-2 border-blue-200 dark:border-blue-800/50 space-y-8 pl-6">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[33px] top-1.5 w-4 h-4 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                    <p className="font-semibold text-gray-800 dark:text-white text-lg">{exp.title || exp.role}</p>
                    <p className="text-md text-gray-600 dark:text-gray-300">{exp.company}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{exp.duration || exp.years}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><GraduationCap size={22} /> Education</h3>
              <div className="relative border-l-2 border-green-200 dark:border-green-800/50 space-y-8 pl-6">
                {profile.education.map((edu, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[33px] top-1.5 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                    <p className="font-semibold text-gray-800 dark:text-white text-lg">{edu.degree}</p>
                    <p className="text-md text-gray-600 dark:text-gray-300">{edu.school || edu.institution}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{edu.years}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Code size={22} /> Projects</h3>
              <div className="space-y-6">
                {profile.projects.map((proj, index) => (
                  <div key={index} className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800 dark:text-white text-lg">{proj.name}</p>
                      {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium">View Project <ArrowRight size={14} /></a>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{proj.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {proj.tech?.map(t => (
                        <span key={t} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-2 py-1 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
