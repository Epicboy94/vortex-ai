'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Brain, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) setMessages(data.map((m: { id: string; role: string; content: string }) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save user message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: userMsg.content,
      });

      // Get user context
      const { data: profile } = await supabase
        .from('profiles')
        .select('bmi, weight, height, age, gender, activity_level, tdee')
        .eq('user_id', user.id)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const { data: foodLogs } = await supabase
        .from('food_logs')
        .select('description, calories')
        .eq('user_id', user.id)
        .gte('logged_at', today + 'T00:00:00')
        .lte('logged_at', today + 'T23:59:59');

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          profile,
          todayFood: foodLogs || [],
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const aiMsg: Message = { role: 'assistant', content: data.reply || 'Sorry, I couldn\'t process that.' };
      setMessages((prev) => [...prev, aiMsg]);

      // Save AI message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: aiMsg.content,
      });
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
    }
    setMessages([]);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Fitness Coach</h2>
          <p className="text-gray-500 text-sm">Ask anything about fitness, nutrition, or your progress.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-gray-600 hover:text-red-400 transition-colors" title="Clear chat">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Your AI Fitness Coach</h3>
            <p className="text-gray-500 text-sm max-w-md mb-6">
              I know your BMI, activity level, and what you ate today. Ask me anything!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'How many calories should I eat today?',
                'Suggest a post-workout meal',
                'How to lose belly fat?',
                'Is my BMI healthy?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai'}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="chat-ai flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field flex-1"
          placeholder="Ask your AI coach anything..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary !px-4 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
