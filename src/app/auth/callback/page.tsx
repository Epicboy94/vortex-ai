'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase client auto-detects the hash fragment and sets the session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        const user = session.user;
        setStatus('Setting up your profile...');

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('height')
          .eq('user_id', user.id)
          .single();

        if (profile?.height) {
          setStatus('Welcome back! Redirecting...');
          router.push('/dashboard');
          return;
        }

        // Check if profile record exists at all
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!existingProfile) {
          // Create profile for new Google users
          await supabase.from('profiles').insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            streak_count: 0,
            xp: 0,
            level: 1,
            badges: [],
            is_pro: false,
          });
        }

        setStatus('Almost there...');
        router.push('/onboarding');
      } catch {
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-rose-400 mb-4" />
        <p className="text-gray-400 text-sm">{status}</p>
      </motion.div>
    </div>
  );
}
