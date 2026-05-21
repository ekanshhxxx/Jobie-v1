'use client';

import { GitHubDeepScan } from './types';
import { Github, Star, GitFork, MapPin, Users, ExternalLink, Zap, Code2, Terminal } from 'lucide-react';

interface GitHubDeepCardProps {
  scan: GitHubDeepScan;
}

// Language color map for visual bars
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', 'C#': '#178600',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
  HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c',
  Shell: '#89e051', PHP: '#4F5D95', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883',
};

const getLangColor = (lang: string) => LANG_COLORS[lang] ?? '#6b7280';

const getConfidenceColor = (c: number) =>
  c >= 75 ? 'text-emerald-400' : c >= 50 ? 'text-amber-400' : 'text-rose-400';
const getConfidenceBg = (c: number) =>
  c >= 75 ? 'bg-emerald-500/15 border-emerald-500/30' : c >= 50 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-rose-500/15 border-rose-500/30';

export default function GitHubDeepCard({ scan }: GitHubDeepCardProps) {
  const topSkills = scan.verifiedSkills?.slice(0, 24) || [];
  const topRepos = scan.pinnedRepos?.slice(0, 8) || [];
  const topLangs = (scan.languageBreakdown?.length > 0)
    ? scan.languageBreakdown.slice(0, 10)
    : (scan.topLanguages?.slice(0, 10) || []).map(l => ({
        language: l.language, bytes: 0, percentage: l.percentage,
      }));

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="relative flex items-start gap-4">
          <a href={scan.profileUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <img
              src={scan.avatarUrl}
              alt={scan.username}
              className="w-16 h-16 rounded-full ring-2 ring-blue-500/50 shadow-lg hover:ring-blue-400 transition-all"
            />
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={scan.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold text-lg hover:text-blue-400 transition-colors flex items-center gap-1.5"
              >
                <Github size={18} />
                @{scan.username}
                <ExternalLink size={13} className="opacity-60" />
              </a>
            </div>
            {scan.bio && <p className="text-gray-400 text-sm mt-1 leading-relaxed line-clamp-2">{scan.bio}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {scan.location && (
                <span className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={11} />{scan.location}</span>
              )}
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Users size={11} />
                <span className="text-white font-medium">{scan.followers.toLocaleString()}</span> followers
              </span>
              <span className="text-gray-400 text-xs">
                <span className="text-white font-medium">{scan.publicRepos}</span> repos ·{' '}
                <span className="text-white font-medium">{scan.totalStars.toLocaleString()}</span>
                <Star size={10} className="inline ml-0.5 text-yellow-400" />
              </span>
            </div>
          </div>
          {/* Activity badge */}
          <div className="flex-shrink-0 text-center">
            <div className={`text-2xl font-bold ${scan.activityScore >= 60 ? 'text-emerald-400' : scan.activityScore >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {scan.activityScore}
            </div>
            <div className="text-gray-500 text-xs">Activity</div>
            {scan.recentCommits > 0 && (
              <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-0.5 justify-center">
                <Zap size={10} className="text-blue-400" />{scan.recentCommits} commits/90d
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Language Breakdown */}
        {topLangs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Code2 size={15} /> Language Breakdown
            </h4>
            <div className="space-y-2">
              {topLangs.map(l => (
                <div key={l.language} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-20 truncate">{l.language}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${l.percentage}%`, backgroundColor: getLangColor(l.language) }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">{l.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pinned Repos */}
        {topRepos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Terminal size={15} /> Top Repositories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topRepos.map(repo => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40
                             hover:border-blue-400/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                      {repo.name}
                    </span>
                    {repo.language && (
                      <span
                        className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: getLangColor(repo.language) + 'cc' }}
                      >
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Star size={10} className="text-yellow-500" />{repo.stars.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <GitFork size={10} />{repo.forks}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Verified Skills */}
        {topSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ✅ GitHub-Verified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {topSkills.map(skill => (
                <span
                  key={skill.skill}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getConfidenceBg(skill.confidence)}`}
                >
                  <span className={`text-lg leading-none ${getConfidenceColor(skill.confidence)}`}>•</span>
                  <span className="text-gray-800 dark:text-gray-200">{skill.skill}</span>
                  <span className={`font-bold ${getConfidenceColor(skill.confidence)}`}>{skill.confidence}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Narrative */}
        {scan.aiNarrative && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200/60 dark:border-blue-700/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                ✨ AI Profile Analysis
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
              {scan.aiNarrative}
            </p>
          </div>
        )}

        {/* Footer: last scanned */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-xs text-gray-400">
            Last scanned: {new Date(scan.analysedAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
