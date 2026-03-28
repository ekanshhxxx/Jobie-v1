'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  StreamVideo,
  StreamCall,
  StreamVideoClient,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallParticipantsList,
  CallingState,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { BrainCircuit } from 'lucide-react';

export default function MeetingRoomPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = getUser();
  const isRecruiter = currentUser?.role === 'recruiter';

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    let videoClient: StreamVideoClient;

    const setupStream = async () => {
      try {
        setLoading(true);

        const { token, apiKey } = await api.get('/api/meetings/token');
        
        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: String(currentUser.id),
            name: currentUser.name,
            image: `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`,
          },
          tokenProvider: () => Promise.resolve(token),
        });

        const myCall = videoClient.call('default', id);
        await myCall.join({ create: true });
        
        setClient(videoClient);
        setCall(myCall);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          clearAuth();
          router.push('/login');
        } else {
          console.error('Failed to setup stream:', error);
          alert('Failed to connect to video server.');
        }
      } finally {
        setLoading(false);
      }
    };

    setupStream();

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
      }
    };
  }, [id, currentUser?.id]);

  if (loading || !client || !call) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg font-medium animate-pulse">Connecting to Jobie secure server...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full bg-[#0b0f1a] overflow-hidden flex flex-col font-sans">
      <StreamVideo client={client}>
        <StreamTheme as="div" className="h-full flex flex-col">
          <StreamCall call={call}>
            {/* Header */}
            <div className="h-16 px-6 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between shrink-0 absolute top-0 left-0 right-0 z-10 hidden sm:flex">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                  <span className="text-white font-bold tracking-tighter">HRX</span>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <span className="text-gray-300 font-medium">Jobie Interview Room</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-green-900/30 text-green-400 border border-green-800/50 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Secure Connection
                </span>
                <button onClick={() => router.back()} className="text-sm font-medium text-gray-400 hover:text-white transition">Exit Room</button>
              </div>
            </div>

            {/* Video Body */}
            <div className="flex-1 flex w-full relative h-[calc(100vh-80px)] mt-16 pb-20">
              <div className="flex-1 p-2 sm:p-4 rounded-xl flex items-center justify-center relative bg-black/40 m-2 sm:m-4 ring-1 ring-white/10 shadow-2xl">
                <ParticipantView />
              </div>
              
              {/* Optional Recruiter AI Panel */}
              {isRecruiter && (
                <div className="w-80 bg-gray-900/80 backdrop-blur-xl border-l border-gray-800 p-6 flex flex-col h-full hidden xl:flex overflow-y-auto">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                    <BrainCircuit className="text-indigo-400 w-5 h-5" />
                    <h3 className="text-white font-medium text-sm">Copilot AI Insights</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-indigo-900/20 border border-indigo-800/50 rounded-xl">
                      <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2">Suggested Question</p>
                      <p className="text-sm text-indigo-100 italic">"Can you describe your experience handling database migrations with Sequelize as mentioned in your resume?"</p>
                    </div>

                    <div>
                      <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Live Sentiment</h4>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">Positive</span>
                        <span className="text-emerald-400 text-sm mb-1">↑ High Confidence</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Meeting Flow</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex gap-2 items-center text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-gray-600" /> Intro & Soft Skills</li>
                        <li className="flex gap-2 items-center text-white font-medium"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" /> Technical Deep Dive</li>
                        <li className="flex gap-2 items-center text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-gray-800" /> Q&A</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 p-2 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-20">
              <CallControls onLeave={() => router.back()} />
            </div>
            
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </main>
  );
}

// Separate component for hook access
const ParticipantView = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) {
    return <div className="text-gray-400 animate-pulse font-medium">Waiting for feed...</div>;
  }

  return <SpeakerLayout participantsBarPosition="bottom" />;
};
