'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

// Simple markdown-like renderer for bold text and bullet points
function FormatMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        // Bold text: **text**
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
        // Bullet points
        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
        const isEmojiBullet = /^[⚡💪🔥🎯🏆👑💎🌟📊✅❌]/.test(line.trim());

        if (isBullet) {
          return (
            <p key={i} className="text-sm pl-2 flex items-start gap-2">
              <span className="text-rose-400 mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•\-*]\s*/, '') }} />
            </p>
          );
        }
        if (isEmojiBullet) {
          return (
            <p key={i} className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: formattedLine }} />
          );
        }
        return (
          <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      })}
    </div>
  );
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState('');
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('fitness_goal')
      .eq('user_id', user.id)
      .single();
    if (profile) setFitnessGoal(profile.fitness_goal || '');

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
        .select('bmi, weight, height, age, gender, activity_level, tdee, fitness_goal')
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

  // Goal-specific quick prompts
  const quickPrompts = fitnessGoal === 'lose_weight' ? [
    'What should I eat to lose weight fast?',
    'Best fat-burning exercises for me?',
    'Am I eating too many calories today?',
    'How to break a weight loss plateau?',
  ] : fitnessGoal === 'build_muscle' ? [
    'How much protein do I need daily?',
    'Best muscle-building workout split?',
    'Should I eat more for muscle gain?',
    'How to maximize recovery?',
  ] : [
    'How many calories should I eat today?',
    'Suggest a balanced post-workout meal',
    'Am I on track with my fitness?',
    'Tips for better sleep and recovery?',
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-400" />
            VORTEX Coach
          </h2>
          <p className="text-gray-500 text-sm">Your elite AI fitness coach. Bold advice, real results.</p>
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mb-4">
              <Zap className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">💪 Ready to Crush It?</h3>
            <p className="text-gray-500 text-sm max-w-md mb-6">
              I know your BMI, your goal, and what you ate today. Ask me anything and I&apos;ll give you 
              <span className="text-rose-400 font-semibold"> straight-up, no-BS advice</span> with exact numbers.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/15 text-gray-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
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
            <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai !border-l-2 !border-l-rose-500/40'}>
              {msg.role === 'assistant' ? (
                <FormatMessage content={msg.content} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="chat-ai flex items-center gap-2 !border-l-2 !border-l-rose-500/40">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span className="text-sm text-gray-400">VORTEX is analyzing...</span>
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
          placeholder="Ask VORTEX anything about fitness, nutrition, training..."
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
