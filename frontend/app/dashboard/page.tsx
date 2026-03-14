'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../lib/api';

type Job = { id: number; title: string; company: string; location: string; experienceLevel: string };
type Application = { id: number; jobId: number; status: string; createdAt: string };
type Profile = { profileCompleteness: number; githubVerifiedSkills: { skill: string; confidence: number }[] };
type User = { id: number; name: string; role: string };

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-2xl p-5 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-70 font-medium">{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    loadData(u);
  }, [router]);

  const loadData = async (u: User) => {
    try {
      const jobsData = await api.get('/api/jobs');
      setJobs(jobsData.jobs ?? jobsData);

      if (u.role === 'candidate') {
        const [appsData] = await Promise.all([
          api.get(`/api/applications/user/${u.id}`),
        ]);
        setApplications(appsData.applications ?? appsData);

        try {
          const profileData = await api.get(`/api/profile/${u.id}`);
          setProfile(profileData.profile ?? profileData);
        } catch {
          // no profile yet — that's fine
        }
      } else {
        try {
          const appsData = await api.get(`/api/applications/user/${u.id}`);
          setApplications(appsData.applications ?? appsData);
        } catch {
          setApplications([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hey, {user?.name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s your overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {user?.role === 'candidate' ? (
          <>
            <StatCard title="Profile %" value={`${profile?.profileCompleteness ?? 0}%`} color="indigo" />
            <StatCard title="GitHub Skills" value={profile?.githubVerifiedSkills?.length ?? 0} color="green" />
            <StatCard title="Applications" value={applications.length} color="blue" />
            <StatCard title="Open Jobs" value={jobs.length} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Open Jobs" value={jobs.length} color="indigo" />
            <StatCard title="Total Applications" value={applications.length} color="blue" />
          </>
        )}
      </div>

      {/* GitHub banner for unverified candidates */}
      {user?.role === 'candidate' && !profile?.githubVerifiedSkills?.length && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-indigo-800 font-semibold">🐙 Verify your GitHub</p>
            <p className="text-indigo-600 text-sm mt-0.5">
              Boost your profile completeness and match score
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            Go to Profile
          </Link>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Latest Jobs</h2>
            <Link href="/jobs" className="text-indigo-600 text-sm hover:underline">
              See all
            </Link>
          </div>
          {jobs.length === 0 ? (
            <p className="text-gray-400 text-sm">No jobs found</p>
          ) : (
            <ul className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <li key={job.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{job.title}</p>
                    <p className="text-xs text-gray-500">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {job.experienceLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Applications */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            {user?.role === 'candidate' ? 'My Applications' : 'Recent Applications'}
          </h2>
          {applications.length === 0 ? (
            <div>
              <p className="text-gray-400 text-sm mb-3">No applications yet</p>
              {user?.role === 'candidate' && (
                <Link href="/jobs" className="text-sm text-indigo-600 hover:underline">
                  Browse jobs →
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <li key={app.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Job #{app.jobId}</p>
                    <p className="text-xs text-gray-500">{app.createdAt?.slice(0, 10)}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      {user?.role === 'candidate' && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/profile/edit', label: '👤 Edit Profile', desc: 'Update your info & verify GitHub' },
            { href: '/resume', label: '🤖 Parse Resume', desc: 'AI-powered resume analysis' },
            { href: '/jobs', label: '💼 Browse Jobs', desc: 'Find your next opportunity' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">{link.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
