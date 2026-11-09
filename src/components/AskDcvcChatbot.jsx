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
 * Luna — Free Community AI Chatbot
 * Powered by Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct-fp8)
 * $0 recurring cost, 100% free community assistant
 */
export default function AskDcvcChatbot() {
  // Luna is enabled by default (set VITE_ENABLE_CHATBOT=false to explicitly disable)
  const isEnabled = import.meta.env.VITE_ENABLE_CHATBOT !== 'false';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm Luna, your free community guide. Ask me about our free health testing, youth groups, center hours, events, or volunteer opportunities.",
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

  // Lock background scrolling on desktop and mobile when Luna chat is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      const originalOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.overscrollBehavior = originalOverscroll;
      };
    }
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

  // Comprehensive markdown formatter for chatbot messages (renders bold, links, lists; zero raw asterisks)
  const renderMessageContent = (rawText, isUser = false) => {
    if (!rawText) return null;

    // Split text into lines to preserve structured line breaks and handle lists
    const lines = rawText.split('\n');

    const renderInline = (str, lineKey) => {
      // Regex matching:
      // 1. [Link text](url) -> group 1: full link, group 2: text, group 3: url
      // 2. **bold** or __bold__ -> group 4: bold text
      // 3. *italic* or _italic_ -> group 5: italic text
      // 4. `code` -> group 6: code text
      const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\))|(?:\*\*|__)([^*_]+?)(?:\*\*|__)|(?:\*|_)([^*_]+?)(?:\*|_)|`([^`]+)`/g;

      const elements = [];
      let lastIndex = 0;
      let match;
      let tokenIdx = 0;

      while ((match = tokenRegex.exec(str)) !== null) {
        // Preceding plain text (strip any stray asterisks)
        if (match.index > lastIndex) {
          const plain = str.slice(lastIndex, match.index).replace(/\*+/g, '');
          if (plain) {
            elements.push(<span key={`${lineKey}-txt-${tokenIdx++}`}>{plain}</span>);
          }
        }

        if (match[1]) {
          // It's a markdown link [text](url)
          const linkText = match[2];
          const linkUrl = match[3];

          if (linkUrl.startsWith('/')) {
            elements.push(
              <Link
                key={`${lineKey}-lnk-${tokenIdx++}`}
                to={linkUrl}
                onClick={() => setIsOpen(false)}
                className={isUser ? "text-amber-200 font-bold underline" : "text-[#5A1E65] font-bold underline hover:text-purple-800 transition-colors"}
              >
                {linkText}
              </Link>
            );
          } else {
            elements.push(
              <a
                key={`${lineKey}-ext-${tokenIdx++}`}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={isUser ? "text-amber-200 font-bold underline inline-flex items-center gap-0.5" : "text-[#5A1E65] font-bold underline hover:text-purple-800 transition-colors inline-flex items-center gap-0.5"}
              >
                <span>{linkText}</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            );
          }
        } else if (match[4]) {
          // Bold text: **text**
          elements.push(
            <strong
              key={`${lineKey}-bld-${tokenIdx++}`}
              className={isUser ? "font-black text-white" : "font-extrabold text-slate-950"}
            >
              {match[4]}
            </strong>
          );
        } else if (match[5]) {
          // Italic text: *text*
          elements.push(
            <em
              key={`${lineKey}-em-${tokenIdx++}`}
              className={isUser ? "italic text-purple-100" : "italic font-medium text-slate-700"}
            >
              {match[5]}
            </em>
          );
        } else if (match[6]) {
          // Inline code: `code`
          elements.push(
            <code
              key={`${lineKey}-code-${tokenIdx++}`}
              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]"
            >
              {match[6]}
            </code>
          );
        }

        lastIndex = tokenRegex.lastIndex;
      }

      // Trailing plain text (strip any stray asterisks)
      if (lastIndex < str.length) {
        const trailing = str.slice(lastIndex).replace(/\*+/g, '');
        if (trailing) {
          elements.push(<span key={`${lineKey}-tail`}>{trailing}</span>);
        }
      }

      return elements;
    };

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={`empty-${idx}`} className="h-1.5" />;
      }

      // Check for bullet list item: starts with •, *, or -
      const listMatch = trimmed.match(/^(?:•|\*|-)\s+(.+)$/);
      if (listMatch) {
        return (
          <div key={`li-${idx}`} className="flex items-start gap-2 pl-1 py-0.5">
            <span className={isUser ? "text-amber-300 font-bold leading-tight" : "text-[#5A1E65] font-bold leading-tight"}>•</span>
            <div className="flex-1 leading-relaxed">
              {renderInline(listMatch[1], `li-${idx}`)}
            </div>
          </div>
        );
      }

      return (
        <div key={`p-${idx}`} className="leading-relaxed">
          {renderInline(line, `p-${idx}`)}
        </div>
      );
    });
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
          aria-label="Open Luna Free AI Community Assistant (Alt + C)"
          title="Ask Luna (Alt + C)"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9995] flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-[#5A1E65] via-purple-900 to-[#43144A] text-white shadow-xl hover:shadow-2xl border-2 border-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-amber-300 print:hidden"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs tracking-wide text-white leading-tight flex items-center gap-1.5 whitespace-nowrap">
              <span>Ask Luna</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider leading-none whitespace-nowrap">
              Free AI Guide
            </span>
          </div>
        </button>
      )}

      {/* Backdrop overlay for mobile to lock screen touches and prevent background scroll */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-slate-950/45 backdrop-blur-xs transition-opacity duration-200 sm:hidden overscroll-contain"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Dialog Window - Robust screen-fixed positioning */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Luna • DCVC Community Guide"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[420px] max-h-[calc(100dvh-24px)] sm:max-h-[640px] h-[min(580px,calc(100dvh-24px))] bg-white rounded-3xl shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden z-[9999] overscroll-contain"
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
                    Luna
                  </h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    100% Free • Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-purple-200">
                  DCVC Community Guide • Ventura County
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs overscroll-contain">
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
                      {renderMessageContent(msg.text, isUser)}
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

