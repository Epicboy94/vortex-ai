'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UtensilsCrossed, Loader2, Trash2, TrendingUp, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { awardXP, XP_REWARDS } from '@/lib/xp';

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  logged_at: string;
}

export default function FoodLogPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [food, setFood] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [tdee, setTdee] = useState(2000);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

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

      const batchTime = new Date().toISOString();
      const items = data.items || [{ name: food.trim(), ...data }];

      const rows = items.map((item: { name: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number }) => ({
        user_id: user.id,
        description: item.name || food.trim(),
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        fiber: item.fiber || 0,
        sugar: item.sugar || 0,
        sodium: item.sodium || 0,
        logged_at: batchTime,
      }));

      await supabase.from('food_logs').insert(rows);
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

  const handleDeleteBatch = async (batchTime: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('food_logs').delete().eq('user_id', user.id).eq('logged_at', batchTime);
    loadEntries();
  };

  const toggleBatch = (batchTime: string) => {
    const next = new Set(expandedBatches);
    if (next.has(batchTime)) next.delete(batchTime);
    else next.add(batchTime);
    setExpandedBatches(next);
  };

  const batches = entries.reduce<Record<string, FoodEntry[]>>((acc, entry) => {
    const key = entry.logged_at;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const batchKeys = Object.keys(batches).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const progressPercent = Math.min((totalCalories / tdee) * 100, 100);

  const totals = {
    calories: entries.reduce((s, e) => s + (e.calories || 0), 0),
    protein: entries.reduce((s, e) => s + (e.protein || 0), 0),
    carbs: entries.reduce((s, e) => s + (e.carbs || 0), 0),
    fat: entries.reduce((s, e) => s + (e.fat || 0), 0),
    fiber: entries.reduce((s, e) => s + (e.fiber || 0), 0),
    sugar: entries.reduce((s, e) => s + (e.sugar || 0), 0),
    sodium: entries.reduce((s, e) => s + (e.sodium || 0), 0),
  };
  const macroTotal = totals.protein + totals.carbs + totals.fat;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Food Log</h2>
        <p className="text-gray-500 text-sm">Enter multiple items separated by commas — AI breaks down each one scientifically.</p>
      </div>

      {/* Progress card */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
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
                         'linear-gradient(90deg, #f43f5e, #f97316)',
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
      <form onSubmit={handleAddFood} className="space-y-2">
        <div className="flex gap-3">
          <input
            type="text"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className="input-field flex-1"
            placeholder='e.g. "rice, dal, 2 chapati, chicken curry, raita, salad"'
            disabled={loading}
          />
          <button type="submit" disabled={loading || !food.trim()} className="btn-primary !px-5 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-gray-600 text-[11px] pl-1">Tip: List all foods separated by commas for individual breakdown</p>
      </form>

      {/* Entries grouped by batch */}
      <div className="space-y-3">
        <AnimatePresence>
          {batchKeys.map((batchTime) => {
            const items = batches[batchTime];
            const isMulti = items.length > 1;
            const isExpanded = expandedBatches.has(batchTime) || !isMulti;
            const batchCalories = items.reduce((s, e) => s + (e.calories || 0), 0);
            const batchTime12 = new Date(batchTime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });

            return (
              <motion.div
                key={batchTime}
                className="card !p-0 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                {isMulti && (
                  <button
                    onClick={() => toggleBatch(batchTime)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium text-sm">{items.length} items logged</p>
                        <p className="text-gray-600 text-xs">{batchTime12}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-rose-400 font-bold text-sm">{batchCalories} kcal</span>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleDeleteBatch(batchTime); }}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>
                )}

                {isExpanded && (
                  <div className={isMulti ? 'border-t border-gray-800/50' : ''}>
                    {items.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 border-b border-gray-800/30 last:border-b-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {!isMulti && (
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                              <UtensilsCrossed className="w-5 h-5 text-rose-400" />
                            </div>
                          )}
                          {isMulti && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 ml-2" />}
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{entry.description}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              <span className="text-xs text-violet-400">P: {entry.protein}g</span>
                              <span className="text-xs text-cyan-400">C: {entry.carbs}g</span>
                              <span className="text-xs text-pink-400">F: {entry.fat}g</span>
                              {(entry.fiber > 0) && <span className="text-xs text-emerald-400">Fiber: {entry.fiber}g</span>}
                              {(entry.sugar > 0) && <span className="text-xs text-amber-400">Sugar: {entry.sugar}g</span>}
                              {(entry.sodium > 0) && <span className="text-xs text-orange-400">Na: {entry.sodium}mg</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-rose-400 font-bold text-sm">{entry.calories} kcal</span>
                          <button onClick={() => handleDelete(entry.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No food logged today. Start tracking!</p>
          </div>
        )}
      </div>

      {/* Scientific Nutrition Totals */}
      {entries.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Beaker className="w-4 h-4 text-rose-400" />
            Nutritional Analysis &mdash; Today&apos;s Totals
          </h3>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Calories', value: totals.calories, unit: 'kcal', color: '#f43f5e' },
              { label: 'Protein', value: totals.protein, unit: 'g', color: '#8b5cf6' },
              { label: 'Carbs', value: totals.carbs, unit: 'g', color: '#06b6d4' },
              { label: 'Fat', value: totals.fat, unit: 'g', color: '#ec4899' },
            ].map((m) => (
              <div key={m.label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-gray-500 text-[10px] mt-1">{m.label} ({m.unit})</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Dietary Fiber', value: totals.fiber, unit: 'g', target: 25, color: '#34d399' },
              { label: 'Sugar', value: totals.sugar, unit: 'g', target: 50, color: '#fbbf24' },
              { label: 'Sodium', value: totals.sodium, unit: 'mg', target: 2300, color: '#f97316' },
            ].map((micro) => (
              <div key={micro.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs">{micro.label}</span>
                  <span className="text-xs font-medium" style={{ color: micro.color }}>
                    {micro.value}{micro.unit} / {micro.target}{micro.unit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: micro.color }}
                    animate={{ width: `${Math.min((micro.value / micro.target) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-800/50">
            <p className="text-gray-500 text-[11px] mb-2">Macro Ratio</p>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden">
              {macroTotal > 0 && (
                <>
                  <div className="rounded-l-full transition-all duration-500"
                    style={{ width: `${(totals.protein / macroTotal) * 100}%`, background: '#8b5cf6' }} />
                  <div className="transition-all duration-500"
                    style={{ width: `${(totals.carbs / macroTotal) * 100}%`, background: '#06b6d4' }} />
                  <div className="rounded-r-full transition-all duration-500"
                    style={{ width: `${(totals.fat / macroTotal) * 100}%`, background: '#ec4899' }} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-violet-400">Protein {macroTotal > 0 ? Math.round((totals.protein / macroTotal) * 100) : 0}%</span>
              <span className="text-[10px] text-cyan-400">Carbs {macroTotal > 0 ? Math.round((totals.carbs / macroTotal) * 100) : 0}%</span>
              <span className="text-[10px] text-pink-400">Fat {macroTotal > 0 ? Math.round((totals.fat / macroTotal) * 100) : 0}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
