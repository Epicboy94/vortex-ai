'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Loader2, CheckCircle2, RefreshCw, Timer, Flame, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Exercise {
  name: string;
  duration: string;
  calories_burn: number;
  instructions: string;
  intensity: string;
}

export default function TrainingPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [targetBurn, setTargetBurn] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [totalBurned, setTotalBurned] = useState(0);

  useEffect(() => {
    loadCalories();
  }, []);

  const loadCalories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('food_logs')
      .select('calories')
      .eq('user_id', user.id)
      .gte('logged_at', today + 'T00:00:00')
      .lte('logged_at', today + 'T23:59:59');

    const total = (data || []).reduce((s: number, l: { calories: number }) => s + (l.calories || 0), 0);
    setTodayCalories(total);
    setTargetBurn(Math.round(total * 0.5));
  };

  const generateExercises = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('weight, height, age, gender, activity_level')
        .eq('user_id', user.id)
        .single();

      const res = await fetch('/api/ai/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBurn: targetBurn || 500,
          profile: profile || {},
        }),
      });
      const data = await res.json();
      setExercises(data.exercises || []);
      setCompleted(new Set());
      setTotalBurned(0);
    } catch {
      console.error('Failed to generate exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (idx: number) => {
    const newCompleted = new Set(completed);
    newCompleted.add(idx);
    setCompleted(newCompleted);

    const burned = exercises
      .filter((_, i) => newCompleted.has(i))
      .reduce((s, e) => s + e.calories_burn, 0);
    setTotalBurned(burned);

    // If all completed, save workout
    if (newCompleted.size === exercises.length) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('workouts').insert({
          user_id: user.id,
          exercises: exercises,
          total_burn: burned,
          completed_at: new Date().toISOString(),
        });
      }
    }
  };

  const intensityColor: Record<string, string> = {
    Low: '#34d399',
    Medium: '#fbbf24',
    High: '#f97316',
    Extreme: '#ef4444',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Training</h2>
        <p className="text-gray-500 text-sm">AI generates a workout based on your calorie intake — burn 50% of what you eat.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{todayCalories}</p>
          <p className="text-gray-500 text-xs">Calories In</p>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Zap className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold gradient-text">{targetBurn}</p>
          <p className="text-gray-500 text-xs">Target Burn</p>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-400">{totalBurned}</p>
          <p className="text-gray-500 text-xs">Burned</p>
        </motion.div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateExercises}
        disabled={loading}
        className="btn-primary w-full justify-center !py-3"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating Workout...</>
        ) : exercises.length > 0 ? (
          <><RefreshCw className="w-5 h-5" /> Regenerate Workout</>
        ) : (
          <><Dumbbell className="w-5 h-5" /> Generate AI Workout</>
        )}
      </button>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <motion.div
            key={i}
            className={`card !p-5 ${completed.has(i) ? 'border-green-500/30 bg-green-500/5' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">{ex.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      color: intensityColor[ex.intensity] || '#9ca3af',
                      backgroundColor: `${intensityColor[ex.intensity] || '#9ca3af'}20`,
                    }}
                  >
                    {ex.intensity}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">{ex.instructions}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {ex.duration}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {ex.calories_burn} kcal</span>
                </div>
              </div>
              <button
                onClick={() => handleComplete(i)}
                disabled={completed.has(i)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  completed.has(i)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-800 text-gray-500 hover:bg-purple-500/20 hover:text-purple-400'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {exercises.length === 0 && !loading && (
          <div className="text-center py-16">
            <Dumbbell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Log some food first, then generate your workout!</p>
          </div>
        )}
      </div>
    </div>
  );
}
