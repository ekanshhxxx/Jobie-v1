'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import { Briefcase, MapPin, DollarSign, Brain, Code, UserCheck, ShieldCheck, FileText, Loader } from 'lucide-react';
import AtsModal from '../../components/AtsModal';

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
};

const levelColors: { [key: string]: string } = {
  junior: 'bg-green-100 text-green-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
};

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showAtsModal, setShowAtsModal] = useState(false);

  const jobId = params.jobId as string;

  useEffect(() => {
    if (!jobId) return;
    const loadJob = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/jobs/${jobId}`);
        setJob(data.job);
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Failed to load job details.', ok: false });
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [jobId]);

  const apply = async () => {
    const user = getUser();
    if (!user) {
      setMessage({ text: 'Please log in to apply.', ok: false });
      return;
    }
    setApplying(true);
    setMessage(null);
    try {
      await api.post('/api/applications/apply', { jobId: job?.id, userId: user.id });
      setMessage({ text: 'Application submitted successfully!', ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to apply', ok: false });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>;
  }

  if (!job) {
    return <div className="text-center py-20 text-gray-500">Job not found.</div>;
  }

  return (
    <>
      {showAtsModal && <AtsModal jobId={job.id} onClose={() => setShowAtsModal(false)} />}
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg mb-8">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${levelColors[job.experienceLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {job.experienceLevel}
                </span>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-3">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400 mt-2">
                  <div className="flex items-center gap-2"><Briefcase size={16} /> {job.company}</div>
                  <div className="flex items-center gap-2"><MapPin size={16} /> {job.location}</div>
                  {job.salary && <div className="flex items-center gap-2"><DollarSign size={16} /> {job.salary}</div>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={apply}
                  disabled={applying}
                  className="flex items-center justify-center gap-2 w-40 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {applying ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
                <button
                  onClick={() => setShowAtsModal(true)}
                  className="flex items-center justify-center gap-2 w-40 bg-gray-700 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  <ShieldCheck size={16} />
                  ATS Analysis
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-6 flex items-center gap-3 text-sm px-4 py-3 rounded-lg ${message.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* Details */}
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Job Description</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <p>{job.description}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Brain size={18} /> Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(skill => (
                  <span key={skill} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Code size={18} /> Technology Stack</h3>
              <div className="flex flex-wrap gap-2">
                {job.techStack.map(tech => (
                  <span key={tech} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1 rounded-full">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
