'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Loader2, Crown, X, Sparkles,
  Leaf, Drumstick, BookOpen, Clock, Flame, UtensilsCrossed
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { awardXP, XP_REWARDS } from '@/lib/xp';

const cuisines = [
  { value: 'indian', label: 'Indian', emoji: '🇮🇳' },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'italian', label: 'Italian', emoji: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', emoji: '🇲🇽' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'american', label: 'American', emoji: '🇺🇸' },
  { value: 'thai', label: 'Thai', emoji: '🇹🇭' },
  { value: 'korean', label: 'Korean', emoji: '🇰🇷' },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🇻🇳' },
  { value: 'turkish', label: 'Turkish', emoji: '🇹🇷' },
  { value: 'greek', label: 'Greek', emoji: '🇬🇷' },
  { value: 'brazilian', label: 'Brazilian', emoji: '🇧🇷' },
  { value: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'african', label: 'African', emoji: '🌍' },
  { value: 'french', label: 'French', emoji: '🇫🇷' },
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

interface MealItem {
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
}

interface MealPlan {
  meals: {
    breakfast: MealItem;
    morning_snack: MealItem;
    lunch: MealItem;
    evening_snack: MealItem;
    dinner: MealItem;
  };
  totalCalories: number;
  nutritionTip: string;
}

interface Recipe {
  name: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  calories: number;
  ingredients: string[];
  steps: string[];
  tips: string;
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
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [regenCount, setRegenCount] = useState(0);
  const [maxRegen] = useState(2);

  // Recipe modal
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [selectedDish, setSelectedDish] = useState('');

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_ends_at, meal_generations_today, meal_gen_date')
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

      // Check daily regen count
      const today = new Date().toISOString().split('T')[0];
      if (profile?.meal_gen_date === today) {
        setRegenCount(profile.meal_generations_today || 0);
      } else {
        // Reset counter for new day
        await supabase.from('profiles').update({
          meal_generations_today: 0,
          meal_gen_date: today,
        }).eq('user_id', user.id);
        setRegenCount(0);
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
    if (!selectedCuisine || regenCount >= maxRegen) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tdee, weight, height, age, gender, fitness_goal')
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
      setMealPlan(data);

      // Update regen counter
      const newCount = regenCount + 1;
      setRegenCount(newCount);
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('profiles').update({
        meal_generations_today: newCount,
        meal_gen_date: today,
      }).eq('user_id', user.id);

      // Award XP
      await awardXP(user.id, XP_REWARDS.GENERATE_MEAL);

      // Save to Supabase
      await supabase.from('meal_plans').insert({
        user_id: user.id,
        cuisine: selectedCuisine,
        diet_type: dietType,
        allergies,
        plan: data,
      });
    } catch {
      console.error('Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const generateRecipe = async (dishName: string) => {
    setSelectedDish(dishName);
    setShowRecipe(true);
    setRecipeLoading(true);
    setRecipe(null);

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish: dishName, cuisine: selectedCuisine }),
      });
      const data = await res.json();
      setRecipe(data);
    } catch {
      console.error('Failed to generate recipe');
    } finally {
      setRecipeLoading(false);
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Upgrade to Pro</h2>
          <p className="text-gray-400 text-sm mb-6">
            Access the AI Meal Planner with 16+ cuisines, veg/non-veg options, 
            recipe generation, and personalized daily meal plans.
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

  const mealSlots = mealPlan?.meals ? [
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅', data: mealPlan.meals.breakfast },
    { key: 'morning_snack', label: 'Morning Snack', emoji: '🍎', data: mealPlan.meals.morning_snack },
    { key: 'lunch', label: 'Lunch', emoji: '☀️', data: mealPlan.meals.lunch },
    { key: 'evening_snack', label: 'Evening Snack', emoji: '🥤', data: mealPlan.meals.evening_snack },
    { key: 'dinner', label: 'Dinner', emoji: '🌙', data: mealPlan.meals.dinner },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-white">Meal Planner</h2>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-xs font-semibold text-white flex items-center gap-1">
            <Crown className="w-3 h-3" /> PRO
          </span>
        </div>
        <p className="text-gray-500 text-sm">Generate a personalized daily meal plan. {maxRegen - regenCount} generation{maxRegen - regenCount !== 1 ? 's' : ''} remaining today.</p>
      </div>

      {!mealPlan && (
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
                    selectedCuisine === c.value ? '!border-rose-500 !bg-rose-500/20' : ''
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
                  dietType === 'veg' ? '!border-emerald-500 !bg-emerald-500/20' : ''
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
                  dietType === 'nonveg' ? '!border-orange-500 !bg-orange-500/20' : ''
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
                        selectedMeats.includes(m.value) ? '!border-orange-500 !bg-orange-500/20' : ''
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
            disabled={loading || !selectedCuisine || regenCount >= maxRegen}
            className="btn-primary w-full justify-center !py-3 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Meal Plan...</>
            ) : regenCount >= maxRegen ? (
              <>Daily Limit Reached (2/2)</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Daily Meal Plan ({maxRegen - regenCount} left)</>
            )}
          </button>
        </motion.div>
      )}

      {/* Meal Plan Display */}
      {mealPlan && mealSlots.length > 0 && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Today&apos;s Meal Plan</h3>
              {mealPlan.totalCalories && (
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> ~{mealPlan.totalCalories} kcal total
                </p>
              )}
            </div>
            <button
              onClick={() => setMealPlan(null)}
              disabled={regenCount >= maxRegen}
              className="text-gray-500 hover:text-white text-sm transition-colors disabled:opacity-30"
            >
              Regenerate ({maxRegen - regenCount} left)
            </button>
          </div>

          {mealSlots.map((slot, i) => (
            <motion.div
              key={slot.key}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                    {slot.emoji} {slot.label}
                    {slot.data?.calories && (
                      <span className="text-rose-400 ml-2">~{slot.data.calories} kcal</span>
                    )}
                  </p>
                  <h4 className="text-white font-semibold text-sm">{slot.data?.name || 'N/A'}</h4>
                  {slot.data?.description && (
                    <p className="text-gray-400 text-xs mt-1">{slot.data.description}</p>
                  )}
                  {slot.data?.ingredients && slot.data.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {slot.data.ingredients.map((ing: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-400 border border-white/5">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => generateRecipe(slot.data?.name || '')}
                  className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                >
                  <BookOpen className="w-3 h-3" /> Recipe
                </button>
              </div>
            </motion.div>
          ))}

          {mealPlan.nutritionTip && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-amber-400 text-xs">💡 <strong>Tip:</strong> {mealPlan.nutritionTip}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Recipe Modal */}
      <AnimatePresence>
        {showRecipe && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowRecipe(false)} />
            <motion.div
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto card !p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                onClick={() => setShowRecipe(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {recipeLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-3" />
                  <p className="text-gray-500 text-sm">Generating recipe for {selectedDish}...</p>
                </div>
              ) : recipe ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{recipe.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prep: {recipe.prepTime}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Cook: {recipe.cookTime}</span>
                      <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                      <span className="text-rose-400 font-medium">{recipe.calories} kcal</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">Ingredients</h4>
                    <ul className="space-y-1">
                      {recipe.ingredients?.map((ing, i) => (
                        <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                          <span className="text-rose-400 mt-1">•</span> {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">Steps</h4>
                    <ol className="space-y-2">
                      {recipe.steps?.map((step, i) => (
                        <li key={i} className="text-gray-400 text-sm flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400 text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {recipe.tips && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <p className="text-amber-400 text-xs">👨‍🍳 <strong>Chef&apos;s Tip:</strong> {recipe.tips}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Failed to generate recipe. Try again.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
