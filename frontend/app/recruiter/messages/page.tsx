'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Sparkles, UserRound, Briefcase } from 'lucide-react';
import { StreamChat } from 'stream-chat';
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
  const { toast } = useToast();

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [streamUserId, setStreamUserId] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingContact, setOpeningContact] = useState<string | null>(null);

  const currentUser = getUser();

  useEffect(() => {
    let mounted = true;

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

        const client = StreamChat.getInstance(authRes.apiKey);
        await client.connectUser(
          {
            id: authRes.streamUserId,
            name: currentUser.name,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=111827&color=fff`,
          },
          authRes.token
        );

        if (!mounted) {
          await client.disconnectUser();
          return;
        }

        setStreamUserId(authRes.streamUserId);
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
      if (chatClient) {
        chatClient.disconnectUser();
      }
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

  const sort = useMemo(() => ({ last_message_at: -1 as const }), []);

  const openContactChannel = async (contact: Contact) => {
    if (!chatClient) return;
    try {
      setOpeningContact(`${contact.candidateId}:${contact.jobId}`);
      const channelRes = await api.post('/api/chat/stream/channel', {
        jobId: contact.jobId,
        candidateId: contact.candidateId,
      });

      const channel = chatClient.channel('messaging', channelRes.channelId);
      await channel.watch();
      setActiveChannel(channel);
    } catch (error) {
      toast({
        type: 'error',
        title: 'Could not open channel',
        message: isApiError(error) ? error.message : 'Please try again.',
      });
    } finally {
      setOpeningContact(null);
    }
  };

  if (loading || !chatClient) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center text-sm text-[var(--t2)]">
        Initializing live messaging...
      </div>
    );
  }

  return (
    <main className="r-main !p-4">
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
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-3 transition"
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
                  filters={filters as any}
                  sort={sort as any}
                  options={{ state: true, watch: true, limit: 30 }}
                  Preview={(props) => (
                    (() => {
                      const channelData = (props.channel?.data ?? {}) as any;
                      return (
                        <button
                          onClick={() => setActiveChannel(props.channel)}
                          className={`w-full text-left px-3 py-3 border-b border-white/10 hover:bg-white/[0.06] transition ${
                            props.activeChannel?.id === props.channel?.id ? 'bg-white/[0.08]' : ''
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-100 truncate">
                            {channelData.name || props.channel?.id}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 truncate">
                            {channelData.jobId ? `Job #${channelData.jobId}` : 'Direct thread'}
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
