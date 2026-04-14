'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, LayoutDashboard, UtensilsCrossed, Dumbbell,
  Brain, ChefHat, Settings, LogOut, Menu, X, Flame, Trophy, Crown, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { checkAndUpdateStreak, getStreakMilestone } from '@/lib/streak';
import { claimDailyLoginXP, getLevelFromXP, BADGES } from '@/lib/xp';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/food-log', label: 'Food Log', icon: UtensilsCrossed },
  { href: '/dashboard/training', label: 'Training', icon: Dumbbell },
  { href: '/dashboard/coach', label: 'AI Coach', icon: Brain },
  { href: '/dashboard/meal-planner', label: 'Meal Planner', icon: ChefHat },
  { href: '/dashboard/xp', label: 'XP & Rewards', icon: Trophy },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [streak, setStreak] = useState(0);
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPro, setIsPro] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [xpToast, setXPToast] = useState<string | null>(null);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, streak_count, xp, level, is_pro')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserName(profile.name || user.email?.split('@')[0] || 'User');
        setXP(profile.xp || 0);
        setLevel(profile.level || getLevelFromXP(profile.xp || 0));
        setIsPro(profile.is_pro || false);
      }

      // Streak
      const streakResult = await checkAndUpdateStreak(user.id);
      setStreak(streakResult.streak);
      if (streakResult.isNewDay) {
        const m = getStreakMilestone(streakResult.streak);
        setMilestone(m);
        if (m) setTimeout(() => setMilestone(null), 5000);
      }

      // Daily login XP
      const xpResult = await claimDailyLoginXP(user.id);
      if (xpResult.awarded) {
        setXP(xpResult.newXP);
        setLevel(getLevelFromXP(xpResult.newXP));
        setXPToast('+25 XP Daily Login');
        setTimeout(() => setXPToast(null), 3000);

        if (xpResult.newBadges.length > 0) {
          const badge = BADGES.find(b => b.id === xpResult.newBadges[0]);
          if (badge) {
            setBadgeToast(`${badge.emoji} Badge Unlocked: ${badge.name}!`);
            setTimeout(() => setBadgeToast(null), 5000);
          }
        }
      }
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-[#020617]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col fixed inset-y-0 z-40">
        <div className="flex flex-col flex-1 glass border-r border-gray-800 p-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
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
                {item.label === 'XP & Rewards' && (
                  <span className="ml-auto text-xs font-bold text-amber-400">{xp}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Upgrade for free users */}
          {!isPro && (
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">Upgrade to Pro</span>
              </div>
              <p className="text-gray-500 text-[10px] leading-relaxed">Earn 2,000 XP or subscribe for ₹50/mo</p>
            </div>
          )}

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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
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
                {isPro && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-bold text-white">
                    <Star className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* XP badge */}
              <Link
                href="/dashboard/xp"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-bold text-xs">Lv.{level}</span>
              </Link>

              {/* Streak badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-4 h-4 text-orange-400 animate-flame" />
                <span className="text-orange-400 font-bold text-sm">{streak}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Toast notifications */}
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

        {xpToast && (
          <motion.div
            className="fixed top-20 right-4 z-50 card !p-3 !border-amber-500/30 !bg-amber-500/5"
            initial={{ opacity: 0, y: -20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <p className="text-amber-400 font-bold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> {xpToast}
            </p>
          </motion.div>
        )}

        {badgeToast && (
          <motion.div
            className="fixed top-32 right-4 z-50 card !p-4 !border-rose-500/30 !bg-rose-500/5"
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <p className="text-rose-400 font-bold text-sm">{badgeToast}</p>
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
