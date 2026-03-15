'use client';

import { useEffect, useState, useRef } from 'react';
import { api, uploadFile, getUser } from '../lib/api';
import { Loader, UploadCloud, Target, Activity, Clock, ChevronRight, Zap, Shield, Check, X } from 'lucide-react';
import Footer from '../components/footer';

interface AtsResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  detailedAnalysis?: string;
  recommendations?: string[];
  diagnostics?: { label: string; score: number }[];
  telemetryLogs?: string[];
  stats?: {
    matchedCount: number;
    missingCount: number;
    totalKeywords: number;
    coverage: number;
    diagnostics?: { label: string; score: number }[];
  };
}

interface HistoryItem {
  id: number;
  createdAt: string;
  matchScore: number;
  summary: string;
  source: string;
  jobDescriptionSnippet: string;
}

// Score → label + colour helpers
function scoreLabel(s: number) {
  if (s >= 85) return { label: 'Exceptional Match', color: '#30D158' };
  if (s >= 70) return { label: 'Strong Match', color: '#0A84FF' };
  if (s >= 50) return { label: 'Moderate Match', color: '#FF9F0A' };
  if (s >= 30) return { label: 'Weak Match', color: '#FF453A' };
  return { label: 'Poor Match', color: '#FF453A' };
}

// SVG circular ring helper
function CircleRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 15.9155;
  const dash = (score / 100) * circumference;
  const { color } = scoreLabel(score);
  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
      <path
        strokeWidth="2"
        stroke="rgba(255,255,255,0.06)"
        fill="none"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path
        strokeWidth="2"
        strokeDasharray={`${dash}, ${circumference}`}
        strokeLinecap="round"
        stroke={color}
        fill="none"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }}
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      />
    </svg>
  );
}

export default function AtsCheckerPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'diagnostics' | 'recommendations'>('analysis');
  const [error, setError] = useState('');
  const [activeTelemetryLine, setActiveTelemetryLine] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const defaultTelemetry = [
    'Initializing match engine...',
    'Extracting JD signal tokens...',
    'Computing Jina semantic vectors...',
    'Performing cosine similarity pass...',
    'Scoring experience & education layers...',
    'Generating final composite score...',
  ];

  // Fetch history
  const refreshHistory = () => {
    const user = getUser();
    if (!user) return;
    api.get(`/api/ats/history/${user.id}?limit=10`)
      .then(data => setHistory(data.history || []))
      .catch(() => {});
  };

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    setHistoryLoading(true);
    api.get(`/api/ats/history/${user.id}?limit=10`)
      .then(data => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleAnalysis = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Both Job Description and Resume are required.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab('analysis');

    let index = 0;
    const interval = setInterval(() => {
      if (index < defaultTelemetry.length) {
        setActiveTelemetryLine(defaultTelemetry[index]);
        index++;
      }
    }, 1400);

    try {
      const user = getUser();
      const endpoint = user ? `/api/ats/evaluate-text/${user.id}` : '/api/ats/evaluate-text';
      const data = await api.post(endpoint, { jobDescription, resumeText });
      clearInterval(interval);
      setResult(data);
      refreshHistory();
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'jd' | 'resume') => {
    setLoading(true);
    setError('');
    setActiveTelemetryLine('Parsing document...');
    try {
      const form = new FormData();
      if (type === 'jd') {
        form.append('file', file);
        const data = await uploadFile('/api/uploads/parse-jd', form);
        if (data.text) setJobDescription(data.text);
      } else {
        form.append('resume', file);
        const data = await uploadFile('/api/resume/parse', form);
        const extracted = data.text || data.metadata?.text || '';
        if (extracted) setResumeText(extracted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document parse failed.');
    } finally {
      setLoading(false);
    }
  };

  const diagnostics = result?.diagnostics || result?.stats?.diagnostics || [];
  const { label: scoreTag, color: scoreColor } = result ? scoreLabel(result.matchScore) : { label: '', color: '#0A84FF' };

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-white dark:text-white selection:bg-[#0A84FF]/30 selection:text-white overflow-x-hidden"
      style={{ fontFamily: 'var(--font-geist-sans, sans-serif)' }}
    >
      {/* ── Background layers (dark mode only) ─────────────────────────────────── */}
      {/* Video behind everything */}
      <div className="fixed inset-0 -z-30 hidden dark:block">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
          <source src="/ats_back.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Dark overlay for light mode legibility */}
      <div className="fixed inset-0 -z-30 dark:hidden bg-slate-50" />
      {/* Grid pattern */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none hidden dark:block"
        style={{
          backgroundSize: '50px 50px',
          backgroundImage:
            'linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
        }}
      />
      {/* Ambient blue orbs — dark only */}
      <div className="fixed inset-0 -z-10 pointer-events-none hidden dark:block">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#0A84FF] opacity-[0.04] blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#38BDF8] opacity-[0.05] blur-[120px]" />
      </div>
      {/* Light mode: subtle blue orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none dark:hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#0A84FF] opacity-[0.04] blur-[140px]" />
      </div>

      {/* ── Page shell ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">

        {/* ── Hero header ──────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/30 mb-4">
              <Zap size={12} className="text-[#38BDF8]" />
              <span style={{ fontFamily: 'var(--font-jetbrains, monospace)' }} className="text-[10px] uppercase tracking-widest font-medium text-[#38BDF8]">
                Hybrid AI Engine · Jina Embeddings + Groq
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-space-grotesk, var(--font-geist-sans, sans-serif))' }} className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Resume Match<br />
              <span className="bg-gradient-to-r from-[#38BDF8] to-[#0A84FF] bg-clip-text text-transparent">Intelligence</span>
            </h1>
            <p className="mt-3 text-sm text-white/50 max-w-md leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
              Semantic similarity + keyword scoring + experience analysis — deterministic match score, not an AI guess.
            </p>
          </div>

          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#0A84FF]/40 hover:bg-white/10 transition-all text-white/60 hover:text-white text-xs font-medium"
            style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
          >
            <Clock size={14} />
            <span className="uppercase tracking-widest">History</span>
            {history.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#0A84FF] text-white text-[10px] font-bold flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Main two-column grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Inputs ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* JD card */}
            <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[1.75rem] overflow-hidden hover:border-white/20 transition-all">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <h2 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-sm font-semibold text-white flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center">
                    <Target size={12} className="text-[#38BDF8]" />
                  </div>
                  Job Description
                </h2>
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium text-white/40 hover:text-white/80 cursor-pointer transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                  <UploadCloud size={12} />
                  Upload
                  <input type="file" accept=".pdf,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'jd')} />
                </label>
              </div>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-52 bg-transparent px-6 py-5 text-sm text-white/80 placeholder:text-white/15 focus:outline-none resize-none leading-relaxed"
                style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: '12.5px' }}
              />
            </div>

            {/* Resume card */}
            <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[1.75rem] overflow-hidden hover:border-white/20 transition-all">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <h2 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-sm font-semibold text-white flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#30D158]/20 border border-[#30D158]/30 flex items-center justify-center">
                    <Shield size={12} className="text-[#30D158]" />
                  </div>
                  Your Resume
                </h2>
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium text-white/40 hover:text-white/80 cursor-pointer transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                  <UploadCloud size={12} />
                  Upload
                  <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')} />
                </label>
              </div>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-52 bg-transparent px-6 py-5 text-sm text-white/80 placeholder:text-white/15 focus:outline-none resize-none leading-relaxed"
                style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: '12.5px' }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-5 py-3.5 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/30 text-[#FF453A] text-sm font-medium" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                <Shield size={12} className="text-[#0A84FF]/60" />
                Jina embeddings · Groq analysis
              </p>
              <button
                onClick={handleAnalysis}
                disabled={loading || !jobDescription.trim() || !resumeText.trim()}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-space-grotesk, sans-serif)',
                  background: 'linear-gradient(135deg, #0A84FF, #38BDF8)',
                  boxShadow: '0 0 24px -4px rgba(10,132,255,0.5)',
                }}
              >
                <Activity size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Analyzing...' : 'Compute Match'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Results ──────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Score card */}
            <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[1.75rem] p-8 relative overflow-hidden hover:border-white/20 transition-all">
              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#0A84FF]/30 rounded-tl-md" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#0A84FF]/30 rounded-br-md" />
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#0A84FF] opacity-10 blur-[80px] -mr-16 -mt-16 pointer-events-none" />

              {loading ? (
                <div className="flex flex-col items-center justify-center h-52 space-y-5">
                  <Loader size={44} className="text-[#38BDF8] animate-spin" />
                  <p className="text-sm text-white/50 animate-pulse tracking-wide" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                    {activeTelemetryLine}
                  </p>
                </div>
              ) : result ? (
                <div className="flex items-center gap-8">
                  {/* Ring */}
                  <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                    <CircleRing score={result.matchScore} />
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                        {result.matchScore}
                        <span className="text-xl" style={{ color: scoreColor }}>%</span>
                      </span>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="flex-1">
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold mb-3 border"
                      style={{
                        fontFamily: 'var(--font-jetbrains, monospace)',
                        color: scoreColor,
                        borderColor: `${scoreColor}40`,
                        background: `${scoreColor}12`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: scoreColor }} />
                      {scoreTag}
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: '11.5px' }}>
                      {result.summary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center mb-4">
                    <Target size={28} className="text-[#38BDF8]" />
                  </div>
                  <p className="text-white/50 text-sm font-semibold" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>Engine Ready</p>
                  <p className="text-white/25 text-xs mt-1 max-w-xs" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                    Load both blocks and compute to see your match intelligence report.
                  </p>
                </div>
              )}
            </div>

            {/* Analysis tabs card */}
            {result && (
              <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[1.75rem] overflow-hidden flex-1 flex flex-col hover:border-white/20 transition-all">
                {/* Tabs */}
                <div className="flex border-b border-white/[0.08] bg-black/20">
                  {(['analysis', 'diagnostics', 'recommendations'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 py-3.5 text-[10px] uppercase tracking-widest font-medium transition-all"
                      style={{
                        fontFamily: 'var(--font-jetbrains, monospace)',
                        color: activeTab === tab ? '#38BDF8' : 'rgba(255,255,255,0.35)',
                        borderBottom: activeTab === tab ? '2px solid #0A84FF' : '2px solid transparent',
                        background: activeTab === tab ? 'rgba(10,132,255,0.05)' : 'transparent',
                      }}
                    >
                      {tab === 'analysis' ? 'Data Points' : tab === 'diagnostics' ? 'Diagnostics' : 'Advice'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6" style={{ maxHeight: '480px' }}>

                  {/* ── ANALYSIS TAB ── */}
                  {activeTab === 'analysis' && (
                    <>
                      {/* Missing */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] uppercase tracking-widest font-medium text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] animate-pulse shadow-[0_0_8px_rgba(255,69,58,0.8)]" />
                            Missing Signals
                          </h4>
                          <span className="text-[10px] text-white/30 font-medium" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            {result.missingKeywords.length} blocks
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {result.missingKeywords.slice(0, 8).map(kw => (
                            <div key={kw} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#FF453A]/15 bg-[#FF453A]/[0.04] hover:border-[#FF453A]/35 hover:bg-[#FF453A]/10 transition-all group">
                              <X size={14} className="text-[#FF453A] flex-shrink-0" />
                              <span className="text-xs font-medium text-white/80" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{kw}</span>
                            </div>
                          ))}
                          {result.missingKeywords.length === 0 && (
                            <p className="text-xs text-white/30 italic" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>None — great coverage!</p>
                          )}
                        </div>
                      </div>

                      {/* Matched */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] uppercase tracking-widest font-medium text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.8)]" />
                            Verified Signals
                          </h4>
                          <span className="text-[10px] text-white/30 font-medium" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            {result.matchedKeywords.length} blocks
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.matchedKeywords.slice(0, 20).map(kw => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border border-[#0A84FF]/20 bg-[#0A84FF]/[0.06] text-[#38BDF8] hover:border-[#0A84FF]/50 hover:shadow-[0_0_12px_rgba(10,132,255,0.15)] transition-all cursor-default"
                              style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
                            >
                              <Check size={10} />
                              {kw}
                            </span>
                          ))}
                          {result.matchedKeywords.length === 0 && (
                            <p className="text-xs text-white/30 italic" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>No keyword matches found.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── DIAGNOSTICS TAB ── */}
                  {activeTab === 'diagnostics' && (
                    <div className="space-y-5">
                      <p className="text-xs text-white/50 leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                        {result.detailedAnalysis || result.summary}
                      </p>
                      {diagnostics.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                          {diagnostics.map(d => {
                            const c = d.score >= 70 ? '#30D158' : d.score >= 50 ? '#FF9F0A' : '#FF453A';
                            return (
                              <div key={d.label}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] uppercase tracking-widest text-white/50" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{d.label}</span>
                                  <span className="text-sm font-black" style={{ color: c, fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>{d.score}</span>
                                </div>
                                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.score}%`, background: c, boxShadow: `0 0 8px ${c}` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── RECOMMENDATIONS TAB ── */}
                  {activeTab === 'recommendations' && (
                    <div className="space-y-3">
                      {(result.recommendations || []).map((rec, i) => (
                        <div key={i} className="flex gap-3 p-4 rounded-2xl border border-[#0A84FF]/15 bg-[#0A84FF]/[0.04]">
                          <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-[#0A84FF]/20 border border-[#0A84FF]/30 text-[#38BDF8] text-[10px] font-bold flex items-center justify-center" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-white/70 leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{rec}</p>
                        </div>
                      ))}
                      {(!result.recommendations || result.recommendations.length === 0) && (
                        <p className="text-xs text-white/30 italic" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>No recommendations — strong match!</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── History panel ─────────────────────────────────────────── */}
        {(showHistory || history.length > 0) && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Clock size={20} className="text-white/50" />
              <h2 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-xl font-bold text-white tracking-tight">
                Analysis History
              </h2>
            </div>

            {historyLoading ? (
              <div className="flex items-center gap-3 text-white/30">
                <Loader size={16} className="animate-spin" />
                <span className="text-xs" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>Loading...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] rounded-[1.75rem] p-12 text-center">
                <Clock size={36} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>No previous analyses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {history.map(item => {
                  const { color } = scoreLabel(item.matchScore);
                  const d = new Date(item.createdAt);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={item.id}
                      onClick={() => setJobDescription(item.jobDescriptionSnippet)}
                      className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] rounded-[1.5rem] p-5 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all group flex flex-col justify-between"
                      style={{ borderColor: `${color}20` }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-4xl font-black tracking-tighter" style={{ color, fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                            {item.matchScore}<span className="text-lg text-white/20">%</span>
                          </span>
                          <div className="text-right">
                            <div className="text-[10px] font-medium text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{dateStr}</div>
                            <div className="text-[10px] text-white/25 mt-0.5" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{timeStr}</div>
                          </div>
                        </div>
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>{item.summary}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-4 text-[10px] text-white/25 group-hover:text-[#38BDF8] transition-colors uppercase tracking-widest font-medium" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                        Load JD <ChevronRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
