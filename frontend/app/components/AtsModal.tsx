'use client';

import { useState } from 'react';
import { api, getUser, uploadFile } from '../lib/api';
import { Loader, Target, UploadCloud, Activity } from 'lucide-react';

interface AtsModalProps {
  onClose: () => void;
}

interface AtsResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  detailedAnalysis?: string;
}

export default function AtsModal({ onClose }: AtsModalProps) {
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jd, setJd] = useState('');
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [fileName, setFileName] = useState('');
  const [telemetry, setTelemetry] = useState('Initializing...');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLoading(true);
      setError(null);
      setTelemetry('Scanning file...');
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await uploadFile('/api/uploads/parse-jd', formData);
        setJd(response.text || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.');
        setJd('');
        setFileName('');
      } finally {
        setLoading(false);
      }
    }
  };

  const analyse = async () => {
    const user = getUser();
    if (!user) {
      setError('You must be logged in to perform this analysis.');
      return;
    }
    if (!jd) {
      setError('Please provide a Job Description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    const msgs = ['Extracting keywords...', 'Correlating candidate profile...', 'Generating analysis...'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < msgs.length) {
        setTelemetry(msgs[i]);
        i++;
      }
    }, 1000);

    try {
      const data = await api.post(`/api/ats/evaluate-text/${user.id}`, { jobDescription: jd });
      clearInterval(interval);
      setResult(data);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white/10 backdrop-blur-3xl border border-white/30 text-white w-full max-w-2xl rounded-[2.5rem] p-8 m-4 shadow-2xl relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Quick ATS Check</h2>
          <p className="text-sm text-white/70 mt-2 font-medium">Evaluate your match against a new Job Description</p>
        </div>

        {!result && (
          <div className="space-y-6 relative z-10">
            <div className="flex justify-center gap-4 mb-4 text-sm font-semibold">
              <button 
                onClick={() => setInputType('text')} 
                className={`px-6 py-2.5 rounded-full transition-all tracking-wide ${inputType === 'text' ? 'bg-[#0A84FF] text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'}`}
              >
                Paste Text
              </button>
              <button 
                onClick={() => setInputType('file')} 
                className={`px-6 py-2.5 rounded-full transition-all tracking-wide ${inputType === 'file' ? 'bg-[#0A84FF] text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'}`}
              >
                Upload File
              </button>
            </div>

            {inputType === 'text' ? (
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-40 p-5 bg-black/10 border border-white/20 rounded-2xl text-base leading-relaxed focus:ring-2 focus:ring-[#0A84FF]/50 focus:bg-black/20 focus:border-transparent resize-none placeholder:text-white/50 text-white font-medium transition-all"
              />
            ) : (
              <div className="flex items-center justify-center w-full">
                <label htmlFor="modal-file-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-white/20 border-dashed rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-white" />
                    <p className="mb-2 text-sm text-white font-medium tracking-wide">Click to upload file</p>
                    <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">PDF / DOCX</p>
                  </div>
                  <input id="modal-file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
                </label>
              </div>
            )}
            
            {fileName && <p className="text-sm font-medium text-center text-[#30D158]">File Loaded: {fileName}</p>}
            
            <button 
              onClick={analyse} 
              disabled={loading} 
              className="w-full bg-[#0A84FF] text-white hover:bg-[#007AFF] text-lg font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg tracking-wide group"
            >
              {loading ? <Activity size={20} className="animate-spin" /> : <Target size={20} className="group-hover:scale-110 transition-transform" />}
              {loading ? 'Analyzing...' : 'Analyze Match'}
            </button>
          </div>
        )}

        {loading && !result && (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader size={48} className="text-white animate-spin" />
            <div className="text-base font-medium text-white tracking-wide animate-pulse drop-shadow-md">
              {telemetry}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-[#FF453A] bg-[#FF453A]/10 p-4 rounded-xl my-4 border border-[#FF453A]/30 font-medium backdrop-blur-md">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300 relative z-10">
            <div className="flex justify-between items-center border-b border-white/20 pb-4">
              <div>
                <div className="text-xs text-white/80 mb-1 font-bold uppercase tracking-widest">Match Score</div>
                <div className="text-6xl font-black text-white tracking-tighter">
                  {result.matchScore}<span className="text-3xl text-white/50">%</span>
                </div>
              </div>
            </div>
            
            <p className="text-base font-medium text-white/90 leading-relaxed bg-white/10 border-l-4 border-[#0A84FF] pl-4 py-3 rounded-r-xl backdrop-blur-md">
              {result.detailedAnalysis || result.summary}
            </p>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md">
                 <h3 className="text-xs font-bold text-white/80 mb-3 uppercase tracking-wider">Matched</h3>
                 <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords.length > 0 ? result.matchedKeywords.slice(0, 5).map(k => (
                      <span key={k} className="px-3 py-1 bg-white/20 text-white border border-white/30 rounded text-xs font-semibold">{k}</span>
                    )) : <span className="text-xs text-white/50 italic">None</span>}
                  </div>
               </div>
               
               <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md">
                 <h3 className="text-xs font-bold text-white/80 mb-3 uppercase tracking-wider">Missing</h3>
                 <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.length > 0 ? result.missingKeywords.slice(0, 5).map(k => (
                      <span key={k} className="px-3 py-1 bg-black/20 text-white/80 border border-white/10 rounded text-xs font-semibold">{k}</span>
                    )) : <span className="text-xs text-white/50 italic">None</span>}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
