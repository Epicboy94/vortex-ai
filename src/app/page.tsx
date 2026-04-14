'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Brain, Flame, Utensils, Dumbbell, TrendingUp,
  ChevronRight, Star, Shield, Clock, Check, Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const features = [
  { icon: Brain, title: 'AI-Powered Coaching', desc: 'Get personalized fitness advice from our intelligent AI coach that understands your goals and adapts to your progress.', color: 'from-purple-500 to-violet-600' },
  { icon: Utensils, title: 'Smart Calorie Tracking', desc: 'Simply describe what you ate and our AI instantly calculates calories, protein, carbs, and fat with scientific accuracy.', color: 'from-cyan-500 to-blue-600' },
  { icon: Dumbbell, title: 'Workout Generator', desc: 'AI-generated exercise plans based on your calorie intake. Eat 1000 calories? We create a 500-calorie burn workout.', color: 'from-pink-500 to-rose-600' },
  { icon: Flame, title: 'Streak System', desc: 'Build healthy habits with our gamified streak tracker. Earn badges at 7, 14, 30, 60, 90, and 365-day milestones.', color: 'from-orange-500 to-amber-600' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'Beautiful charts and graphs tracking your BMI, calorie intake, workouts, and overall fitness journey over time.', color: 'from-green-500 to-emerald-600' },
  { icon: Shield, title: 'Science-Backed Results', desc: 'Using the Mifflin-St Jeor equation for BMR, evidence-based TDEE calculations, and validated nutritional data.', color: 'from-indigo-500 to-purple-600' },
];

const testimonials = [
  { name: 'Arjun K.', role: 'Lost 12kg in 3 months', quote: 'Vortex AI completely changed my relationship with food. The calorie tracking is so easy — just type what you ate!', avatar: '🧑‍💻', rating: 5 },
  { name: 'Priya M.', role: 'Fitness Enthusiast', quote: 'The AI coach is incredible. It knows my BMI, my food logs, everything. It is like having a personal trainer in my pocket.', avatar: '👩‍🔬', rating: 5 },
  { name: 'Rahul S.', role: 'Software Developer', quote: 'The streak system kept me motivated for 90 days straight. The meal planner with Indian cuisine options is a game-changer.', avatar: '👨‍💼', rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background orbs */}
        <div className="orb orb-purple top-20 -left-40 animate-float" />
        <div className="orb orb-cyan bottom-20 -right-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="orb orb-pink top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => <div key={i} className="particle" />)}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Powered by Advanced AI</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white">Your Fitness.</span>
            <br />
            <span className="gradient-text">Supercharged by AI.</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Track calories with a single sentence. Get AI-generated workouts. 
            Plan meals across 7+ cuisines. Your intelligent fitness companion is here.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <Link href="/signup" className="btn-primary text-lg !px-8 !py-3.5">
              Start Free <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary text-lg !px-8 !py-3.5">
              Explore Features
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '99.2%', label: 'Accuracy' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to <span className="gradient-text">Transform</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Six powerful features working together to make your fitness journey effortless and effective.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="card group cursor-default"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 relative">
        <div className="orb orb-purple bottom-0 right-0 opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">Start free. Upgrade when you&apos;re ready.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <motion.div
              className="card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-500 text-sm mb-6">Get started on your fitness journey</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-gray-500 text-sm"> / forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['BMI Calculator & Tracking', 'Daily Food Log (5 entries/day)', 'AI Workout Generator', 'Basic AI Coach', 'Streak System'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary w-full justify-center">Get Started</Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              className="pricing-pro rounded-2xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-xs font-semibold text-white">
                <Crown className="w-3 h-3" /> POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-gray-500 text-sm mb-6">Unlock the full Vortex experience</p>
              <div className="mb-2">
                <span className="text-4xl font-bold gradient-text">₹50</span>
                <span className="text-gray-500 text-sm"> / month</span>
              </div>
              <p className="text-purple-400 text-xs mb-6 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 3-day free trial included
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'Unlimited Food Log Entries',
                  'AI Cuisine Meal Planner',
                  '7+ Cuisine Options',
                  'Veg & Non-Veg Selections',
                  'Allergy-Safe Plans',
                  'Advanced AI Coach',
                  'Priority Support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary w-full justify-center">Start Free Trial</Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">Real results from real people using Vortex AI.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            className="card !p-12 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Body?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join thousands who have already started their AI-powered fitness journey. 
                No credit card required.
              </p>
              <Link href="/signup" className="btn-primary text-lg !px-10 !py-4">
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
