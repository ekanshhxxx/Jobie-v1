'use client';

import { useState } from 'react';
import { api, uploadFile } from '../lib/api';

type ParsedResume = {
  name?: string;
  email?: string;
  phone?: string;
  overallSummary?: string;
  skills?: string[];
  suggestedRoles?: string[];
  experience?: { title: string; company: string; duration: string; description?: string }[];
  education?: { degree: string; institution: string; year?: string }[];
  certifications?: string[];
  languages?: string[];
};

export default function ResumePage() {
  const [tab, setTab] = useState<'text' | 'pdf'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/api/resume/parse-text', { text });
      setResult(data.parsed ?? data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setLoading(false);
    }
  };

  const parsePDF = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('resume', file);
      const data = await uploadFile('/api/resume/parse', form);
      setResult(data.parsed ?? data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Resume Parser</h1>
        <p className="text-gray-500 text-sm mt-1">
          Paste your resume or upload a PDF — AI extracts skills, experience, and suggests roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {(['text', 'pdf'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm px-4 py-1.5 rounded-lg font-medium transition ${
                  tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t === 'text' ? '📝 Paste Text' : '📄 Upload PDF'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
          )}

          {tab === 'text' ? (
            <>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-72 resize-none"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your resume text here...

John Doe
john@example.com | +1-555-0100

EXPERIENCE
Software Engineer at Google (2022–present)
- Built scalable microservices using Go and Kubernetes

SKILLS
JavaScript, TypeScript, Go, React, Node.js, Docker..."
              />
              <button
                onClick={parseText}
                disabled={loading || !text.trim()}
                className="mt-3 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? '⏳ Parsing with AI...' : '✨ Parse Resume'}
              </button>
            </>
          ) : (
            <>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 transition mb-3"
                onClick={() => document.getElementById('pdf-input')?.click()}
              >
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="text-4xl mb-3">📄</div>
                {file ? (
                  <p className="text-sm text-indigo-600 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 font-medium">Click to upload PDF</p>
                    <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                  </>
                )}
              </div>
              <button
                onClick={parsePDF}
                disabled={loading || !file}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? '⏳ Parsing with AI...' : '✨ Parse Resume'}
              </button>
            </>
          )}
        </div>

        {/* Result panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm overflow-y-auto max-h-160">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="text-4xl mb-3 animate-pulse">🤖</div>
              <p className="text-gray-500 font-medium">AI is reading your resume...</p>
              <p className="text-gray-400 text-sm mt-1">This usually takes 5–10 seconds</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-gray-500 font-medium">Results will appear here</p>
              <p className="text-gray-400 text-sm mt-1">Paste your resume and hit Parse</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Identity */}
              {result.name && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{result.name}</h2>
                  <p className="text-sm text-gray-500">
                    {[result.email, result.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}

              {/* Summary */}
              {result.overallSummary && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Summary</p>
                  <p className="text-sm text-gray-700">{result.overallSummary}</p>
                </div>
              )}

              {/* Skills */}
              {(result.skills?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills!.map(s => (
                      <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Roles */}
              {(result.suggestedRoles?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Suggested Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedRoles!.map(r => (
                      <span key={r} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(result.experience?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Experience</p>
                  <ul className="space-y-3">
                    {result.experience!.map((exp, i) => (
                      <li key={i} className="border-l-2 border-indigo-200 pl-3">
                        <p className="text-sm font-semibold text-gray-800">{exp.title}</p>
                        <p className="text-xs text-gray-500">{exp.company} · {exp.duration}</p>
                        {exp.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{exp.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Education */}
              {(result.education?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Education</p>
                  <ul className="space-y-1.5">
                    {result.education!.map((edu, i) => (
                      <li key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{edu.degree}</span>
                        {' — '}
                        {edu.institution}
                        {edu.year && <span className="text-gray-400"> ({edu.year})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certifications */}
              {(result.certifications?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Certifications</p>
                  <ul className="space-y-1">
                    {result.certifications!.map((c, i) => (
                      <li key={i} className="text-sm text-gray-700">🏅 {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {(result.languages?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.languages!.map(l => (
                      <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
