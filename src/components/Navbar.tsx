'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Zap } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Vortex AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Login</Link>
            <Link href="/signup" className="btn-primary !py-2 !px-5 !text-sm">Get Started</Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-3">
              <a href="#features" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2">Features</a>
              <a href="#pricing" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2">Pricing</a>
              <a href="#testimonials" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2">Testimonials</a>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2">Login</Link>
              <Link href="/signup" className="btn-primary !py-2 !px-5 !text-sm text-center mt-2">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
