'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Lock, Crown, Flame, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BADGES, getLevelFromXP, getXPForNextLevel, getEarnedBadges } from '@/lib/xp';

export default function XPPage() {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, badges, is_pro')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setXP(profile.xp || 0);
        setLevel(profile.level || getLevelFromXP(profile.xp || 0));
        setBadges(profile.badges || []);
        setIsPro(profile.is_pro || false);
      }
    };
    load();
  }, []);

  const { current, needed, progress } = getXPForNextLevel(xp);
  const earnedBadges = getEarnedBadges(xp);
  const proProgress = Math.min((xp / 2000) * 100, 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          XP & Rewards
        </h2>
        <p className="text-gray-500 text-sm">Earn XP by staying active. Unlock badges and Pro access!</p>
      </div>

      {/* Level & XP Card */}
      <motion.div
        className="card !p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{level}</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Level {level}</p>
              <p className="text-gray-500 text-sm">{xp.toLocaleString()} Total XP</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{xp}</span>
          </div>
        </div>

        {/* Level progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">Level {level}</span>
            <span className="text-gray-500 text-xs">Level {level + 1}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1.5">{current} / {needed} XP to next level</p>
        </div>
      </motion.div>

      {/* XP Earning Guide */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          How to Earn XP
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { action: 'Daily Login', xp: '+25 XP', icon: '📆', color: 'text-emerald-400' },
            { action: 'Log Food', xp: '+10 XP', icon: '🍽️', color: 'text-blue-400' },
            { action: 'Complete Workout', xp: '+50 XP', icon: '💪', color: 'text-orange-400' },
            { action: 'Generate Meal Plan', xp: '+15 XP', icon: '🥗', color: 'text-green-400' },
            { action: '7-Day Streak Bonus', xp: '+100 XP', icon: '🔥', color: 'text-red-400' },
            { action: '30-Day Streak Bonus', xp: '+500 XP', icon: '🏆', color: 'text-amber-400' },
          ].map((item) => (
            <div key={item.action} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{item.action}</p>
              </div>
              <span className={`text-xs font-bold ${item.color}`}>{item.xp}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pro Unlock Progress */}
      {!isPro && (
        <motion.div
          className="card !border-amber-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Unlock Pro for FREE</h3>
              <p className="text-gray-500 text-xs">Reach 2,000 XP to unlock Vortex Pro permanently!</p>
            </div>
          </div>
          <div className="h-4 rounded-full bg-gray-800 overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${proProgress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">{xp.toLocaleString()} / 2,000 XP</span>
            <span className="text-amber-400 text-xs font-bold">
              {xp >= 2000 ? '🎉 Unlocked!' : `${(2000 - xp).toLocaleString()} XP to go`}
            </span>
          </div>
        </motion.div>
      )}

      {isPro && (
        <motion.div
          className="card !border-amber-500/30 !bg-amber-500/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            <div>
              <h3 className="text-amber-400 font-bold text-lg">You&apos;re Vortex Pro! 👑</h3>
              <p className="text-gray-400 text-sm">All premium features unlocked</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Badges Gallery */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const isEarned = badges.includes(badge.id) || earnedBadges.some(b => b.id === badge.id);
            return (
              <motion.div
                key={badge.id}
                className={`relative p-4 rounded-xl text-center transition-all ${
                  isEarned
                    ? 'bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/20'
                    : 'bg-white/[0.02] border border-white/5 opacity-50'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                {!isEarned && (
                  <Lock className="w-3 h-3 text-gray-600 absolute top-2 right-2" />
                )}
                <span className="text-3xl block mb-2">{badge.emoji}</span>
                <p className={`text-sm font-semibold ${isEarned ? 'text-white' : 'text-gray-600'}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                <p className={`text-xs mt-2 font-medium ${isEarned ? 'text-rose-400' : 'text-gray-600'}`}>
                  {badge.xpRequired.toLocaleString()} XP
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* XP Tips */}
      <motion.div
        className="card !p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm">Pro Tip</p>
            <p className="text-gray-500 text-xs mt-1">
              Log food daily, complete your workouts, and maintain your streak. A 30-day streak alone gives you 500 XP bonus! 
              Consistent users can unlock Pro in under 2 months. 🚀
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
