'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Ruler, Weight, Activity, Save, Loader2, LogOut, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { calculateBMI, calculateBMR, calculateTDEE, adjustTDEEForGoal } from '@/lib/health';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WeightEntry {
  weight: number;
  logged_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('be_healthy');

  // Weight logging
  const [newWeight, setNewWeight] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [lastWeightDate, setLastWeightDate] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (data) {
        setName(data.name || '');
        setAge(String(data.age || ''));
        setGender(data.gender || '');
        setHeight(String(data.height || ''));
        setWeight(String(data.weight || ''));
        setActivityLevel(data.activity_level || '');
        setFitnessGoal(data.fitness_goal || 'be_healthy');
      }

      // Load weight history (last 30 entries)
      const { data: weights } = await supabase
        .from('weight_logs')
        .select('weight, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true })
        .limit(30);

      if (weights && weights.length > 0) {
        setWeightHistory(weights as WeightEntry[]);
        setLastWeightDate(weights[weights.length - 1].logged_at);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);
    const bmr = calculateBMR(w, h, a, gender);
    const baseTdee = calculateTDEE(bmr, activityLevel);
    const tdee = adjustTDEEForGoal(baseTdee, fitnessGoal);

    await supabase.from('profiles').update({
      name,
      age: a,
      gender,
      height: h,
      weight: w,
      activity_level: activityLevel,
      fitness_goal: fitnessGoal,
      bmi: calculateBMI(w, h),
      bmr,
      tdee,
    }).eq('user_id', user.id);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogWeight = async () => {
    if (!newWeight) return;
    setWeightLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const w = Number(newWeight);

    await supabase.from('weight_logs').insert({
      user_id: user.id,
      weight: w,
    });

    // Also update profile weight
    const h = Number(height);
    const a = Number(age);
    const bmr = calculateBMR(w, h, a, gender);
    const baseTdee = calculateTDEE(bmr, activityLevel);
    const tdee = adjustTDEEForGoal(baseTdee, fitnessGoal);

    await supabase.from('profiles').update({
      weight: w,
      bmi: calculateBMI(w, h),
      bmr,
      tdee,
    }).eq('user_id', user.id);

    setWeight(String(w));
    setNewWeight('');
    setWeightLoading(false);

    // Reload weight history
    const { data: weights } = await supabase
      .from('weight_logs')
      .select('weight, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(30);

    if (weights) {
      setWeightHistory(weights as WeightEntry[]);
      setLastWeightDate(weights[weights.length - 1]?.logged_at || '');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will delete all your data permanently.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('workouts').delete().eq('user_id', user.id);
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('meal_plans').delete().eq('user_id', user.id);
      await supabase.from('weight_logs').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  // Weight change calculation
  const weightChange = weightHistory.length >= 2
    ? (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)
    : null;

  // Days since last weight log
  const daysSinceLastLog = lastWeightDate
    ? Math.floor((Date.now() - new Date(lastWeightDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const weightChartData = {
    labels: weightHistory.map(w => new Date(w.logged_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Weight (kg)',
      data: weightHistory.map(w => w.weight),
      borderColor: '#f43f5e',
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#f43f5e',
    }],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Weight Logging Section */}
      <motion.div className="card space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-rose-400" /> Log Your Weight
          </h3>
          {daysSinceLastLog >= 7 && (
            <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold animate-pulse">
              📊 Time to log!
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="input-field flex-1"
            placeholder="Enter current weight (kg)"
            step="0.1"
          />
          <button
            onClick={handleLogWeight}
            disabled={weightLoading || !newWeight}
            className="btn-primary !px-5 disabled:opacity-50"
          >
            {weightLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log'}
          </button>
        </div>

        {weightChange && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
            {Number(weightChange) < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            )}
            <span className={`text-sm font-medium ${Number(weightChange) < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Number(weightChange) > 0 ? '+' : ''}{weightChange} kg
            </span>
            <span className="text-gray-600 text-xs">over {weightHistory.length} logs</span>
          </div>
        )}

        {weightHistory.length > 1 && (
          <div className="pt-2">
            <Line
              data={weightChartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                  y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(75,85,99,0.2)' } },
                },
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Profile Settings */}
      <motion.div className="card space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div>
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2"><Ruler className="w-4 h-4" /> Height (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2"><Weight className="w-4 h-4" /> Weight (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Activity Level</label>
          <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="input-field">
            <option value="">Select</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly Active</option>
            <option value="moderate">Moderately Active</option>
            <option value="active">Very Active</option>
            <option value="very_active">Extremely Active</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Fitness Goal</label>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} className="input-field">
            <option value="lose_weight">🔥 Lose Weight</option>
            <option value="be_healthy">❤️ Be Healthy</option>
            <option value="build_muscle">🏋️ Build Muscle</option>
          </select>
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center !py-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 className="text-red-400 font-semibold text-sm mb-3">Danger Zone</h3>
        <p className="text-gray-500 text-sm mb-4">Permanently delete your account and all associated data.</p>
        <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Delete Account
        </button>
      </motion.div>
    </div>
  );
}
