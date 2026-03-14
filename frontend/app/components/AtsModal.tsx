'use client';

import { useEffect, useState } from 'react';
import { api, getUser } from '../lib/api';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

interface AtsModalProps {
  jobId: number;
  onClose: () => void;
}

interface AtsResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

const ScoreCircle = ({ score }: { score: number }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'stroke-green-500';
  if (score < 75) colorClass = 'stroke-yellow-500';
  if (score < 50) colorClass = 'stroke-red-500';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle className="text-gray-200 dark:text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="50%" cy="50%" />
        <circle
          className={`${colorClass} transition-all duration-1000`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      <span className="text-3xl font-bold text-gray-800 dark:text-white">{score}%</span>
    </div>
  );
};

export default function AtsModal({ jobId, onClose }: AtsModalProps) {
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyse = async () => {
      const user = getUser();
      if (!user) {
        setError('You must be logged in to perform this analysis.');
        setLoading(false);
        return;
      }

      try {
        const data = await api.post(`/api/ats/evaluate/${jobId}/${user.id}`);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    analyse();
  }, [jobId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ATS Match Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Powered by Groq AI</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="animate-spin text-blue-500" size={48} />
            <p className="mt-4 text-gray-600 dark:text-gray-300">AI is analyzing your profile... this may take a moment.</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
            <p className="font-semibold">Analysis Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <ScoreCircle score={result.matchScore} />
            </div>
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-200">{result.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} /> Matched Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords.map(k => <span key={k} className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">{k}</span>)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <XCircle size={18} /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map(k => <span key={k} className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium px-2 py-1 rounded-full">{k}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
