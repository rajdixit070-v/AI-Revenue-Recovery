import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Bot, Send, X, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "What's putting revenue at risk?",
  "Show high-risk cases",
  "Why was this case blocked?",
  "How much did we recover?",
  "Summarize latest evaluation",
];

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am RecoverAI Copilot. Ask me about your revenue at risk, recovery policies, or case details.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (customMessage) => {
    const query = customMessage || input;
    if (!query || query.trim().length === 0 || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);

    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const res = await api.sendCopilotMessage(query);
      const botText = res.data?.message || 'RecoverAI Copilot analyzed your request.';
      setMessages((prev) => [...prev, { sender: 'bot', text: botText, refused: res.data?.refusedFinancialAction }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: err.message || 'I couldn\'t retrieve that information right now.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-full shadow-xl shadow-indigo-600/30 border border-indigo-400/30 transition-all hover:scale-105 cursor-pointer"
        >
          <Bot className="w-5 h-5" />
          <span className="text-xs font-bold">RecoverAI Copilot</span>
        </button>
      )}

      {/* Copilot Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] h-[540px] bg-[#0E162B] rounded-3xl shadow-2xl border border-white/[0.08] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 backdrop-blur-2xl text-slate-100">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0B101E] to-[#121B32] text-white flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  RecoverAI Copilot <Sparkles className="w-3 h-3 text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400">Ask about your revenue recovery</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] text-indigo-300 font-medium">
              Read-only assistant. Financial actions remain governed by Policy Engine.
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080C14]/40 scrollbar-none">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-br-none shadow-md'
                      : m.refused
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-bl-none'
                      : 'bg-white/[0.04] border border-white/[0.06] text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Bot className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Copilot is checking recovery data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          <div className="px-3 py-2 bg-[#0B101E]/60 border-t border-white/[0.04] flex gap-1.5 overflow-x-auto scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 text-[10px] font-medium bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 border border-white/[0.06] rounded-full shrink-0 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#0B101E]/80 border-t border-white/[0.06] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot a question..."
              className="flex-1 px-3 py-2 text-xs bg-white/[0.03] border border-white/[0.08] text-white rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
