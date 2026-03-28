'use client';

import { ResumeReportCard as ReportCardType } from './types';
import { CheckCircle2, AlertTriangle, Briefcase, Sparkles } from 'lucide-react';

interface ResumeReportCardProps {
  report: ReportCardType;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75
    ? { ring: 'ring-emerald-400', text: 'text-emerald-400', glow: 'shadow-emerald-400/30', label: 'Strong', bg: 'from-emerald-900/20 to-green-900/10' }
    : score >= 55
    ? { ring: 'ring-amber-400', text: 'text-amber-400', glow: 'shadow-amber-400/30', label: 'Average', bg: 'from-amber-900/20 to-yellow-900/10' }
    : { ring: 'ring-rose-400', text: 'text-rose-400', glow: 'shadow-rose-400/30', label: 'Needs Work', bg: 'from-rose-900/20 to-red-900/10' };

  const circumference = 2 * Math.PI * 36;
  const dash = (score / 100) * circumference;

  return (
    <div className={`flex-shrink-0 w-28 h-28 relative flex flex-col items-center justify-center rounded-full ring-4 ${color.ring} shadow-xl ${color.glow} bg-gradient-to-br ${color.bg}`}>
      {/* SVG circle progress */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke="currentColor"
          className={color.text}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
        />
      </svg>
      <span className={`text-2xl font-extrabold z-10 ${color.text}`}>{score}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 z-10">{color.label}</span>
    </div>
  );
}

export default function ResumeReportCard({ report }: ResumeReportCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-violet-200/40 dark:border-violet-700/30 px-6 py-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles size={18} className="text-violet-500" />
          AI Resume Report Card
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Generated {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="p-6">
        {/* Score + recommendation */}
        <div className="flex items-start gap-5 mb-6">
          <ScoreBadge score={report.overallScore} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
              {report.hiringRecommendation}
            </p>
          </div>
        </div>

        {/* Suggested Roles */}
        {report.suggestedRoles?.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Suggested Roles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.suggestedRoles.map(role => (
                <span key={role} className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-700/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Strengths
            </h4>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 leading-snug">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={13} /> Areas to Improve
            </h4>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 leading-snug">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">△</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
