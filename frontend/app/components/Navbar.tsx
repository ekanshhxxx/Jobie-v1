'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getUser, clearAuth } from '../lib/api';

export default function Navbar() {

  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push('/login');
  };

  const isDark = resolvedTheme === 'dark';

  /* Correct routes */
  const dashboardRoute =
    user?.role === "candidate"
      ? "/candidate/dashboard"
      : "/recruiter/dashboard";

  const jobsRoute =
    user?.role === "candidate"
      ? "/candidate/jobs"
      : "/recruiter/manage-jobs";

  /* Prevent render before user loads */
  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 px-6 py-3 dark:bg-transparent bg-[#EFF6FF]/90 backdrop-blur-2xl border-b border-blue-100/60">

      <nav className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5 rounded-full bg-white/10 dark:bg-white/6 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-sm">

        {/* Logo */}
        <Link href={dashboardRoute} className="text-xl font-extrabold tracking-tight shrink-0">
          <span className="text-gray-900 dark:text-white">Job</span>
          <span className="text-[#2563EB] dark:text-violet-400">ie</span>
        </Link>

        {user ? (
          <>
            {/* Center Links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600 dark:text-white/70">

              <Link
                href={dashboardRoute}
                className="hover:text-[#2563EB] dark:hover:text-white transition"
              >
                Dashboard
              </Link>

              <Link
                href={jobsRoute}
                className="hover:text-[#2563EB] dark:hover:text-white transition"
              >
                Jobs
              </Link>

              {user.role === "candidate" && (
                <>
                  <Link
                    href="/profile"
                    className="hover:text-[#2563EB] dark:hover:text-white transition"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/resume"
                    className="hover:text-[#2563EB] dark:hover:text-white transition"
                  >
                    Resume AI
                  </Link>
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">

              <span className="text-sm font-medium text-gray-700 dark:text-white/80 hidden sm:block">
                {user?.name}
              </span>

              <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] dark:bg-violet-400/20 dark:text-violet-300 px-3 py-1 rounded-full font-medium">
                {user?.role}
              </span>

              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-1.5 rounded-full hover:bg-red-600 transition text-sm font-medium"
              >
                Logout
              </button>

            </div>
          </>
        ) : (
          <>
            {/* Guest Navigation */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium">

              <Link
                href="/"
                className="text-[#2563EB] dark:text-violet-400 font-semibold"
              >
                Home
              </Link>

              <a
                href="#how-it-works"
                className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition"
              >
                How it Works
              </a>

              <a
                href="#services"
                className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition"
              >
                About Us
              </a>

              <a
                href="#contact"
                className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition"
              >
                Contact
              </a>

            </div>

            {/* Guest buttons */}
            <div className="flex items-center gap-3">

              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <Link
                href="/login"
                className="text-sm text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition font-medium px-2 py-1.5"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="bg-[#2563EB] dark:bg-violet-600 text-white text-sm px-5 py-2 rounded-full hover:bg-[#1D4ED8] dark:hover:bg-violet-700 transition font-semibold"
              >
                Get Started
              </Link>

            </div>
          </>
        )}
      </nav>
    </header>
  );
}