'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, User } from 'lucide-react';
import { getStylistAdvice } from '../services/geminiService';

const AIStylist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your All in cloth personal stylist. What can I help you find today? Looking for something for a special event or just updating your wardrobe?" }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const advice = await getStylistAdvice(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', text: advice }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again soon." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Trigger Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-neutral-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center space-x-2 group"
        >
          <Sparkles className="group-hover:animate-pulse" size={24} />
          <span className="font-medium pr-2 hidden sm:inline">Ask a Stylist</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-3rem)] sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="bg-neutral-900 p-1.5 rounded-lg text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">All in cloth Stylist</h3>
                <p className="text-[10px] text-neutral-500 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Online Now
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-neutral-900 text-white rounded-tr-none' 
                    : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 p-3 rounded-2xl rounded-tl-none flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-neutral-100">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="How should I style the silk dress?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-neutral-50 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-neutral-200 outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !query.trim()}
                className="absolute right-2 p-2 text-neutral-400 hover:text-neutral-900 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 text-center uppercase tracking-widest">Powered by Gemini AI</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStylist;

