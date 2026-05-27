'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, API_BASE_URL, getUser, isApiError } from '@/app/lib/api';
import { useToast } from '@/app/components/ToastProvider';
import { FileText, UploadCloud, Target, BrainCircuit, Loader2, CheckCircle2, X, Briefcase } from 'lucide-react';

export default function RecruiterAIParser() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<{ id: number; title: string; status: string }[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const user = getUser();
      if (!user) { router.push('/login'); return; }
      
      const res = await api.get(`/api/jobs/recruiter?recruiterId=${user.id}`);
      const jobList = Array.isArray(res) ? res : (res.jobs || []);
      // Only approved jobs or all jobs? Let's show all
      setJobs(jobList);
      if (jobList.length > 0) setSelectedJob(jobList[0].id);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        toast({ type: 'error', title: 'Session expired', message: 'Please log in again.' });
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type === 'application/pdf') {
        setFile(f);
      } else {
        toast({ type: 'error', title: 'Invalid File', message: 'Please upload a PDF file.' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({ type: 'error', title: 'No File', message: 'Please select a resume PDF first.' });
      return;
    }
    if (!selectedJob) {
      toast({ type: 'error', title: 'No Job Selected', message: 'Please select a job role to match against.' });
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);

      // We use base fetch here to handle FormData easily without JSON stringify
      const res = await fetch(`${API_BASE_URL}/api/resume/match/${selectedJob}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      
      setResult(data);
      toast({ type: 'success', title: 'Analysis Complete', message: 'Resume matched successfully!' });
    } catch (error: any) {
      toast({ type: 'error', title: 'Analysis Failed', message: error.message });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <main className="r-main">
      <div className="max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={32} />
            Standalone AI Parser
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            Have a resume from an external source? Upload it here to instantly parse and score it against any of your open jobs using Jobie's ATS API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Uploader Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-gray-400" /> Target Job Role
              </h2>
              {loading ? (
                <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
              ) : jobs.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-200 dark:border-amber-800">
                  You need to create a job first before you can match resumes.
                </div>
              ) : (
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="" disabled>Select a target role...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.status})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UploadCloud size={20} className="text-gray-400" /> Upload Resume PDF
              </h2>
              
              <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 
                  file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 
                  'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                      <FileText size={32} />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-4 transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF documents only</p>
                  </div>
                )}
              </div>

              <button
                disabled={!file || !selectedJob || analyzing}
                onClick={handleAnalyze}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {analyzing ? (
                  <><Loader2 className="animate-spin" size={20} /> Analyzing Deep Structure...</>
                ) : (
                  <><BrainCircuit size={20} /> Run AI Analysis</>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:h-[600px]">
            {analyzing ? (
              <div className="h-full bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <BrainCircuit size={64} className="text-indigo-400 dark:text-indigo-600 mb-6 animate-bounce" />
                <h3 className="text-xl font-bold mb-2">Extracting Semantic Features</h3>
                <p className="text-gray-500">The Jobie AI engine is mapping resume capabilities against the required skills array...</p>
              </div>
            ) : result ? (
              <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 text-white relative">
                  <h3 className="text-lg font-bold opacity-80 uppercase tracking-widest text-xs mb-1">Overall Match</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black">{result.matchPercentage}%</span>
                  </div>
                  <p className="mt-3 text-indigo-200 font-medium">{result.message}</p>
                  <Target className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20" size={80} />
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  {/* Core Skills Match */}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                       Core Skills Match
                    </h4>
                    
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> Matched</p>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedSkills?.length ? result.matchedSkills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-800 text-xs font-semibold">{s}</span>
                        )) : <span className="text-sm text-gray-400">None</span>}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><X size={12} className="text-red-500"/> Missing</p>
                      <div className="flex flex-wrap gap-2">
                        {result.missingSkills?.length ? result.missingSkills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded border border-red-100 dark:border-red-800 text-xs font-semibold">{s}</span>
                        )) : <span className="text-sm text-gray-400">Perfect Match!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack Match */}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                       Tech Stack Match
                    </h4>
                    
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> Matched</p>
                      <div className="flex flex-wrap gap-2">
                        {result.techMatched?.length ? result.techMatched.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-800 text-xs font-semibold">{s}</span>
                        )) : <span className="text-sm text-gray-400">None</span>}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><X size={12} className="text-red-500"/> Missing</p>
                      <div className="flex flex-wrap gap-2">
                        {result.techMissing?.length ? result.techMissing.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded border border-amber-100 dark:border-amber-800 text-xs font-semibold">{s}</span>
                        )) : <span className="text-sm text-gray-400">Perfect Match!</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-600 border-dashed">
                <BrainCircuit size={48} className="mb-4 opacity-50" />
                <p>Upload a resume and click analyze to see the AI breakdown here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
