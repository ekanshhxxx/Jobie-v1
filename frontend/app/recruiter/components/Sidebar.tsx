'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth } from '../../lib/api';
import 'iconify-icon';

interface SidebarProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}

const recruitmentNav = [
  { name: 'Jobs', href: '/recruiter/manage-jobs', icon: 'solar:briefcase-linear' },
  { name: 'Candidates', href: '/recruiter/applications', icon: 'solar:users-group-rounded-linear' },
  { name: 'Interviews', href: '/recruiter/interviews', icon: 'solar:calendar-linear' },
  { name: 'Messages', href: '/recruiter/messages', icon: 'solar:letter-linear' },
];

const workspaceNav = [
  { name: 'Company Profile', href: '/recruiter/profile', icon: 'solar:buildings-linear' },
  { name: 'Settings', href: '/recruiter/profile/edit', icon: 'solar:settings-linear' },
  { name: 'Analytics', href: '/recruiter/analytics', icon: 'solar:chart-2-linear' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function getInitials(name: string): string {
  if (!name) return 'R';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-r border-white/60 dark:border-white/10 flex flex-col hidden md:flex z-20 shrink-0 transition-colors">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200/50 dark:border-white/10 shrink-0">
        <Link href="/recruiter/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-sm">
            <iconify-icon icon="solar:magic-stick-3-linear" width="14" height="14" class="text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Jobie</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded">HR</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {/* Dashboard */}
        <Link
          href="/recruiter/dashboard"
          className={classNames(
            pathname === '/recruiter/dashboard'
              ? 'bg-white/60 dark:bg-white/10 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all'
          )}
        >
          <iconify-icon icon="solar:pie-chart-2-linear" width="20" height="20" stroke-width="1.5" />
          Overview
        </Link>

        {/* AI Copilot */}
        <Link
          href="/recruiter/copilot"
          className="flex items-center gap-3 px-3 py-2.5 text-violet-600 dark:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 rounded-xl text-sm font-medium transition-all group relative overflow-hidden mt-2 mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-100/0 via-violet-100/30 to-violet-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <iconify-icon icon="solar:magic-stick-3-linear" width="20" height="20" stroke-width="1.5" />
          AI Copilot
          <span className="ml-auto flex h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        </Link>

        {/* Recruitment Section */}
        <div className="pt-4 pb-2 px-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recruitment</p>
        </div>

        {recruitmentNav.map((item) => {
          const isActive = item.href !== '#' && pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                isActive
                  ? 'bg-white/60 dark:bg-white/10 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors'
              )}
            >
              <iconify-icon icon={item.icon} width="20" height="20" stroke-width="1.5" />
              {item.name}
            </Link>
          );
        })}

        {/* Workspace Section */}
        <div className="pt-6 pb-2 px-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace</p>
        </div>

        {workspaceNav.map((item) => {
          const isActive = item.href !== '#' && pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                isActive
                  ? 'bg-white/60 dark:bg-white/10 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors'
              )}
            >
              <iconify-icon icon={item.icon} width="20" height="20" stroke-width="1.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200/50 dark:border-white/10 shrink-0 mb-2 space-y-2">
        <button
          className="flex items-center gap-3 w-full p-2 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-colors text-left border border-transparent hover:border-white/80 dark:hover:border-white/20 hover:shadow-sm group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-200 to-violet-50 dark:from-violet-900 dark:to-violet-800 flex items-center justify-center shrink-0 border border-white dark:border-white/10 shadow-sm">
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-200">{getInitials(user?.name ?? '')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name ?? 'Recruiter'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
          <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" class="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <iconify-icon icon="solar:logout-2-linear" width="16" height="16" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
