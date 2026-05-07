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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Interviews</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your scheduled video calls with recruiters.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-gray-400">Loading your schedule...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl shadow-sm">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto block mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No interviews scheduled yet.</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">When recruiters invite you to interview for a job, they'll appear here.</p>
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
              <div key={meeting.id} className={`p-6 bg-white border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:shadow-md ${isPast ? 'border-gray-200' : 'border-indigo-100'} ring-1 ring-black/5`}>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {format(new Date(meeting.scheduledAt), 'MMM do, yyyy • h:mm a')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                      {meeting.duration} Minutes
                    </span>
                    {isPast && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{meeting.title}</h3>
                  <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1">
                    <p><strong>Role:</strong> {meeting.job.title} at {meeting.job.company}</p>
                    <p><strong>Interviewer:</strong> {meeting.recruiter.name}</p>
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
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5 flex items-center gap-2"
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
