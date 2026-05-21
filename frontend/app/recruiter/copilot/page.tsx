'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, BriefcaseBusiness, Loader2, MessageSquare, Plus, Send, Sparkles, UserRound } from 'lucide-react';
import { api, getUser, isApiError } from '../../lib/api';

type CopilotJob = {
  id: number;
  title: string;
  company: string;
  location?: string;
  applicantCount: number;
};

type CopilotSession = {
  id: number;
  recruiterId: number;
  jobId: number;
  title: string;
  metadata?: {
    jobTitle?: string;
    company?: string;
    applicantCount?: number;
  } | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type CopilotMessage = {
  id: number | string;
  sessionId?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

const starterPrompts = [
  'Rank the strongest applicants for this job.',
  'Who should I interview first and why?',
  'Which candidates are missing key skills?',
  'Summarize the pipeline status for this role.',
];

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecruiterCopilotPage() {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<CopilotJob[]>([]);
  const [sessions, setSessions] = useState<CopilotSession[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<CopilotSession | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeJobId) ?? null,
    [activeJobId, jobs]
  );

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'recruiter') {
      router.push('/candidate/dashboard');
      return;
    }

    let cancelled = false;
    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);
        const jobsRes = await api.get('/api/chat/copilot/jobs');
        const loadedJobs = (jobsRes.jobs ?? []) as CopilotJob[];
        if (cancelled) return;
        setJobs(loadedJobs);
        const firstJobId = loadedJobs[0]?.id ?? null;
        setActiveJobId(firstJobId);

        if (firstJobId) {
          const sessionsRes = await api.get(`/api/chat/copilot/sessions?jobId=${firstJobId}`);
          if (cancelled) return;
          const loadedSessions = (sessionsRes.sessions ?? []) as CopilotSession[];
          setSessions(loadedSessions);
          if (loadedSessions[0]) {
            await openSession(loadedSessions[0].id, cancelled);
          }
        }
      } catch (err) {
        if (!cancelled) setError(isApiError(err) ? err.message : 'Unable to load Copilot.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function loadSessionsForJob(jobId: number) {
    setActiveJobId(jobId);
    setActiveSession(null);
    setMessages([]);
    setError(null);
    const sessionsRes = await api.get(`/api/chat/copilot/sessions?jobId=${jobId}`);
    const loadedSessions = (sessionsRes.sessions ?? []) as CopilotSession[];
    setSessions(loadedSessions);
    if (loadedSessions[0]) {
      await openSession(loadedSessions[0].id);
    }
  }

  async function openSession(sessionId: number, cancelled = false) {
    const sessionRes = await api.get(`/api/chat/copilot/sessions/${sessionId}`);
    if (cancelled) return;
    setActiveSession(sessionRes.session as CopilotSession);
    setMessages((sessionRes.messages ?? []) as CopilotMessage[]);
  }

  async function createSession() {
    if (!activeJobId || creating) return;
    try {
      setCreating(true);
      setError(null);
      const res = await api.post('/api/chat/copilot/sessions', { jobId: activeJobId });
      const session = res.session as CopilotSession;
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      setActiveSession(session);
      setMessages((res.messages ?? []) as CopilotMessage[]);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not start a session.');
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || sending) return;

    let session = activeSession;
    if (!session) {
      if (!activeJobId) return;
      setCreating(true);
      const created = await api.post('/api/chat/copilot/sessions', { jobId: activeJobId });
      session = created.session as CopilotSession;
      setActiveSession(session);
      setSessions((current) => [session!, ...current]);
      setMessages((created.messages ?? []) as CopilotMessage[]);
      setCreating(false);
    }

    const text = content.trim();
    const optimistic: CopilotMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setInput('');
    setMessages((current) => [...current, optimistic]);
    setSending(true);
    setError(null);

    try {
      const res = await api.post(`/api/chat/copilot/sessions/${session.id}/reply`, { content: text });
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimistic.id),
        res.userMessage as CopilotMessage,
        res.assistantMessage as CopilotMessage,
      ]);
      setSessions((current) =>
        current.map((item) =>
          item.id === session.id
            ? { ...item, updatedAt: new Date().toISOString(), messageCount: item.messageCount + 2 }
            : item
        )
      );
    } catch (err) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setError(isApiError(err) ? err.message : 'Copilot could not answer right now.');
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50/50 dark:bg-[#0b0f1a] p-8">
        <div className="mx-auto flex h-[70vh] max-w-6xl items-center justify-center rounded-3xl border border-white/10 bg-[#111a2b]/80 text-gray-300">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-300" />
          Loading recruiter copilot
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-50/50 p-4 transition-colors dark:bg-[#0b0f1a] sm:p-8">
      <div className="mx-auto grid h-[calc(100vh-120px)] max-w-[1500px] grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111a2b]/90 shadow-[0_10px_30px_rgba(0,0,0,0.28)] xl:flex">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">AI Copilot</h1>
                <p className="text-xs text-gray-400">Saved job sessions</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Jobs</p>
            <div className="space-y-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => loadSessionsForJob(job.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    activeJobId === job.id
                      ? 'border-violet-400/30 bg-violet-500/15 text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-gray-400">{job.applicantCount} applicants</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sessions</p>
              <button
                onClick={createSession}
                disabled={!activeJobId || creating}
                className="rounded-lg border border-violet-400/30 bg-violet-500/15 p-1.5 text-violet-300 disabled:opacity-50"
                aria-label="Create session"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    activeSession?.id === session.id
                      ? 'border-white/20 bg-white/[0.08] text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="line-clamp-1 text-sm font-medium">{session.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {session.messageCount} messages · {formatTime(session.updatedAt)}
                  </p>
                </button>
              ))}
              {activeJobId && sessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-sm text-gray-400">
                  No sessions yet.
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-xl backdrop-blur-2xl dark:bg-[#111a2b]/90">
          <header className="flex shrink-0 flex-col gap-4 border-b border-gray-200/70 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeJob?.title ?? 'Select a job'}
                </h2>
                {activeJob && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    {activeJob.applicantCount} applicants
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Chat with an AI session that knows the applicants for this selected job.
              </p>
            </div>
            <button
              onClick={createSession}
              disabled={!activeJobId || creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Session
            </button>
          </header>

          {error && (
            <div className="mx-5 mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
              {error}
            </div>
          )}

          <div ref={chatRef} className="min-h-0 flex-1 overflow-y-auto p-5">
            {!activeJobId ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <BriefcaseBusiness className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">Post a job first</p>
                  <p className="mt-1 text-sm text-gray-500">Copilot sessions are created per job.</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-violet-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">Start a saved AI session</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ask about rankings, gaps, interview fit, or pipeline status.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        message.role === 'user'
                          ? 'rounded-tr-sm bg-gray-900 text-white dark:bg-gray-700'
                          : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200/70 p-4 dark:border-white/10">
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={!activeJobId || sending}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-violet-200 hover:text-violet-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:text-violet-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={!activeJobId || sending}
                rows={1}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-white/10 dark:bg-[#0b0f1a] dark:text-white"
                placeholder={activeJobId ? 'Ask about candidates for this job...' : 'Select a job to start'}
              />
              <button
                type="submit"
                disabled={!input.trim() || !activeJobId || sending}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-50"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
