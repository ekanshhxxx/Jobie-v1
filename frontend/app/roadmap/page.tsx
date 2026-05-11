'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, ArrowLeft, Star, ExternalLink, CheckCircle2, Circle,
  BookOpen, Youtube, FileText, Code2, Terminal, Loader,
  ChevronDown, ChevronUp, Github, Clock, X
} from 'lucide-react';
import Footer from '../components/footer';
import { api, getUser } from '../lib/api';

interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'docs' | 'practice';
}

interface Phase {
  week: string;
  title: string;
  focus: string;
  skills: string[];
  highlightedSkills: string[];
  tasks: string[];
  resources: Resource[];
}

interface WowProject {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  githubUrl?: string;
  stars?: number;
  techStack: string[];
}

interface Roadmap {
  jobRole: string;
  title: string;
  summary: string;
  estimatedWeeks: number;
  phases: Phase[];
  projects: WowProject[];
}

interface SavedRoadmapItem {
  id: number;
  createdAt: string;
  jobRole: string;
  matchScore: number;
  roadmapData: Roadmap;
}

const resourceIcon = (type: string) => {
  switch (type) {
    case 'video': return <Youtube size={13} className="text-[#FF453A]" />;
    case 'docs': return <FileText size={13} className="text-[#38BDF8]" />;
    case 'course': return <BookOpen size={13} className="text-[#30D158]" />;
    case 'practice': return <Terminal size={13} className="text-[#FF9F0A]" />;
    default: return <Code2 size={13} className="text-white/50" />;
  }
};

const difficultyColor = (d: string) => {
  if (d === 'beginner') return { color: '#30D158', bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.25)' };
  if (d === 'intermediate') return { color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)', border: 'rgba(255,159,10,0.25)' };
  return { color: '#FF453A', bg: 'rgba(255,69,58,0.1)', border: 'rgba(255,69,58,0.25)' };
};

export default function RoadmapPage() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPhase, setExpandedPhase] = useState<number>(0);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [loadingMsg, setLoadingMsg] = useState('Detecting your target role...');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedRoadmapItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadingSteps = [
    'Detecting your target role...',
    'Consulting roadmap.sh for the industry standard...',
    'Fetching trending GitHub projects for inspiration...',
    'Generating your personalized phase plan...',
    'Polishing your roadmap...',
  ];

  useEffect(() => {
    // Restore checkbox state from localStorage
    const saved = localStorage.getItem('roadmap_progress');
    if (saved) setCheckedTasks(new Set(JSON.parse(saved)));

    generateRoadmap();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const user = getUser();
      if (!user) return;
      const data = await api.get(`/api/roadmap/saved/${user.id}`);
      setHistory((data.roadmaps || []) as SavedRoadmapItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && history.length === 0) {
      loadHistory();
    }
  }, [showHistory]);

  const generateRoadmap = async () => {
    const jd = sessionStorage.getItem('roadmap_jd');
    const missing = JSON.parse(sessionStorage.getItem('roadmap_missing') || '[]');
    const score = Number(sessionStorage.getItem('roadmap_score') || '0');

    if (!jd) {
      setError('No job description found. Go back and run an ATS check first.');
      setLoading(false);
      return;
    }

    // Cycle loading messages
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingSteps.length;
      setLoadingMsg(loadingSteps[msgIndex]);
    }, 2000);

    try {
      const user = getUser();
      const data = await api.post('/api/ats/roadmap/generate', {
        jobDescription: jd,
        missingSkills: missing,
        matchScore: score,
        userId: user?.id,
      });
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const updated = new Set(checkedTasks);
    if (updated.has(taskId)) updated.delete(taskId);
    else updated.add(taskId);
    setCheckedTasks(updated);
    localStorage.setItem('roadmap_progress', JSON.stringify([...updated]));
  };

  const totalTasks = roadmap?.phases.reduce((sum, p) => sum + p.tasks.length, 0) || 0;
  const completedTasks = checkedTasks.size;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ fontFamily: 'var(--font-geist-sans, sans-serif)', background: '#030306' }}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030306] via-[#050810] to-[#030306]" />
      </div>
      <div className="fixed inset-0 -z-20 pointer-events-none" style={{
        backgroundSize: '50px 50px',
        backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.02) 1px,transparent 1px)',
      }} />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#0A84FF] opacity-[0.04] blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#38BDF8] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-12 lg:py-20">

        {/* Header navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/resume')}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm"
            style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
          >
            <ArrowLeft size={15} />
            Back to ATS Checker
          </button>
          
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#0A84FF]/40 hover:bg-[#0A84FF]/10 transition-all text-white/60 hover:text-white text-xs font-medium group"
            style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
          >
            <Clock size={14} className="group-hover:text-[#38BDF8]" />
            <span className="uppercase tracking-widest leading-none mt-0.5">Saved Plans</span>
          </button>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-80 text-center space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-[#0A84FF]/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-[#38BDF8] animate-spin" />
              <div className="absolute inset-3 rounded-full bg-[#0A84FF]/10 flex items-center justify-center">
                <Zap size={24} className="text-[#38BDF8]" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                Building Your Roadmap
              </p>
              <p className="text-white/40 text-sm animate-pulse" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                {loadingMsg}
              </p>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="p-6 rounded-2xl border border-[#FF453A]/30 bg-[#FF453A]/10 text-[#FF453A] text-sm" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
            {error}
          </div>
        )}

        {/* ── Roadmap content ── */}
        {roadmap && !loading && (
          <div className="space-y-14">

            {/* Hero header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-medium border"
                  style={{ fontFamily: 'var(--font-jetbrains, monospace)', color: '#38BDF8', borderColor: 'rgba(10,132,255,0.3)', background: 'rgba(10,132,255,0.1)' }}
                >
                  <Zap size={10} />
                  {roadmap.jobRole}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                  · {roadmap.estimatedWeeks} weeks
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {roadmap.title}
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-2xl" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                {roadmap.summary}
              </p>
            </div>

            {/* Progress bar */}
            <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/60 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                  Your Progress
                </span>
                <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)', color: progress > 0 ? '#30D158' : 'rgba(255,255,255,0.3)' }}>
                  {completedTasks}/{totalTasks} tasks · {progress}%
                </span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0A84FF, #30D158)', boxShadow: '0 0 10px rgba(10,132,255,0.4)' }}
                />
              </div>
            </div>

            {/* Phase Timeline */}
            <div className="space-y-6">
              <h2 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-2xl font-bold text-white tracking-tight">
                Learning Path
              </h2>
              {roadmap.phases.map((phase, i) => {
                const isOpen = expandedPhase === i;
                const phaseChecked = phase.tasks.filter(t => checkedTasks.has(`${i}-${t}`)).length;
                return (
                  <div
                    key={i}
                    className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.07] rounded-3xl overflow-hidden hover:border-white/15 transition-all mb-6"
                    style={{ borderLeft: '4px solid rgba(10,132,255,0.4)', padding: '4px' }}
                  >
                    {/* Phase header */}
                    <button
                      onClick={() => setExpandedPhase(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between p-6 sm:p-8 text-left rounded-2xl hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            fontFamily: 'var(--font-space-grotesk, sans-serif)',
                            background: 'rgba(10,132,255,0.15)',
                            border: '1px solid rgba(10,132,255,0.3)',
                            color: '#38BDF8',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest font-medium text-[#38BDF8]/70" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                              {phase.week}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-white mt-1" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                            {phase.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs text-white/40 font-medium" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                          {phaseChecked}/{phase.tasks.length}
                        </span>
                        {isOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                      </div>
                    </button>

                    {/* Phase body */}
                    {isOpen && (
                      <div className="px-8 sm:px-12 pb-10 space-y-10 border-t border-white/[0.05] mt-2">
                        <p className="text-sm text-white/60 pt-8 leading-relaxed max-w-3xl" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                          {phase.focus}
                        </p>

                        {/* Skill chips */}
                        <div className="flex flex-wrap gap-2.5">
                          {phase.skills.map(skill => (
                              <span
                                key={skill}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border"
                                style={{
                                  fontFamily: 'var(--font-jetbrains, monospace)',
                                  color: '#38BDF8',
                                  borderColor: 'rgba(10,132,255,0.25)',
                                  background: 'rgba(10,132,255,0.06)',
                                }}
                              >
                                {skill}
                              </span>
                          ))}
                        </div>

                        {/* Tasks checklist */}
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-widest text-[#0A84FF] font-black" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            Your Action Plan
                          </p>
                          <div className="space-y-1.5">
                            {phase.tasks.map((task, ti) => {
                              const taskId = `${i}-${task}`;
                              const done = checkedTasks.has(taskId);
                            return (
                                <button
                                  key={ti}
                                  onClick={() => toggleTask(taskId)}
                                  className="w-full flex items-start gap-4 text-left p-4 rounded-xl hover:bg-white/[0.04] transition-all group border border-transparent hover:border-white/[0.05]"
                                >
                                  {done
                                    ? <CheckCircle2 size={20} className="text-[#30D158] flex-shrink-0 mt-0.5" />
                                    : <Circle size={20} className="text-white/20 flex-shrink-0 mt-0.5 group-hover:text-white/40 transition-colors" />
                                  }
                                  <span
                                    className="text-sm leading-relaxed transition-colors"
                                  style={{
                                    fontFamily: 'var(--font-jetbrains, monospace)',
                                    color: done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                                    textDecoration: done ? 'line-through' : 'none',
                                  }}
                                >
                                  {task}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        </div>

                        {/* Resources */}
                        <div className="space-y-4 pt-6">
                          <p className="text-xs uppercase tracking-widest text-[#38BDF8] font-black" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            Study Materials
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {phase.resources.map((r, ri) => (
                                <a
                                  key={ri}
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.1] hover:border-[#0A84FF]/40 hover:bg-[#0A84FF]/5 transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                                    {resourceIcon(r.type)}
                                  </div>
                                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex-1" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                                    {r.title}
                                  </span>
                                  <ExternalLink size={14} className="text-white/20 group-hover:text-[#0A84FF] transition-colors flex-shrink-0" />
                                </a>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* WOW Projects */}
            <div className="space-y-6 pt-4">
              <div>
                <h2 style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }} className="text-2xl font-bold text-white">
                  Projects to build
                </h2>
                <p className="text-sm text-white/40 mt-1" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                  Real-world open source projects to study and replicate
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roadmap.projects.map((project, i) => {
                  const dc = difficultyColor(project.difficulty);
                  return (
                      <div
                        key={i}
                        className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col justify-between group"
                      >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border"
                            style={{ fontFamily: 'var(--font-jetbrains, monospace)', color: dc.color, background: dc.bg, borderColor: dc.border }}
                          >
                            {project.difficulty}
                          </span>
                          {project.stars && (
                            <span className="flex items-center gap-1 text-[10px] text-white/30" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                              <Star size={11} className="text-[#FF9F0A]" />
                              {project.stars.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                          {project.title}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed mb-4" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                          {project.description}
                        </p>
                        {project.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {project.techStack.map(t => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/40 border border-white/[0.06]" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-white/30 hover:text-[#38BDF8] transition-colors group-hover:text-white/50"
                          style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
                        >
                          <Github size={13} />
                          View on GitHub
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── History Overlay ──────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                <Clock size={20} className="text-[#38BDF8]" />
                Saved Study Plans
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white/[0.02]">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40 space-y-4">
                  <Loader size={24} className="animate-spin text-[#38BDF8]" />
                  <span className="text-sm" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>Loading your saved plans...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={32} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>No saved study plans found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(item => {
                    const d = new Date(item.createdAt);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setRoadmap(item.roadmapData);
                          setShowHistory(false);
                          window.scrollTo(0, 0);
                        }}
                        className="bg-white/[0.03] border border-white/[0.08] hover:border-[#0A84FF]/40 hover:bg-[#0A84FF]/5 transition-all p-5 rounded-2xl cursor-pointer group flex items-start justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#38BDF8] bg-[#0A84FF]/10 px-2.5 py-1 rounded-md border border-[#0A84FF]/20" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                              {item.jobRole}
                            </span>
                            <span className="text-[10px] text-white/30" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                              {d.toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white group-hover:text-[#38BDF8] transition-colors" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                            {item.roadmapData.title || `Curriculum for ${item.jobRole}`}
                          </h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}>
                            {item.matchScore}<span className="text-sm text-white/30 font-medium">%</span>
                          </span>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                            Original ATS
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
