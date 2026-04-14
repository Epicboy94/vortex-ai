'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Ruler, Weight, Activity, Save, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { calculateBMI, calculateBMR, calculateTDEE } from '@/lib/health';

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
    const tdee = calculateTDEE(bmr, activityLevel);

    await supabase.from('profiles').update({
      name,
      age: a,
      gender,
      height: h,
      weight: w,
      activity_level: activityLevel,
      bmi: calculateBMI(w, h),
      bmr,
      tdee,
    }).eq('user_id', user.id);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will delete all your data permanently.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('workouts').delete().eq('user_id', user.id);
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('meal_plans').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      <motion.div className="card space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
