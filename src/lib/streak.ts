import { supabase } from './supabase';

export async function checkAndUpdateStreak(userId: string): Promise<{ streak: number; isNewDay: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, last_active_date')
    .eq('user_id', userId)
    .single();

  if (!profile) return { streak: 1, isNewDay: true };

  const today = new Date().toISOString().split('T')[0];
  const lastActive = profile.last_active_date;

  if (lastActive === today) {
    return { streak: profile.streak_count || 1, isNewDay: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (lastActive === yesterdayStr) {
    newStreak = (profile.streak_count || 0) + 1;
  } else {
    newStreak = 1;
  }

  await supabase
    .from('profiles')
    .update({ streak_count: newStreak, last_active_date: today })
    .eq('user_id', userId);

  return { streak: newStreak, isNewDay: true };
}

export function getStreakMilestone(streak: number): string | null {
  const milestones: Record<number, string> = {
    7: '🔥 1 Week Warrior!',
    14: '⚡ 2 Week Champion!',
    30: '🏆 Monthly Master!',
    60: '💎 Diamond Dedication!',
    90: '👑 Quarterly King!',
    180: '🌟 Half-Year Hero!',
    365: '🎯 Yearly Legend!',
  };
  return milestones[streak] || null;
}
