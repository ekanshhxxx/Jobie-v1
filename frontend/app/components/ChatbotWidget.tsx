'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api, getUser } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    const currentUser = getUser();
    setUser(currentUser);
    // Add initial greeting if empty
    if (!isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: currentUser ? `Hi ${currentUser.name}! I am Jobie AI. How can I assist you today?` : 'Hi there! I am Jobie AI. How can I assist you today?' }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        messages: newMessages,
        userContext: user ? { name: user.name, role: user.role, companyName: user.companyName } : null
      };

      const res = await api.post('/api/chat', payload);
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply || "I didn't quite get that." }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Oops, I'm having trouble connecting right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="w-[320px] h-[450px] mb-4 pointer-events-auto flex flex-col overflow-hidden transition-all duration-300 transform scale-100 opacity-100 origin-bottom-right"
             style={{
               background: 'rgba(12,15,30,0.85)',
               backdropFilter: 'blur(32px) saturate(150%)',
               WebkitBackdropFilter: 'blur(32px) saturate(150%)',
               borderRadius: '20px',
               border: '1px solid rgba(79,172,254,0.25)',
               boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
             }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(79,172,254,0.15)] bg-[rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse"></div>
              <span className="font-['Syne'] font-bold text-white text-[14px]">Jobie Assistant</span>
            </div>
            <button onClick={toggleOpen} className="text-gray-400 hover:text-white transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-r from-[#1E6FFF] to-[#4FACFE] text-white rounded-br-sm'
                      : 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#EBF4FF] rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] text-[13px] leading-relaxed px-4 py-3 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#A8C4DE] rounded-bl-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-[#4FACFE] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#4FACFE] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-[#4FACFE] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-[rgba(79,172,254,0.15)] bg-[rgba(0,0,0,0.3)]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1.5 focus-within:border-[rgba(79,172,254,0.4)] transition"
            >
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                className="flex-1 bg-transparent border-none text-[13px] text-white focus:outline-none placeholder-[#5A7A99]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-[#4FACFE] to-[#00F2FE] text-black disabled:opacity-50 transition hover:scale-105"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toggle Button ── */}
      <button 
        onClick={toggleOpen}
        className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgba(0,242,254,0.3)] transition-transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #1E6FFF, #00F2FE)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        aria-label="Toggle Jobie AI Chat"
      >
        {!isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </button>

    </div>
  );
}
