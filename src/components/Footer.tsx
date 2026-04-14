import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Vortex AI</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Transform your body and mind with AI-powered fitness coaching. 
              Scientifically-backed nutrition and workout plans, personalized just for you.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Product</h3>
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Features</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Pricing</a>
              <Link href="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Login</Link>
              <Link href="/signup" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Sign Up</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
            <div className="flex flex-col gap-2">
              <Link href="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms & Conditions</Link>
              <Link href="/terms#privacy" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms#refund" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Vortex AI. All rights reserved.</p>
          <p className="text-gray-600 text-xs">Made with 💜 for your fitness journey</p>
        </div>
      </div>
    </footer>
  );
}
