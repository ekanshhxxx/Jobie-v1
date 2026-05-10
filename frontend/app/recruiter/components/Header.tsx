'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import 'iconify-icon';

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-b border-white/60 dark:border-white/10 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 sticky top-0 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 text-gray-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl">
          <iconify-icon icon="solar:hamburger-menu-linear" width="24" height="24" />
        </button>

        {/* AI Search Bar */}
        <div className="relative hidden sm:block w-96 max-w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <iconify-icon
            icon="solar:stars-linear"
            width="18"
            height="18"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500 z-10"
          />
          <input
            type="text"
            placeholder="Ask AI to find candidates or analyze metrics..."
            className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-md border border-white/80 focus:border-violet-200/80 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-violet-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl text-sm transition-all placeholder-gray-400 text-gray-900 relative z-0"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
            <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100/50 rounded-md border border-gray-200/50">⌘</kbd>
            <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100/50 rounded-md border border-gray-200/50">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-gray-500 hover:bg-white/60 dark:hover:bg-black/40 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors relative shadow-sm border border-transparent"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        {/* Notification Bell */}
        <button className="p-2 text-gray-500 hover:bg-white/60 dark:hover:bg-black/40 hover:text-gray-900 dark:hover:text-white dark:text-gray-400 rounded-full transition-colors relative shadow-sm border border-transparent">
          <iconify-icon icon="solar:bell-linear" width="22" height="22" stroke-width="1.5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full border-2 border-white dark:border-gray-900" />
        </button>

        <div className="h-5 w-px bg-gray-300/50 hidden sm:block" />

        {/* Post a Job CTA */}
        <button
          onClick={() => router.push('/recruiter/post-job')}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <iconify-icon icon="solar:magic-stick-3-linear" width="18" height="18" class="text-violet-300" />
          <span className="hidden sm:inline">Post a Job</span>
        </button>
      </div>
    </header>
  );
}
