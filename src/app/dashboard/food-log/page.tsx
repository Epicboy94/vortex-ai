'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UtensilsCrossed, Loader2, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { awardXP, XP_REWARDS } from '@/lib/xp';

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export default function FoodLogPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [food, setFood] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [tdee, setTdee] = useState(2000);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tdee')
      .eq('user_id', user.id)
      .single();
    if (profile?.tdee) setTdee(profile.tdee);

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', today + 'T00:00:00')
      .lte('logged_at', today + 'T23:59:59')
      .order('logged_at', { ascending: false });

    const logs = (data || []) as FoodEntry[];
    setEntries(logs);
    setTotalCalories(logs.reduce((s, e) => s + (e.calories || 0), 0));
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: food.trim() }),
      });
      const data = await res.json();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('food_logs').insert({
        user_id: user.id,
        description: food.trim(),
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        logged_at: new Date().toISOString(),
      });

      // Award XP for logging food
      await awardXP(user.id, XP_REWARDS.LOG_FOOD);

      setFood('');
      loadEntries();
    } catch {
      console.error('Failed to estimate calories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id);
    loadEntries();
  };

  const progressPercent = Math.min((totalCalories / tdee) * 100, 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Food Log</h2>
        <p className="text-gray-500 text-sm">Describe what you ate and AI will estimate the calories instantly.</p>
      </div>

      {/* Progress card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold text-sm">Daily Progress</span>
          </div>
          <span className="text-gray-400 text-sm">{totalCalories} / {tdee} kcal</span>
        </div>
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: progressPercent > 90 ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                         progressPercent > 70 ? 'linear-gradient(90deg, #fbbf24, #f97316)' :
                         'linear-gradient(90deg, #8b5cf6, #06b6d4)',
            }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {totalCalories < tdee
            ? `${tdee - totalCalories} kcal remaining`
            : `${totalCalories - tdee} kcal over target`}
        </p>
      </motion.div>

      {/* Add food form */}
      <form onSubmit={handleAddFood} className="flex gap-3">
        <input
          type="text"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          className="input-field flex-1"
          placeholder='e.g. "2 chapati with dal and rice" or "Big Mac with fries"'
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !food.trim()}
          className="btn-primary !px-5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </button>
      </form>

      {/* Entries list */}
      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              className="card !p-4 flex items-center justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{entry.description}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">P: {entry.protein}g</span>
                    <span className="text-xs text-gray-500">C: {entry.carbs}g</span>
                    <span className="text-xs text-gray-500">F: {entry.fat}g</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-purple-400 font-bold text-sm">{entry.calories} kcal</span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No food logged today. Start tracking!</p>
          </div>
        )}
      </div>

      {/* Macros summary */}
      {entries.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-white font-semibold text-sm mb-4">Today&apos;s Macros</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Protein', value: entries.reduce((s, e) => s + e.protein, 0), color: '#8b5cf6' },
              { label: 'Carbs', value: entries.reduce((s, e) => s + e.carbs, 0), color: '#06b6d4' },
              { label: 'Fat', value: entries.reduce((s, e) => s + e.fat, 0), color: '#ec4899' },
            ].map((macro) => (
              <div key={macro.label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: macro.color }}>{macro.value}g</p>
                <p className="text-gray-500 text-xs mt-1">{macro.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
