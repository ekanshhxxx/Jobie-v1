'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, getUser } from '../lib/api';

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string[];
  techStack: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  recruiterId: number;
};

type NewJob = {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string;
  techStack: string;
  experienceLevel: string;
};

const levelColors: { [key: string]: string } = {
  junior: 'bg-green-100 text-green-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [search, setSearch] = useState('');
  const [newJob, setNewJob] = useState<NewJob>({
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requiredSkills: '',
    techStack: '',
    experienceLevel: 'mid',
  });

  useEffect(() => {
    setUser(getUser());
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.get('/api/jobs');
      setJobs(data.jobs ?? data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const postJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getUser();
    setMessage(null);
    try {
      await api.post('/api/jobs', {
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        techStack: newJob.techStack.split(',').map(s => s.trim()).filter(Boolean),
        recruiterId: u?.id,
        status: 'pending',
      });
      setShowPostForm(false);
      setNewJob({ title: '', company: '', location: '', salary: '', description: '', requiredSkills: '', techStack: '', experienceLevel: 'mid' });
      setMessage({ text: '✅ Job posted!', ok: true });
      loadJobs();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to post job', ok: false });
    }
  };

  const filtered = jobs.filter(j =>
    !search || `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">{jobs.length} open positions</p>
        </div>
        {user?.role === 'recruiter' && (
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Post a Job
          </button>
        )}
      </div>

      {/* Search */}
      <input
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Search by title, company, location..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Message */}
      {message && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-lg ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {/* Post Job Form */}
      {showPostForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Post a New Job</h2>
          <form onSubmit={postJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { k: 'title', label: 'Job Title', placeholder: 'e.g. Senior React Developer' },
              { k: 'company', label: 'Company', placeholder: 'e.g. Acme Corp' },
              { k: 'location', label: 'Location', placeholder: 'e.g. Remote, New York' },
              { k: 'salary', label: 'Salary', placeholder: 'e.g. $80k – $120k' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={(newJob as Record<string, string>)[f.k]}
                  onChange={e => setNewJob({ ...newJob, [f.k]: e.target.value })}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Job description..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Required Skills <span className="text-gray-400">(comma-separated)</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newJob.requiredSkills}
                onChange={e => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                placeholder="React, Node.js, TypeScript"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tech Stack <span className="text-gray-400">(comma-separated)</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newJob.techStack}
                onChange={e => setNewJob({ ...newJob, techStack: e.target.value })}
                placeholder="PostgreSQL, Docker, AWS"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience Level</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newJob.experienceLevel}
                onChange={e => setNewJob({ ...newJob, experienceLevel: e.target.value })}
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Post Job
              </button>
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="text-gray-500 text-sm px-4 py-2 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? 'No jobs match your search' : 'No jobs posted yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <Link href={`/jobs/${job.id}`} key={job.id} className="block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[job.experienceLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {job.experienceLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {job.company}
                    {job.location && ` · ${job.location}`}
                    {job.salary && ` · ${job.salary}`}
                  </p>
                </div>
                <ChevronRight className="text-gray-400 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
