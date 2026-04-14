import { supabase } from './supabase';

// XP earning amounts
export const XP_REWARDS = {
  DAILY_LOGIN: 25,
  LOG_FOOD: 10,
  COMPLETE_WORKOUT: 50,
  GENERATE_MEAL: 15,
  STREAK_7: 100,
  STREAK_30: 500,
} as const;

// Badge definitions
export const BADGES = [
  { id: 'first_steps', name: 'First Steps', emoji: '🔥', xpRequired: 50, description: 'Earned 50 XP' },
  { id: 'momentum', name: 'Momentum', emoji: '⚡', xpRequired: 200, description: 'Earned 200 XP' },
  { id: 'dedicated', name: 'Dedicated', emoji: '💪', xpRequired: 500, description: 'Earned 500 XP' },
  { id: 'elite', name: 'Elite', emoji: '🏆', xpRequired: 1000, description: 'Earned 1,000 XP' },
  { id: 'vortex_pro', name: 'Vortex Pro', emoji: '👑', xpRequired: 2000, description: 'Free Pro unlock!' },
  { id: 'legend', name: 'Legend', emoji: '🌟', xpRequired: 5000, description: 'Earned 5,000 XP' },
] as const;

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevelXP = (getLevelFromXP(xp) - 1) * 200;
  const progressInLevel = xp - currentLevelXP;
  return {
    current: progressInLevel,
    needed: 200,
    progress: (progressInLevel / 200) * 100,
  };
}

export function getEarnedBadges(xp: number): typeof BADGES[number][] {
  return BADGES.filter(b => xp >= b.xpRequired);
}

export function getNextBadge(xp: number): typeof BADGES[number] | null {
  return BADGES.find(b => xp < b.xpRequired) || null;
}

export async function awardXP(userId: string, amount: number): Promise<{ newXP: number; newLevel: number; newBadges: string[] }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, badges, is_pro')
    .eq('user_id', userId)
    .single();

  const currentXP = profile?.xp || 0;
  const newXP = currentXP + amount;
  const newLevel = getLevelFromXP(newXP);
  const currentBadges: string[] = profile?.badges || [];
  const earnedBadges = getEarnedBadges(newXP).map(b => b.id);
  const newBadges = earnedBadges.filter(b => !currentBadges.includes(b));

  const updateData: Record<string, unknown> = {
    xp: newXP,
    level: newLevel,
    badges: earnedBadges,
  };

  // Auto-unlock Pro at 2000 XP
  if (newXP >= 2000 && !profile?.is_pro) {
    updateData.is_pro = true;
  }

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);

  return { newXP, newLevel, newBadges };
}

export async function claimDailyLoginXP(userId: string): Promise<{ awarded: boolean; newXP: number; newBadges: string[] }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_xp_login_date, xp')
    .eq('user_id', userId)
    .single();

  const today = new Date().toISOString().split('T')[0];

  if (profile?.last_xp_login_date === today) {
    return { awarded: false, newXP: profile?.xp || 0, newBadges: [] };
  }

  await supabase
    .from('profiles')
    .update({ last_xp_login_date: today })
    .eq('user_id', userId);

  const result = await awardXP(userId, XP_REWARDS.DAILY_LOGIN);
  return { awarded: true, ...result };
}
