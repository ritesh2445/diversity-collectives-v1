import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  RotateCcw, 
  ExternalLink,
  Bot,
  User,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { askDcvcChat } from '../services/api';

const SUGGESTED_QUESTIONS = [
  "Are your services free?",
  "What events are coming up?",
  "Where is the Community Resource Center?",
  "How can I volunteer?",
  "What is Rainbow Umbrella?",
  "Do you offer training?",
  "How can I donate?"
];

/**
 * Ask DCVC — Free Community AI Chatbot
 * Powered by Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct-fp8)
 * $0 recurring cost, 100% free community assistant
 */
export default function AskDcvcChatbot() {
  // Feature flag check (disabled by default until final environment configuration)
  const isEnabled = import.meta.env.VITE_ENABLE_CHATBOT === 'true' || import.meta.env.DEV;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm **Ask DCVC**, your free community guide. Ask me about our free health testing, youth groups, center hours, events, or volunteer opportunities.",
      citations: [
        { title: "Programs", url: "/programs" },
        { title: "Contact Us", url: "/contact" }
      ],
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Keyboard shortcut: Alt + C to toggle chatbot, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // External voice / programmatic triggers for hands-free mic control
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen(prev => !prev);

    window.addEventListener('openAskDcvc', handleOpen);
    window.addEventListener('closeAskDcvc', handleClose);
    window.addEventListener('toggleAskDcvc', handleToggle);

    return () => {
      window.removeEventListener('openAskDcvc', handleOpen);
      window.removeEventListener('closeAskDcvc', handleClose);
      window.removeEventListener('toggleAskDcvc', handleToggle);
    };
  }, []);

  const handleSend = async (questionText) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        text: textToSend,
        timestamp: new Date().toISOString()
      }
    ];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askDcvcChat(textToSend);
      setMessages([
        ...newMessages,
        {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          text: response.answer,
          citations: response.citations || [],
          timestamp: new Date().toISOString()
        }
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: "I couldn't find verified information about that on the DCVC website. Please contact the Diversity Collective team for confirmation at [Contact Us](/contact).",
          citations: [{ title: "Contact Staff", url: "/contact" }],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        text: "Conversation cleared. Ask me about our free health testing, youth groups, center hours, events, or volunteer opportunities.",
        citations: [{ title: "Programs", url: "/programs" }],
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Render markdown links cleanly inside text
  const renderMessageContent = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const linkText = match[1];
      const linkUrl = match[2];

      if (linkUrl.startsWith('/')) {
        parts.push(
          <Link
            key={match.index}
            to={linkUrl}
            onClick={() => setIsOpen(false)}
            className="text-[#5A1E65] font-bold underline hover:text-purple-800 transition-colors"
          >
            {linkText}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A1E65] font-bold underline hover:text-purple-800 transition-colors inline-flex items-center gap-0.5"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      }
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-label="Open Ask DCVC Free AI Community Assistant (Alt + C)"
          title="Ask DCVC (Alt + C)"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9990] flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#5A1E65] via-purple-900 to-[#43144A] text-white shadow-xl hover:shadow-2xl border border-amber-300/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-amber-300 print:hidden"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs tracking-wide text-white leading-tight flex items-center gap-1.5">
              <span>Ask DCVC</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider leading-none">
              Free AI Guide
            </span>
          </div>
        </button>
      )}

      {/* Floating Dialog Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask DCVC Community Assistant"
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100vw-24px)] sm:w-[420px] max-h-[85vh] sm:max-h-[640px] h-[580px] bg-white rounded-3xl shadow-2xl border border-purple-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden"
        >
          {/* Header Bar */}
          <div className="p-4 bg-gradient-to-r from-[#5A1E65] via-purple-900 to-[#3b0764] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-extrabold text-sm tracking-wide text-white">
                    Ask DCVC
                  </h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    100% Free • Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-purple-200">
                  Verified Ventura County Community Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 rounded-xl hover:bg-white/10 text-purple-200 hover:text-white transition-colors cursor-pointer"
                aria-label="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat (Esc)"
                className="p-1.5 rounded-xl hover:bg-white/10 text-purple-200 hover:text-white transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Privacy & Safety Disclaimer Bar */}
          <div className="px-3.5 py-1.5 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[10px] text-purple-900">
            <span className="flex items-center gap-1 font-semibold truncate">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" />
              <span>Informational only • Not medical/legal advice</span>
            </span>
            <span className="text-slate-400 text-[9px] flex-shrink-0 font-medium">
              Alt + C
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center flex-shrink-0 font-bold border border-purple-200">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                      isUser
                        ? 'bg-[#5A1E65] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <div className="leading-relaxed whitespace-pre-wrap break-words font-normal">
                      {renderMessageContent(msg.text)}
                    </div>

                    {/* Official Verified Citations */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <Link
                            key={idx}
                            to={c.url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-[10px] font-bold text-[#5A1E65] border border-purple-200 transition-colors"
                          >
                            <span>{c.title}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-500">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center flex-shrink-0 border border-purple-200">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium text-slate-500 ml-1">
                    Consulting verified DCVC records...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Pills (Horizontal Scroll) */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Suggestions:
            </span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5A1E65] text-[11px] font-semibold border border-slate-200 hover:border-purple-300 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              placeholder="Ask about testing, hours, youth groups..."
              maxLength={300}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-colors cursor-pointer flex-shrink-0"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Micro Footnote */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 text-center">
            Powered by Cloudflare Workers AI • Free tier • No personal health data stored
          </div>
        </div>
      )}
    </>
  );
}

