'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Sparkles, UserRound, Briefcase } from 'lucide-react';
import { StreamChat, type Channel as StreamChannel, type ChannelFilters, type ChannelSort } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { useSearchParams } from 'next/navigation';

type Contact = {
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  jobTitle: string;
  company: string;
  lastStatus: string;
};

export default function RecruiterMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [streamUserId, setStreamUserId] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingContact, setOpeningContact] = useState<string | null>(null);
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false);
  const [streamToken, setStreamToken] = useState<string>('');

  const currentUser = getUser();

  useEffect(() => {
    let mounted = true;
    let bootClient: StreamChat | null = null;

    const boot = async () => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (currentUser.role !== 'recruiter' && currentUser.role !== 'admin') {
        router.push('/candidate/messages');
        return;
      }

      try {
        setLoading(true);
        const [authRes, contactsRes] = await Promise.all([
          api.get('/api/chat/stream/auth'),
          api.get('/api/chat/stream/contacts'),
        ]);

        const authPayload = (authRes ?? {}) as {
          apiKey?: string;
          streamUserId?: string;
          token?: string;
        };
        const contactsPayload = (contactsRes ?? {}) as { contacts?: Contact[] };
        if (!authPayload.apiKey || !authPayload.streamUserId || !authPayload.token) {
          throw new Error('Missing Stream auth configuration from server response.');
        }

        const client = StreamChat.getInstance(authPayload.apiKey);
        bootClient = client;
        await client.connectUser(
          {
            id: authPayload.streamUserId,
            name: currentUser.name,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=111827&color=fff`,
          },
          authPayload.token
        );

        if (!mounted) {
          await client.disconnectUser();
          return;
        }

        setStreamUserId(authPayload.streamUserId);
  setStreamToken(authPayload.token);
        setContacts(contactsPayload.contacts ?? []);
        setChatClient(client);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          clearAuth();
          router.push('/login');
          return;
        }
        toast({
          type: 'error',
          title: 'Live messaging unavailable',
          message: isApiError(error) ? error.message : 'Unable to initialize Stream chat.',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
      if (bootClient) {
        void bootClient.disconnectUser();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters = useMemo<ChannelFilters>(
    () => ({
      type: 'messaging',
      members: { $in: streamUserId ? [streamUserId] : ['no-user'] },
    }),
    [streamUserId]
  );

  const sort = useMemo<ChannelSort>(() => ({ last_message_at: -1 }), []);

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

    try {
      await chatClient.connectUser(
        {
          id: streamUserId,
          name: currentUser?.name || 'Recruiter',
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Recruiter')}&background=111827&color=fff`,
        },
        streamToken
      );
      return chatClient;
    } catch {
      const authRes = await api.get('/api/chat/stream/auth');
      const authPayload = (authRes ?? {}) as {
        streamUserId?: string;
        token?: string;
      };
      if (!authPayload.streamUserId || !authPayload.token) {
        throw new Error('Could not refresh messaging credentials.');
      }

      setStreamUserId(authPayload.streamUserId);
      setStreamToken(authPayload.token);

      await chatClient.connectUser(
        {
          id: authPayload.streamUserId,
          name: currentUser?.name || 'Recruiter',
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Recruiter')}&background=111827&color=fff`,
        },
        authPayload.token
      );

      return chatClient;
    }
  };

  const openContactChannel = async (contact: Contact) => {
    if (!chatClient) return;
    try {
      setOpeningContact(`${contact.candidateId}:${contact.jobId}`);
      const connectedClient = await ensureConnectedClient();
      const channelRes = await api.post('/api/chat/stream/channel', {
        jobId: contact.jobId,
        candidateId: contact.candidateId,
      });
      const channelPayload = (channelRes ?? {}) as { channelId?: string };
      if (!channelPayload.channelId) {
        throw new Error('Chat channel could not be opened.');
      }

      const channel = connectedClient.channel('messaging', channelPayload.channelId);
      await channel.watch();
      setActiveChannel(channel);
    } catch (error) {
      const fallbackMessage = error instanceof Error && error.message ? error.message : 'Please try again.';
      toast({
        type: 'error',
        title: 'Could not open channel',
        message: isApiError(error) ? error.message : fallbackMessage,
      });
    } finally {
      setOpeningContact(null);
    }
  };

  useEffect(() => {
    if (loading || !chatClient || autoOpenAttempted) return;

    const candidateId = Number(searchParams.get('candidateId'));
    const jobId = Number(searchParams.get('jobId'));

    if (!Number.isFinite(candidateId) || !Number.isFinite(jobId)) {
      setAutoOpenAttempted(true);
      return;
    }

    const contact = contacts.find((item) => item.candidateId === candidateId && item.jobId === jobId);
    if (contact) {
      void openContactChannel(contact);
      setAutoOpenAttempted(true);
      return;
    }

    const fallbackContact: Contact = {
      candidateId,
      jobId,
      candidateName: 'Candidate',
      candidateEmail: '',
      jobTitle: 'Selected Role',
      company: '',
      lastStatus: 'applied',
    };
    void openContactChannel(fallbackContact);
    setAutoOpenAttempted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, chatClient, contacts, searchParams, autoOpenAttempted]);

  if (loading || !chatClient) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center text-sm text-(--t2)">
        Initializing live messaging...
      </div>
    );
  }

  return (
    <main className="r-main p-4!">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-120px)]">
        <aside className="rounded-3xl border border-white/15 bg-[#0f172a]/70 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-cyan-300" />
            <h1 className="text-sm font-semibold text-white">Pipeline Messenger</h1>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                No applicant threads yet. As candidates apply, you can launch direct channels here.
              </div>
            )}

            {contacts.map((contact) => {
              const key = `${contact.candidateId}:${contact.jobId}`;
              return (
                <button
                  key={key}
                  onClick={() => openContactChannel(contact)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/3 hover:bg-white/8 px-3 py-3 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-100 truncate">{contact.candidateName}</div>
                    {openingContact === key && <span className="text-[10px] text-cyan-300">opening...</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                    <Briefcase className="w-3 h-3" />
                    {contact.jobTitle}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 truncate">
                    <UserRound className="w-3 h-3" />
                    {contact.candidateEmail}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-3xl border border-white/15 bg-[#0a1224]/80 overflow-hidden">
          <Chat client={chatClient} theme="str-chat__theme-dark">
            <div className="h-full grid grid-cols-1 md:grid-cols-[280px_1fr]">
              <div className="border-r border-white/10">
                <ChannelList
                  filters={filters}
                  sort={sort}
                  options={{ state: true, watch: true, limit: 30 }}
                  Preview={(props) => (
                    (() => {
                      const channelData = (props.channel?.data ?? {}) as {
                        name?: string;
                        jobId?: number;
                        custom?: {
                          name?: string;
                          jobId?: number;
                        };
                      };
                      const displayName = channelData.name || channelData.custom?.name || props.channel?.id;
                      const displayJobId = channelData.jobId || channelData.custom?.jobId;
                      return (
                        <button
                          onClick={() => setActiveChannel(props.channel)}
                          className={`w-full text-left px-3 py-3 border-b border-white/10 hover:bg-white/6 transition ${
                            props.activeChannel?.id === props.channel?.id ? 'bg-white/8' : ''
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-100 truncate">
                            {displayName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 truncate">
                            {displayJobId ? `Job #${displayJobId}` : 'Direct thread'}
                          </div>
                        </button>
                      );
                    })()
                  )}
                  EmptyStateIndicator={() => (
                    <div className="p-4 text-xs text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      No live channels yet.
                    </div>
                  )}
                  LoadingIndicator={() => <LoadingIndicator />}
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
                  <div className="h-full flex items-center justify-center text-slate-300 text-sm">
                    Select a channel from the left or open one from Pipeline Messenger.
                  </div>
                )}
              </div>
            </div>
          </Chat>
        </section>
      </div>
    </main>
  );
}
