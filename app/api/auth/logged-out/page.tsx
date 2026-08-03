'use client'

import Link from "next/link"
import { Sparkles, LogIn, Heart } from "lucide-react"

function AmleefaLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="amleefaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#amleefaGrad)" />
      <path d="M30 70 L50 30 L70 70 M38 56 L62 56" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="24" r="5" fill="#38BDF8" />
    </svg>
  )
}

export default function LoggedOutPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10 text-center">
        <AmleefaLogo className="w-16 h-16 mx-auto" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Thank you for choosing Amleefa AI! <Heart className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your interview sessions and practice history are securely saved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Again for Continuing Services</span>
          </Link>
        </div>
      </div>
    </div>
  )
}