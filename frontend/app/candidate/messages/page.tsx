'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MessageSquare, Sparkles } from 'lucide-react';
import { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

type CandidateContact = {
  recruiterId: number;
  recruiterName: string;
  recruiterEmail: string;
  jobId: number;
  jobTitle: string;
  company: string;
  lastStatus: string;
};

export default function CandidateMessagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [streamUserId, setStreamUserId] = useState('');
  const [contacts, setContacts] = useState<CandidateContact[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openingJobId, setOpeningJobId] = useState<number | null>(null);
  const [streamToken, setStreamToken] = useState('');
  const currentUser = getUser();

  useEffect(() => {
    let mounted = true;
    let bootClient: StreamChat | null = null;

    const boot = async () => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (currentUser.role !== 'candidate') {
        router.push('/recruiter/messages');
        return;
      }

      try {
        setLoading(true);
        const [authRes, contactsRes] = await Promise.all([
          api.get('/api/chat/stream/auth'),
          api.get('/api/chat/stream/contacts'),
        ]);

        const client = StreamChat.getInstance(authRes.apiKey);
        bootClient = client;
        await client.connectUser(
          {
            id: authRes.streamUserId,
            name: currentUser.name,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0f172a&color=ffffff`,
          },
          authRes.token
        );

        if (!mounted) {
          await client.disconnectUser();
          return;
        }

        setStreamUserId(authRes.streamUserId);
  setStreamToken(authRes.token);
        setContacts(contactsRes.contacts ?? []);
        setChatClient(client);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          clearAuth();
          router.push('/login');
          return;
        }
        toast({
          type: 'error',
          title: 'Messaging unavailable',
          message: isApiError(error) ? error.message : 'Could not initialize chat.',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
      if (bootClient) void bootClient.disconnectUser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters = useMemo(
    () => ({
      type: 'messaging',
      members: { $in: streamUserId ? [streamUserId] : [] },
    }),
    [streamUserId]
  );

  const ensureConnectedClient = async () => {
    if (!chatClient) {
      throw new Error('Messaging client is not initialized yet.');
    }

    if (chatClient.userID === streamUserId) {
      return chatClient;
    }

    if (chatClient.userID) {
      await chatClient.disconnectUser();
    }

    if (!streamUserId || !streamToken) {
      throw new Error('Messaging authentication is unavailable. Please refresh this page.');
    }

    await chatClient.connectUser(
      {
        id: streamUserId,
        name: currentUser?.name || 'Candidate',
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Candidate')}&background=0f172a&color=ffffff`,
      },
      streamToken
    );

    return chatClient;
  };

  const openJobThread = async (jobId: number) => {
    if (!chatClient) return;
    try {
      setOpeningJobId(jobId);
      const connectedClient = await ensureConnectedClient();
      const res = await api.post('/api/chat/stream/channel', { jobId });
      const channel = connectedClient.channel('messaging', res.channelId);
      await channel.watch();
      setActiveChannel(channel);
    } catch (error) {
      toast({
        type: 'error',
        title: 'Could not open thread',
        message: isApiError(error) ? error.message : 'Please try again.',
      });
    } finally {
      setOpeningJobId(null);
    }
  };

  if (loading || !chatClient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
        Initializing candidate inbox...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-48px)]">
        <aside className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Recruiter Threads</h1>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100/60 dark:bg-white/5 p-4 text-xs text-gray-500 dark:text-gray-300">
                No recruiter thread yet. Apply to a role first, then start messaging here.
              </div>
            )}

            {contacts.map((contact) => (
              <button
                key={contact.jobId}
                onClick={() => openJobThread(contact.jobId)}
                className="w-full text-left rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.08] p-3 transition"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{contact.recruiterName}</div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-300 truncate">{contact.recruiterEmail}</div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400">
                  <Briefcase className="w-3 h-3" />
                  {contact.jobTitle}
                </div>
                {openingJobId === contact.jobId && <div className="mt-2 text-[10px] text-indigo-500">opening...</div>}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0a1224]/90 overflow-hidden">
          <Chat client={chatClient} theme="str-chat__theme-dark">
            <div className="h-full grid grid-cols-1 md:grid-cols-[280px_1fr]">
              <div className="border-r border-gray-200 dark:border-white/10">
                <ChannelList
                  filters={filters as any}
                  options={{ watch: true, state: true, limit: 30 }}
                  sort={{ last_message_at: -1 } as any}
                  Preview={(props) => {
                    const channelData = (props.channel?.data ?? {}) as any;
                    const channelCustom = channelData.custom ?? {};
                    const displayName = channelData.name || channelCustom.name || props.channel?.id;
                    const displayJobId = channelData.jobId || channelCustom.jobId;
                    return (
                      <button
                        onClick={() => setActiveChannel(props.channel)}
                        className={`w-full text-left px-3 py-3 border-b border-gray-200 dark:border-white/10 hover:bg-gray-100/80 dark:hover:bg-white/[0.06] transition ${
                          activeChannel?.id === props.channel?.id ? 'bg-gray-100 dark:bg-white/[0.08]' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 truncate">
                          {displayJobId ? `Job #${displayJobId}` : 'Direct thread'}
                        </div>
                      </button>
                    );
                  }}
                  LoadingIndicator={() => <LoadingIndicator />}
                  EmptyStateIndicator={() => (
                    <div className="p-4 text-xs text-gray-500 dark:text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      No live channels yet.
                    </div>
                  )}
                />
              </div>

              <div className="h-full">
                {activeChannel ? (
                  <Channel channel={activeChannel}>
                    <Window>
                      <ChannelHeader />
                      <MessageList />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-slate-300">
                    Select a recruiter thread or open one from the left panel.
                  </div>
                )}
              </div>
            </div>
          </Chat>
        </section>
      </div>
    </div>
  );
}
