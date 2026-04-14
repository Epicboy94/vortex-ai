'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, Utensils, Dumbbell, TrendingUp, Target, Zap, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBMICategory, calculateMetabolicBurn, getHoursElapsedToday } from '@/lib/health';
import { Line, Bar } from 'react-chartjs-2';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

interface Profile {
  bmi: number;
  bmr: number;
  weight: number;
  height: number;
  tdee: number;
  streak_count: number;
  name: string;
  activity_level: string;
  fitness_goal: string;
  is_pro: boolean;
  xp: number;
}

interface FoodLog {
  calories: number;
  logged_at: string;
}

interface Workout {
  total_burn: number;
  completed_at: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayBurn, setTodayBurn] = useState(0);
  const [metabolicBurn, setMetabolicBurn] = useState(0);
  const [netCalories, setNetCalories] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ dates: string[]; intake: number[]; burn: number[] }>({
    dates: [], intake: [], burn: [],
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileData) setProfile(profileData as Profile);

      const today = new Date().toISOString().split('T')[0];

      // Today's food logs
      const { data: foodLogs } = await supabase
        .from('food_logs')
        .select('calories, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', today + 'T00:00:00')
        .lte('logged_at', today + 'T23:59:59');

      const totalCals = (foodLogs as FoodLog[] || []).reduce((sum, l) => sum + (l.calories || 0), 0);
      setTodayCalories(totalCals);

      // Today's workouts
      const { data: workouts } = await supabase
        .from('workouts')
        .select('total_burn, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59');

      const totalBurn = (workouts as Workout[] || []).reduce((sum, w) => sum + (w.total_burn || 0), 0);
      setTodayBurn(totalBurn);

      // Calculate metabolism
      const bmr = profileData?.bmr || 1600;
      const hours = getHoursElapsedToday();
      const metaBurn = calculateMetabolicBurn(bmr, hours);
      setMetabolicBurn(metaBurn);

      // Net calories
      setNetCalories(totalCals - totalBurn - metaBurn);

      // Weekly data
      const dates: string[] = [];
      const intake: number[] = [];
      const burn: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(d.toLocaleDateString('en', { weekday: 'short' }));

        const { data: dayFood } = await supabase
          .from('food_logs')
          .select('calories')
          .eq('user_id', user.id)
          .gte('logged_at', dateStr + 'T00:00:00')
          .lte('logged_at', dateStr + 'T23:59:59');

        intake.push((dayFood as FoodLog[] || []).reduce((s, l) => s + (l.calories || 0), 0));

        const { data: dayWorkout } = await supabase
          .from('workouts')
          .select('total_burn')
          .eq('user_id', user.id)
          .gte('completed_at', dateStr + 'T00:00:00')
          .lte('completed_at', dateStr + 'T23:59:59');

        burn.push((dayWorkout as Workout[] || []).reduce((s, w) => s + (w.total_burn || 0), 0));
      }

      setWeeklyData({ dates, intake, burn });
    };
    load();
  }, []);

  // Live metabolic burn update every 60 seconds
  useEffect(() => {
    if (!profile?.bmr) return;
    const interval = setInterval(() => {
      const hours = getHoursElapsedToday();
      const metaBurn = calculateMetabolicBurn(profile.bmr, hours);
      setMetabolicBurn(metaBurn);
      setNetCalories(todayCalories - todayBurn - metaBurn);
    }, 60000);
    return () => clearInterval(interval);
  }, [profile, todayCalories, todayBurn]);

  const bmiCat = profile?.bmi ? getBMICategory(profile.bmi) : null;
  const goalLabel = profile?.fitness_goal === 'lose_weight' ? '🔥 Lose Weight' :
                    profile?.fitness_goal === 'build_muscle' ? '🏋️ Build Muscle' : '❤️ Be Healthy';

  const netColor = netCalories > (profile?.tdee || 2000) * 0.3 ? '#ef4444' :
                   netCalories > 0 ? '#fbbf24' : '#10b981';

  const lineChartData = {
    labels: weeklyData.dates,
    datasets: [
      {
        label: 'Calories In',
        data: weeklyData.intake,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f43f5e',
      },
      {
        label: 'Calories Burned',
        data: weeklyData.burn,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
      },
    ],
  };

  const barChartData = {
    labels: ['Eaten', 'Workout Burn', 'Metabolism', 'Net'],
    datasets: [
      {
        data: [todayCalories, todayBurn, metabolicBurn, Math.abs(netCalories)],
        backgroundColor: ['rgba(244, 63, 94, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(251, 191, 36, 0.4)', `${netColor}60`],
        borderColor: ['#f43f5e', '#f97316', '#fbbf24', netColor],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(75,85,99,0.2)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(75,85,99,0.2)' } },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(75,85,99,0.2)' } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Goal Banner */}
      {profile?.fitness_goal && (
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Target className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p className="text-white text-sm">
            Goal: <span className="font-bold gradient-text">{goalLabel}</span>
            <span className="text-gray-500 ml-2">• Daily Target: {profile.tdee} kcal</span>
          </p>
        </motion.div>
      )}

      {/* Live Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Calories Eaten', value: todayCalories.toLocaleString(), sub: `/ ${profile?.tdee || 2000} kcal`, icon: Utensils, color: '#f43f5e' },
          { label: 'Workout Burn', value: todayBurn.toLocaleString(), sub: 'kcal', icon: Dumbbell, color: '#f97316' },
          { label: 'Metabolism Burn', value: metabolicBurn.toLocaleString(), sub: `kcal (${getHoursElapsedToday().toFixed(1)}h)`, icon: Flame, color: '#fbbf24' },
          { label: 'Net Calories', value: `${netCalories > 0 ? '+' : ''}${netCalories.toLocaleString()}`, sub: netCalories <= 0 ? 'deficit ✅' : 'surplus', icon: Activity, color: netColor },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs">{stat.label}</p>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <h3 className="text-white font-semibold text-sm">Weekly Calorie Trend</h3>
          </div>
          <Line data={lineChartData} options={chartOptions} />
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-semibold text-sm">Today&apos;s Breakdown</h3>
          </div>
          <Bar data={barChartData} options={barOptions} />
        </motion.div>
      </div>

      {/* BMI gauge card */}
      {profile?.bmi && bmiCat && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" /> BMI Analysis
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" strokeWidth="8" fill="none" className="progress-ring-bg" />
                <circle
                  cx="60" cy="60" r="52"
                  strokeWidth="8" fill="none"
                  stroke={bmiCat.color}
                  strokeDasharray={`${(profile.bmi / 40) * 327} 327`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{profile.bmi.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500">BMI</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: bmiCat.color }}>{bmiCat.label}</p>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{bmiCat.description}</p>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Height</p>
                  <p className="text-white font-medium">{profile.height} cm</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Weight</p>
                  <p className="text-white font-medium">{profile.weight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Daily Target</p>
                  <p className="text-white font-medium">{profile.tdee} kcal</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/food-log', label: 'Log Food', desc: 'Track what you ate', icon: Utensils, color: 'from-rose-500 to-red-600' },
          { href: '/dashboard/training', label: 'Start Training', desc: 'AI workout plan', icon: Dumbbell, color: 'from-orange-500 to-amber-600' },
          { href: '/dashboard/coach', label: 'Ask AI Coach', desc: 'Get fitness advice', icon: Zap, color: 'from-amber-500 to-yellow-600' },
        ].map((action, i) => (
          <motion.a
            key={action.href}
            href={action.href}
            className="card group !p-5 flex items-center gap-4 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{action.label}</p>
              <p className="text-gray-500 text-xs">{action.desc}</p>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Pro Teaser for free users */}
      {profile && !profile.is_pro && (
        <motion.div
          className="card !border-amber-500/20 !p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base mb-1">Unlock Vortex Pro</h3>
              <p className="text-gray-500 text-sm mb-3">
                Get AI meal planning, recipe generation, advanced analytics, and more. 
                Earn 2,000 XP for free access or subscribe for ₹50/month.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/xp"
                  className="btn-primary !py-2 !px-4 !text-xs"
                >
                  Earn Free Pro <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-gray-600 text-xs">{profile.xp || 0} / 2,000 XP</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
