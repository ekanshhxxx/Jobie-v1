'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import { Sparkles, Send, Bot, User as UserIcon, Loader2, Maximize2 } from 'lucide-react';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function RecruiterCopilotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Jobie AI Copilot. I can help you review applicants, summarize hiring metrics, and track interview stages using your current Jobie data. What should we check first?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState('your company');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);
    
    // Attempt to fetch company profile context
    api.get(`/api/profile/${u.id}`).then(res => {
      const p = res.profile ?? res;
      if (p.companyName) setCompanyName(p.companyName);
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // We pass the conversation history
      const formattedHistory = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/api/chat', {
        messages: formattedHistory.slice(-6), // Send last 6 messages
        userContext: {
          role: 'recruiter',
          name: user?.name,
          companyName: companyName
        }
      });

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: response.reply }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm sorry, I'm having trouble connecting to the Jobie neural net right now. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0b0f1a] transition-colors p-4 sm:p-8 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        {/* Title area */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-500" />
              AI Copilot Workspace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI assistant for pipeline management and candidate workflow support.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-full text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Session Context
          </div>
        </div>

        {/* Chat Interface Glass Container */}
        <div className="flex-1 bg-white/70 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
          
          {/* Messages Area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-tr from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white' 
                    : 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white'
                }`}>
                  {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>

                <div className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm/relaxed ${
                  m.role === 'user'
                    ? 'bg-gray-900 dark:bg-gray-800 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'
                }`}>
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert prose-violet max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
              <div className="relative flex-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="w-full max-h-32 min-h-[56px] py-4 pl-4 pr-12 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Ask Copilot to analyze candidates, draft an offer, or query metrics..."
                  rows={1}
                />
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-[56px] px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-sm hover:shadow-md hover:shadow-violet-200/50 dark:hover:shadow-violet-900/50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">Jobie AI Copilot can make mistakes. Always verify candidate facts.</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
