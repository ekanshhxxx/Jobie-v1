'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  streamCallId: string;
  candidate: { id: number; name: string; email: string };
  job: { id: number; title: string; company: string };
}

export default function RecruiterInterviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/meetings/recruiter');
      setMeetings(data);
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
    fetchMeetings();
  }, []);

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
                const dayMeetings = meetings.filter(m => isSameDay(new Date(m.scheduledAt), date));
                return (
                  <div key={colIdx} className="border-r border-gray-100 last:border-0 p-2 space-y-2 min-h-[300px]">
                    {dayMeetings.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      dayMeetings.map(meeting => {
                        const mTime = format(new Date(meeting.scheduledAt), 'h:mm a');
                        const isPast = new Date(meeting.scheduledAt).getTime() < new Date().getTime() && meeting.status !== 'in_progress';
                        
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
                                    router.push(`/meeting/${meeting.streamCallId}`);
                                  }}
                                  title="Join Video Room"
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

      </div>
    </div>
  );
}
