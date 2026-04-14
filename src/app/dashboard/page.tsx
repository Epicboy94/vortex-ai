'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, Utensils, Dumbbell, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBMICategory } from '@/lib/health';
import { Line, Bar } from 'react-chartjs-2';
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
  weight: number;
  height: number;
  tdee: number;
  streak_count: number;
  name: string;
  activity_level: string;
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

  const bmiCat = profile?.bmi ? getBMICategory(profile.bmi) : null;

  const lineChartData = {
    labels: weeklyData.dates,
    datasets: [
      {
        label: 'Calories In',
        data: weeklyData.intake,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
      },
      {
        label: 'Calories Burned',
        data: weeklyData.burn,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
      },
    ],
  };

  const barChartData = {
    labels: ['Intake', 'Burned', 'Target'],
    datasets: [
      {
        data: [todayCalories, todayBurn, profile?.tdee || 2000],
        backgroundColor: ['rgba(139, 92, 246, 0.6)', 'rgba(6, 182, 212, 0.6)', 'rgba(236, 72, 153, 0.3)'],
        borderColor: ['#8b5cf6', '#06b6d4', '#ec4899'],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(75,85,99,0.2)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(75,85,99,0.2)' } },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(75,85,99,0.2)' } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'BMI', value: profile?.bmi?.toFixed(1) || '--', sub: bmiCat?.label || '', icon: Activity, color: bmiCat?.color || '#8b5cf6' },
          { label: 'Calories Today', value: todayCalories.toLocaleString(), sub: `/ ${profile?.tdee || 2000} kcal`, icon: Utensils, color: '#8b5cf6' },
          { label: 'Burned Today', value: todayBurn.toLocaleString(), sub: 'kcal', icon: Flame, color: '#06b6d4' },
          { label: 'Target Burn', value: Math.round(todayCalories * 0.5).toLocaleString(), sub: 'kcal (50% of intake)', icon: Target, color: '#ec4899' },
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
        {/* Weekly trend */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold text-sm">Weekly Calorie Trend</h3>
          </div>
          <Line data={lineChartData} options={chartOptions} />
        </motion.div>

        {/* Today's summary */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold text-sm">Today&apos;s Summary</h3>
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
            {/* BMI Circle */}
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
          { href: '/dashboard/food-log', label: 'Log Food', desc: 'Track what you ate', icon: Utensils, color: 'from-purple-500 to-violet-600' },
          { href: '/dashboard/training', label: 'Start Training', desc: 'AI workout plan', icon: Dumbbell, color: 'from-cyan-500 to-blue-600' },
          { href: '/dashboard/coach', label: 'Ask AI Coach', desc: 'Get fitness advice', icon: Activity, color: 'from-pink-500 to-rose-600' },
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
    </div>
  );
}
