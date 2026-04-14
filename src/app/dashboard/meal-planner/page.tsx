'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Loader2, Crown, X, Sparkles,
  Leaf, Drumstick
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const cuisines = [
  { value: 'indian', label: 'Indian', emoji: '🇮🇳' },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'italian', label: 'Italian', emoji: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', emoji: '🇲🇽' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'american', label: 'American', emoji: '🇺🇸' },
  { value: 'thai', label: 'Thai', emoji: '🇹🇭' },
];

const nonVegTypes = [
  { value: 'chicken', label: 'Chicken', emoji: '🍗' },
  { value: 'eggs', label: 'Eggs', emoji: '🥚' },
  { value: 'prawn', label: 'Prawn', emoji: '🦐' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
  { value: 'pork', label: 'Pork', emoji: '🥓' },
  { value: 'steak', label: 'Steak', emoji: '🥩' },
  { value: 'beef', label: 'Beef', emoji: '🐄' },
  { value: 'lamb', label: 'Lamb', emoji: '🐑' },
];

interface MealDay {
  day: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

export default function MealPlannerPage() {
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [dietType, setDietType] = useState<'veg' | 'nonveg'>('veg');
  const [selectedMeats, setSelectedMeats] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealDay[]>([]);

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_ends_at')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_pro) {
        setIsPro(true);
      } else if (profile?.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at);
        if (trialEnd > new Date()) {
          setIsPro(true);
        } else {
          setShowUpgrade(true);
        }
      } else {
        // Start trial
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3);
        await supabase.from('profiles').update({
          trial_ends_at: trialEnd.toISOString(),
        }).eq('user_id', user.id);
        setIsPro(true);
      }
    };
    checkPro();
  }, []);

  const toggleMeat = (meat: string) => {
    setSelectedMeats((prev) =>
      prev.includes(meat) ? prev.filter((m) => m !== meat) : [...prev, meat]
    );
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const generateMealPlan = async () => {
    if (!selectedCuisine) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tdee, weight, height, age, gender')
        .eq('user_id', user.id)
        .single();

      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuisine: selectedCuisine,
          dietType,
          meats: dietType === 'nonveg' ? selectedMeats : [],
          allergies,
          profile: profile || {},
        }),
      });
      const data = await res.json();
      setMealPlan(data.mealPlan || []);

      // Save to Supabase
      await supabase.from('meal_plans').insert({
        user_id: user.id,
        cuisine: selectedCuisine,
        diet_type: dietType,
        allergies,
        plan: data.mealPlan || [],
      });
    } catch {
      console.error('Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade modal
  if (showUpgrade) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div
          className="card !p-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Upgrade to Pro</h2>
          <p className="text-gray-400 text-sm mb-6">
            Access the AI Meal Planner with 8+ cuisines, veg/non-veg options, 
            allergy-safe plans, and weekly meal schedules.
          </p>
          <p className="text-3xl font-bold gradient-text mb-1">₹50</p>
          <p className="text-gray-500 text-xs mb-6">per month</p>
          <button className="btn-primary w-full justify-center !py-3" onClick={() => setShowUpgrade(false)}>
            Start 3-Day Free Trial
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-white">Meal Planner</h2>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-xs font-semibold text-white flex items-center gap-1">
            <Crown className="w-3 h-3" /> PRO
          </span>
        </div>
        <p className="text-gray-500 text-sm">Generate a personalized 7-day meal plan tailored to your preferences.</p>
      </div>

      {!mealPlan.length && (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Cuisine selection */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Choose Your Cuisine</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cuisines.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedCuisine(c.value)}
                  className={`card !p-4 text-center cursor-pointer transition-all ${
                    selectedCuisine === c.value ? 'border-purple-500 bg-purple-500/10' : ''
                  }`}
                >
                  <span className="text-2xl mb-1 block">{c.emoji}</span>
                  <span className="text-white text-sm font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Diet type */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Diet Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDietType('veg')}
                className={`card !p-4 flex items-center gap-3 cursor-pointer ${
                  dietType === 'veg' ? 'border-green-500 bg-green-500/10' : ''
                }`}
              >
                <Leaf className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <p className="text-white font-medium text-sm">Vegetarian</p>
                  <p className="text-gray-500 text-xs">Plant-based meals</p>
                </div>
              </button>
              <button
                onClick={() => setDietType('nonveg')}
                className={`card !p-4 flex items-center gap-3 cursor-pointer ${
                  dietType === 'nonveg' ? 'border-orange-500 bg-orange-500/10' : ''
                }`}
              >
                <Drumstick className="w-6 h-6 text-orange-400" />
                <div className="text-left">
                  <p className="text-white font-medium text-sm">Non-Vegetarian</p>
                  <p className="text-gray-500 text-xs">Includes meat & seafood</p>
                </div>
              </button>
            </div>
          </div>

          {/* Non-veg types */}
          <AnimatePresence>
            {dietType === 'nonveg' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-white font-semibold text-sm mb-3">Select Meat Preferences</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {nonVegTypes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => toggleMeat(m.value)}
                      className={`card !p-3 text-center cursor-pointer text-sm ${
                        selectedMeats.includes(m.value) ? 'border-orange-500 bg-orange-500/10' : ''
                      }`}
                    >
                      <span className="text-xl mb-1 block">{m.emoji}</span>
                      <span className="text-white text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Allergies */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Allergies & Restrictions</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                className="input-field flex-1"
                placeholder="e.g. peanuts, gluten, dairy..."
              />
              <button onClick={addAllergy} className="btn-secondary !py-2 !px-4 !text-sm">Add</button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <span key={a} className="tag">
                    {a}
                    <button onClick={() => setAllergies(allergies.filter((x) => x !== a))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={generateMealPlan}
            disabled={loading || !selectedCuisine}
            className="btn-primary w-full justify-center !py-3 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Meal Plan...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate 7-Day Meal Plan</>
            )}
          </button>
        </motion.div>
      )}

      {/* Meal Plan Display */}
      {mealPlan.length > 0 && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Your 7-Day Meal Plan</h3>
            <button
              onClick={() => setMealPlan([])}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Generate New
            </button>
          </div>

          {mealPlan.map((day, i) => (
            <motion.div
              key={day.day}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-xs text-purple-400 font-bold">
                  {i + 1}
                </span>
                {day.day}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Breakfast', value: day.breakfast, emoji: '🌅' },
                  { label: 'Lunch', value: day.lunch, emoji: '☀️' },
                  { label: 'Snack', value: day.snack, emoji: '🍎' },
                  { label: 'Dinner', value: day.dinner, emoji: '🌙' },
                ].map((meal) => (
                  <div key={meal.label} className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">{meal.emoji} {meal.label}</p>
                    <p className="text-gray-200 text-sm">{meal.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
