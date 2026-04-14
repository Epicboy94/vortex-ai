'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, ArrowLeft, Activity, Ruler, Weight, Calendar, User2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateBMI, getBMICategory, calculateBMR, calculateTDEE } from '@/lib/health';

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise, desk job' },
  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const bmi = heightCm && weightKg ? calculateBMI(Number(weightKg), Number(heightCm)) : 0;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const handleFinish = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const h = Number(heightCm);
    const w = Number(weightKg);
    const a = Number(age);
    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    await supabase.from('profiles').upsert({
      user_id: user.id,
      gender,
      age: a,
      height: h,
      weight: w,
      activity_level: activityLevel,
      bmi: calculateBMI(w, h),
      bmr,
      tdee,
      streak_count: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      is_pro: false,
    }, { onConflict: 'user_id' });

    router.push('/dashboard');
  };

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-6"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.4)',
                '0 0 60px rgba(139,92,246,0.8), 0 0 80px rgba(6,182,212,0.4)',
                '0 0 20px rgba(139,92,246,0.4)',
              ],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold gradient-text mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Vortex AI
          </motion.h1>
          <motion.p
            className="text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Preparing your fitness journey...
          </motion.p>
          <motion.div
            className="mt-8 w-48 h-1 rounded-full bg-gray-800 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const steps = [
    // Gender
    {
      title: 'What\'s your gender?',
      icon: User2,
      content: (
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'male', label: 'Male', emoji: '👨' },
            { value: 'female', label: 'Female', emoji: '👩' },
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`card !p-6 text-center cursor-pointer transition-all ${
                gender === g.value ? 'border-purple-500 bg-purple-500/10' : ''
              }`}
            >
              <span className="text-4xl mb-2 block">{g.emoji}</span>
              <span className="text-white font-medium">{g.label}</span>
            </button>
          ))}
        </div>
      ),
      valid: !!gender,
    },
    // Age
    {
      title: 'How old are you?',
      icon: Calendar,
      content: (
        <div className="max-w-xs mx-auto">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input-field text-center text-3xl font-bold"
            placeholder="25"
            min="13"
            max="100"
          />
          <p className="text-gray-500 text-sm text-center mt-3">years old</p>
        </div>
      ),
      valid: Number(age) >= 13 && Number(age) <= 100,
    },
    // Height
    {
      title: 'What\'s your height?',
      icon: Ruler,
      content: (
        <div className="max-w-xs mx-auto">
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="input-field text-center text-3xl font-bold"
            placeholder="170"
            min="100"
            max="250"
          />
          <p className="text-gray-500 text-sm text-center mt-3">centimeters</p>
        </div>
      ),
      valid: Number(heightCm) >= 100 && Number(heightCm) <= 250,
    },
    // Weight
    {
      title: 'What\'s your weight?',
      icon: Weight,
      content: (
        <div className="max-w-xs mx-auto">
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="input-field text-center text-3xl font-bold"
            placeholder="70"
            min="30"
            max="300"
          />
          <p className="text-gray-500 text-sm text-center mt-3">kilograms</p>
        </div>
      ),
      valid: Number(weightKg) >= 30 && Number(weightKg) <= 300,
    },
    // Activity Level
    {
      title: 'Your activity level?',
      icon: Activity,
      content: (
        <div className="space-y-3">
          {activityLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setActivityLevel(level.value)}
              className={`card !p-4 w-full text-left cursor-pointer transition-all ${
                activityLevel === level.value ? 'border-purple-500 bg-purple-500/10' : ''
              }`}
            >
              <p className="text-white font-medium text-sm">{level.label}</p>
              <p className="text-gray-500 text-xs mt-1">{level.desc}</p>
            </button>
          ))}
        </div>
      ),
      valid: !!activityLevel,
    },
    // BMI Result
    {
      title: 'Your BMI Results',
      icon: Activity,
      content: bmiCategory ? (
        <div className="text-center">
          <motion.div
            className="w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-6 relative"
            style={{ border: `4px solid ${bmiCategory.color}` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div>
              <p className="text-4xl font-bold text-white">{bmi}</p>
              <p className="text-sm text-gray-400">BMI</p>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${bmiCategory.color}` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <p className="text-xl font-semibold mb-2" style={{ color: bmiCategory.color }}>
            {bmiCategory.label}
          </p>
          <p className="text-gray-400 text-sm max-w-md mx-auto">{bmiCategory.description}</p>
        </div>
      ) : null,
      valid: true,
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="orb orb-purple -top-20 -left-20" />
      <div className="orb orb-cyan -bottom-20 -right-20" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs">Step {step + 1} of {steps.length}</p>
            <p className="text-gray-500 text-xs">{Math.round(((step + 1) / steps.length) * 100)}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card !p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                  <currentStep.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">{currentStep.title}</h2>
              </div>

              {currentStep.content}

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0}
                  className="btn-secondary !py-2 !px-4 !text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!currentStep.valid}
                    className="btn-primary !py-2 !px-6 !text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="btn-primary !py-2 !px-6 !text-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start My Journey'} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
