import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('height')
    .eq('user_id', data.user.id)
    .single();

  if (profile?.height) {
    return NextResponse.redirect(new URL('/dashboard', url.origin));
  }

  // Create profile if doesn't exist
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', data.user.id)
    .single();

  if (!existingProfile) {
    await supabase.from('profiles').insert({
      user_id: data.user.id,
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      streak_count: 0,
      xp: 0,
      level: 1,
      badges: [],
      is_pro: false,
    });
  }

  return NextResponse.redirect(new URL('/onboarding', url.origin));
}
