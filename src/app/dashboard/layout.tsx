'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, LayoutDashboard, UtensilsCrossed, Dumbbell,
  Brain, ChefHat, Settings, LogOut, Menu, X, Flame
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { checkAndUpdateStreak, getStreakMilestone } from '@/lib/streak';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/food-log', label: 'Food Log', icon: UtensilsCrossed },
  { href: '/dashboard/training', label: 'Training', icon: Dumbbell },
  { href: '/dashboard/coach', label: 'AI Coach', icon: Brain },
  { href: '/dashboard/meal-planner', label: 'Meal Planner', icon: ChefHat },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, streak_count')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserName(profile.name || user.email?.split('@')[0] || 'User');
      }

      const streakResult = await checkAndUpdateStreak(user.id);
      setStreak(streakResult.streak);
      if (streakResult.isNewDay) {
        const m = getStreakMilestone(streakResult.streak);
        setMilestone(m);
        if (m) setTimeout(() => setMilestone(null), 5000);
      }
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-[#030712]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col fixed inset-y-0 z-40">
        <div className="flex flex-col flex-1 glass border-r border-gray-800 p-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Vortex AI</span>
          </Link>

          {/* Nav links */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-4 mt-4 space-y-1">
            <Link href="/dashboard/settings" className={`sidebar-link ${pathname === '/dashboard/settings' ? 'active' : ''}`}>
              <Settings className="w-5 h-5" /> Settings
            </Link>
            <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-64 glass border-r border-gray-800 p-4"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">Vortex AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-800 pt-4 mt-4 space-y-1">
              <button onClick={handleLogout} className="sidebar-link w-full text-red-400">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-gray-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-white font-semibold text-sm sm:text-base">
                Welcome back, <span className="gradient-text">{userName}</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-4 h-4 text-orange-400 animate-flame" />
                <span className="text-orange-400 font-bold text-sm">{streak}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Milestone toast */}
        {milestone && (
          <motion.div
            className="fixed top-20 right-4 z-50 card !p-4 !border-orange-500/30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <p className="text-white font-semibold text-sm">{milestone}</p>
          </motion.div>
        )}

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
