'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, isApiError } from '../../lib/api';
import { Calendar as CalendarIcon, Video, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  streamCallId: string;
  meetingUrl?: string;
  recruiter: { id: number; name: string; email: string };
  job: { id: number; title: string; company: string };
}

export default function CandidateInterviewsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const data = await api.get('/api/meetings/candidate');
      setMeetings(data);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-transparent">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--white)]">Your Interviews</h1>
        <p className="text-[var(--muted)] mt-2 text-lg">Manage your scheduled video calls with recruiters.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-gray-400">Loading your schedule...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 c-job-card !block border border-[var(--glass-border)] rounded-3xl shadow-sm">
          <CalendarIcon className="w-12 h-12 text-[var(--muted)] mx-auto block mb-4" />
          <h3 className="text-lg font-medium text-[var(--white)]">No interviews scheduled yet.</h3>
          <p className="text-[var(--dim)] mt-1 max-w-sm mx-auto">When recruiters invite you to interview for a job, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const startAt = new Date(meeting.scheduledAt).getTime();
            const endAt = startAt + Number(meeting.duration || 30) * 60 * 1000;
            const status = String(meeting.status || '').toLowerCase();
            const isPast = !Number.isFinite(endAt) ? false : endAt <= Date.now();
            const isCompleted = ['completed', 'cancelled', 'no_show'].includes(status) || isPast;
            
            return (
              <div key={meeting.id} className={`p-6 c-job-card flex flex-col md:flex-row md:items-center justify-between gap-6 transition ${isPast ? 'opacity-70' : ''}`}>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--glass-20)] text-[var(--white)]">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {format(new Date(meeting.scheduledAt), 'MMM do, yyyy • h:mm a')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--blue-glow)] text-[var(--blue-2)]">
                      {meeting.duration} Minutes
                    </span>
                    {isPast && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--white)]">{meeting.title}</h3>
                  <div className="mt-2 text-sm text-[var(--muted)] flex flex-col gap-1">
                    <p><strong className="text-[var(--white)]">Role:</strong> {meeting.job.title} at {meeting.job.company}</p>
                    <p><strong className="text-[var(--white)]">Interviewer:</strong> {meeting.recruiter.name}</p>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => {
                        const joinUrl = meeting.meetingUrl || `/meeting/${meeting.streamCallId}`;
                        if (joinUrl.startsWith('http')) {
                          window.open(joinUrl, '_blank', 'noopener,noreferrer');
                          return;
                        }
                        router.push(joinUrl);
                      }}
                      className="c-btn-primary flex items-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      Join Google Meet
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
