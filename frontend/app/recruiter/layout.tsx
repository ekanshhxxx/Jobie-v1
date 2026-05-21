'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getUser, clearAuth } from '../lib/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const nextUser = getUser();
    if (!nextUser) {
      router.push('/login');
      return;
    }
    if (nextUser.role !== 'recruiter') {
      router.push('/candidate/dashboard');
      return;
    }
    setUser(nextUser);
  }, [router]);
  
  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!user || !mounted) {
    return (
      <div className="bg-gray-50 dark:bg-[#0b0f1a] h-screen w-full flex flex-col items-center justify-center relative overflow-hidden transition-colors selection:bg-violet-200 dark:selection:bg-violet-900 z-0">
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/40 mix-blend-multiply blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 mix-blend-multiply blur-[120px]"></div>
        </div>
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 border-4 border-violet-200/50 dark:border-violet-900/40 rounded-full" />
          <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Initializing Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Securing connection and parsing credentials...</p>
      </div>
    );
  }

  const isLightTheme = !mounted || resolvedTheme === 'light';

  return (
    <div className={`theme-recruiter ${isLightTheme ? 'theme-recruiter-light' : ''} bg-[var(--bg)] text-[var(--t1)] font-sans antialiased flex h-screen overflow-hidden selection:bg-violet-500/30 selection:text-violet-200 relative z-0 transition-colors duration-300`}>

        {/* Ambient Background Glows */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/40 mix-blend-multiply blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 mix-blend-multiply blur-[120px]"></div>
        </div>

        <Sidebar user={user} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
            <Header />
            {children}
        </main>
    </div>
  );
}
