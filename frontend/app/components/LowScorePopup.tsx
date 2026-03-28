'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, X, ArrowRight } from 'lucide-react';

interface LowScorePopupProps {
  score: number;
  missingKeywords: string[];
  jobDescription: string;
  onDismiss: () => void;
}

const MESSAGES: Record<string, { headline: string; sub: string }> = {
  veryLow: {
    headline: "You're missing a few key skills for this job.",
    sub: "Don't worry. We can create a simple, step-by-step plan to help you learn exactly what they are looking for.",
  },
  low: {
    headline: "You're almost there, but this job requires a bit more.",
    sub: "Want a custom curriculum to help you master the skills your resume is missing right now?",
  },
  moderate: {
    headline: "You're actually really close to matching!",
    sub: "Just a small gap. Want a quick study plan to bridge it before you apply?",
  },
};

export default function LowScorePopup({ score, missingKeywords, jobDescription, onDismiss }: LowScorePopupProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const msgKey = score < 35 ? 'veryLow' : score < 50 ? 'low' : 'moderate';
  const msg = MESSAGES[msgKey];

  const handleBuildRoadmap = () => {
    // Store context in sessionStorage and navigate to roadmap page
    sessionStorage.setItem('roadmap_jd', jobDescription);
    sessionStorage.setItem('roadmap_missing', JSON.stringify(missingKeywords));
    sessionStorage.setItem('roadmap_score', String(score));
    router.push('/roadmap');
  };

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-md transition-all duration-300"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glass card */}
        <div
          className="rounded-[2rem] overflow-hidden border border-white/15"
          style={{
            background: 'rgba(10, 12, 20, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 0 80px rgba(10,132,255,0.15), 0 32px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top glow stripe */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#0A84FF]/0 via-[#0A84FF] to-[#38BDF8]/0" />

          <div className="p-8">
            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}
                >
                  <Zap size={20} className="text-[#38BDF8]" />
                </div>
                <div>
                  <span
                    className="text-[10px] uppercase tracking-widest font-medium text-[#38BDF8]"
                    style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
                  >
                    Score Alert
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className="text-3xl font-black"
                      style={{
                        fontFamily: 'var(--font-space-grotesk, sans-serif)',
                        color: score < 35 ? '#FF453A' : score < 50 ? '#FF9F0A' : '#FFD60A',
                      }}
                    >
                      {score}%
                    </span>
                    <span className="text-xs text-white/30" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>match</span>
                  </div>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message */}
            <h2
              className="text-lg font-bold text-white leading-snug mb-2"
              style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
            >
              {msg.headline}
            </h2>
            <p
              className="text-sm text-white/50 leading-relaxed mb-6"
              style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
            >
              {msg.sub}
            </p>

            {/* Missing skills preview */}
            {missingKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {missingKeywords.slice(0, 6).map(kw => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-[#FF453A]/25 bg-[#FF453A]/[0.08] text-[#FF453A]/80"
                    style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
                  >
                    {kw}
                  </span>
                ))}
                {missingKeywords.length > 6 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white/30 border border-white/10" style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
                    +{missingKeywords.length - 6} more
                  </span>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                onClick={handleBuildRoadmap}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: 'var(--font-space-grotesk, sans-serif)',
                  background: 'linear-gradient(135deg, #0A84FF, #38BDF8)',
                  boxShadow: '0 0 24px -4px rgba(10,132,255,0.5)',
                }}
              >
                <Zap size={15} />
                Build My Study Plan
                <ArrowRight size={15} />
              </button>
              <button
                onClick={dismiss}
                className="px-5 py-3.5 rounded-2xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/10 transition-all flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}
              >
                Actually, I&apos;m good
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
