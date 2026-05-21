'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { Calendar as CalendarIcon, Video, Plus, ChevronLeft, ChevronRight, X, Users } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  streamCallId: string;
  meetingUrl?: string;
  candidate: { id: number; name: string; email: string };
  job: { id: number; title: string; company: string };
}

interface RecruiterApplication {
  id: number;
  userId: number;
  jobId: number;
  status: string;
  User?: {
    id: number;
    name: string;
    email: string;
  };
  Job?: {
    id: number;
    title: string;
    company: string;
  } | null;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function defaultSchedulerDate(seed?: Date) {
  const next = seed ? new Date(seed) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (next.getTime() < Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(10, 0, 0, 0);
  return toDateTimeLocalValue(next);
}

export default function RecruiterInterviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleMeetingUrl, setScheduleMeetingUrl] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState(45);

  const fetchMeetings = async () => {
    const data = await api.get('/api/meetings/recruiter');
    setMeetings(Array.isArray(data) ? (data as Meeting[]) : []);
  };

  const fetchApplications = async (recruiterId: number) => {
    const data = await api.get(`/api/applications/recruiter/${recruiterId}`);
    const rows = Array.isArray(data) ? (data as RecruiterApplication[]) : [];
    const scheduleable = rows.filter((row) => row.Job && !['hired', 'rejected'].includes(String(row.status)));
    setApplications(scheduleable);
  };

  const initialize = async () => {
    try {
      setLoading(true);
      const currentUser = getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (currentUser.role !== 'recruiter' && currentUser.role !== 'admin') {
        router.push('/candidate/dashboard');
        return;
      }

      await Promise.all([fetchMeetings(), fetchApplications(currentUser.id)]);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      toast({ type: 'error', title: 'Error', message: 'Failed to load meetings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedApplication = useMemo(
    () => applications.find((item) => item.id === selectedApplicationId) || null,
    [applications, selectedApplicationId]
  );

  const openScheduler = (seedDate?: Date) => {
    if (applications.length === 0) {
      toast({
        type: 'warning',
        title: 'No candidates to schedule',
        message: 'Candidates appear here after they apply to your jobs.',
      });
      return;
    }

    const first = applications[0];
    const firstCandidateName = first.User?.name || 'Candidate';
    const firstJobTitle = first.Job?.title || 'Role';

    setSelectedApplicationId(first.id);
    setScheduleTitle(`Interview: ${firstJobTitle} · ${firstCandidateName}`);
    setScheduleDescription('Live interview to discuss role fit, experience, and next steps.');
    setScheduleMeetingUrl('');
    setScheduleDuration(45);
    setScheduleDateTime(defaultSchedulerDate(seedDate));
    setScheduleOpen(true);
  };

  const onSelectApplication = (nextId: number) => {
    setSelectedApplicationId(nextId);
    const next = applications.find((item) => item.id === nextId);
    if (!next) return;
    const nextCandidateName = next.User?.name || 'Candidate';
    const nextJobTitle = next.Job?.title || 'Role';
    setScheduleTitle(`Interview: ${nextJobTitle} · ${nextCandidateName}`);
  };

  const submitSchedule = async () => {
    if (!selectedApplication) {
      toast({ type: 'warning', title: 'Choose a candidate', message: 'Select who this interview is for.' });
      return;
    }

    if (!scheduleDateTime) {
      toast({ type: 'warning', title: 'Missing schedule time', message: 'Pick date and time for the interview.' });
      return;
    }

    const cleanMeetingUrl = scheduleMeetingUrl.trim();
    if (!cleanMeetingUrl) {
      toast({ type: 'warning', title: 'Missing Google Meet link', message: 'Paste a Google Meet URL before scheduling.' });
      return;
    }

    if (!/^https:\/\/meet\.google\.com\/.+/i.test(cleanMeetingUrl)) {
      toast({ type: 'warning', title: 'Invalid Google Meet link', message: 'Use a valid https://meet.google.com/... URL.' });
      return;
    }

    const scheduledDate = new Date(scheduleDateTime);
    if (Number.isNaN(scheduledDate.getTime())) {
      toast({ type: 'warning', title: 'Invalid date', message: 'Please choose a valid interview date/time.' });
      return;
    }

    if (scheduledDate.getTime() < Date.now() + 5 * 60 * 1000) {
      toast({ type: 'warning', title: 'Pick a future time', message: 'Interview must be scheduled in the future.' });
      return;
    }

    try {
      setSavingSchedule(true);
      await api.post('/api/meetings/schedule', {
        jobId: selectedApplication.jobId,
        candidateId: selectedApplication.userId,
        title: scheduleTitle.trim() || `Interview: ${selectedApplication.Job?.title || 'Role'}`,
        description: scheduleDescription.trim(),
        meetingUrl: cleanMeetingUrl,
        scheduledAt: scheduledDate.toISOString(),
        duration: scheduleDuration,
      });

      toast({
        type: 'success',
        title: 'Interview scheduled',
        message: `${selectedApplication.User?.name || 'Candidate'} has been invited to interview.`,
      });
      setScheduleOpen(false);
      setCurrentDate(scheduledDate);
      await fetchMeetings();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      toast({
        type: 'error',
        title: 'Scheduling failed',
        message: isApiError(error) ? error.message : 'Could not schedule interview. Please try again.',
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-violet-600" />
              Interview Calendar
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your upcoming candidate interviews across all open roles.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openScheduler()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Interview
            </button>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 flex items-center font-medium text-sm text-gray-900 border-x border-gray-100 min-w-[140px] justify-center">
                {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
              </div>
              <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border text-center border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[70vh]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
            {weekDays.map((date, idx) => {
              const takesPlaceToday = isSameDay(date, new Date());
              return (
                <div key={idx} className={`py-4 px-2 border-r border-gray-100 last:border-0 ${takesPlaceToday ? 'bg-violet-50/30' : ''}`}>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{format(date, 'eee')}</p>
                  <p className={`text-xl font-medium mt-1 ${takesPlaceToday ? 'text-violet-600' : 'text-gray-900'}`}>{format(date, 'd')}</p>
                  {takesPlaceToday && <div className="mt-1 w-1.5 h-1.5 bg-violet-600 rounded-full mx-auto" />}
                </div>
              );
            })}
          </div>

          {/* Time & Events Block */}
          <div className="flex-1 overflow-y-auto relative bg-grid-slate-100">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <p className="animate-pulse text-gray-400 font-medium tracking-tight">Syncing calendar...</p>
              </div>
            ) : null}
            
            <div className="grid grid-cols-7 min-h-full">
              {weekDays.map((date, colIdx) => {
                const dayMeetings = meetings
                  .filter(m => isSameDay(new Date(m.scheduledAt), date))
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
                return (
                  <div key={colIdx} className="border-r border-gray-100 last:border-0 p-2 space-y-2 min-h-[300px]">
                    {dayMeetings.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openScheduler(date)}
                          className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all"
                          title="Schedule interview on this day"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      dayMeetings.map(meeting => {
                        const mTime = format(new Date(meeting.scheduledAt), 'h:mm a');
                        const startAt = new Date(meeting.scheduledAt).getTime();
                        const endAt = startAt + Number(meeting.duration || 30) * 60 * 1000;
                        const status = String(meeting.status || '').toLowerCase();
                        const hasEnded = Number.isFinite(endAt) && endAt <= Date.now();
                        const isPast = ['completed', 'cancelled', 'no_show'].includes(status) || hasEnded;
                        
                        return (
                          <div
                            key={meeting.id}
                            className={`p-3 rounded-xl border text-left shadow-sm group cursor-pointer transition-all hover:-translate-y-0.5 ${
                              isPast 
                                ? 'bg-gray-50 border-gray-200 opacity-60' 
                                : 'bg-white border-violet-200 hover:shadow-violet-100/50 hover:border-violet-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className={`text-[10px] font-bold tracking-tight rounded px-1.5 py-0.5 ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-violet-100 text-violet-700'}`}>
                                {mTime}
                              </span>
                              {!isPast && (
                                <button 
                                  className="w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded-md flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const joinUrl = meeting.meetingUrl || `/meeting/${meeting.streamCallId}`;
                                    if (joinUrl.startsWith('http')) {
                                      window.open(joinUrl, '_blank', 'noopener,noreferrer');
                                      return;
                                    }
                                    router.push(joinUrl);
                                  }}
                                  title="Join Google Meet"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <h4 className={`text-sm font-semibold mt-2 line-clamp-1 ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
                              {meeting.title}
                            </h4>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {meeting.candidate.name}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {scheduleOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Schedule Interview</h2>
                  <p className="text-sm text-gray-500">Create a video interview invite with recruiter + candidate details.</p>
                </div>
                <button
                  onClick={() => setScheduleOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Candidate & Role</span>
                  <select
                    value={selectedApplicationId ?? ''}
                    onChange={(event) => onSelectApplication(Number(event.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
                  >
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {(application.User?.name || 'Candidate')} • {(application.Job?.title || 'Role')} ({application.status.replaceAll('_', ' ')})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Interview title</span>
                  <input
                    value={scheduleTitle}
                    onChange={(event) => setScheduleTitle(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    placeholder="Interview title"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date & Time</span>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(event) => setScheduleDateTime(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Duration</span>
                    <select
                      value={scheduleDuration}
                      onChange={(event) => setScheduleDuration(Number(event.target.value))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Google Meet URL</span>
                  <input
                    value={scheduleMeetingUrl}
                    onChange={(event) => setScheduleMeetingUrl(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description (optional)</span>
                  <textarea
                    value={scheduleDescription}
                    onChange={(event) => setScheduleDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    placeholder="Agenda, expectations, or prep notes for candidate"
                  />
                </label>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setScheduleOpen(false)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submitSchedule()}
                  disabled={savingSchedule}
                  className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {savingSchedule ? 'Scheduling...' : 'Schedule & Notify'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
