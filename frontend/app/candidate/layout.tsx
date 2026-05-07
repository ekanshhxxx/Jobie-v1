'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowUpRight,
  Bell,
  BookMarked,
  BrainCircuit,
  BriefcaseBusiness,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings2,
  Sun,
  UserCircle2,
  Video,
  X,
} from 'lucide-react';
import { clearAuth, getUser } from '../lib/api';

type CandidateNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: (pathname: string) => boolean;
};

function CandidateLink({
  href,
  label,
  icon,
  active,
}: CandidateNavItem & { active: boolean }) {
  return (
    <Link href={href} className={`c-nav-item ${active ? 'active' : ''}`}>
      <span className="c-nav-ico">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const nextUser = getUser();
    if (!nextUser) {
      router.push('/login');
      return;
    }
    setUser(nextUser);
  }, [router]);

  const firstName = useMemo(() => user?.name?.split(' ')[0] ?? 'there', [user]);
  const initials = useMemo(
    () => user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'JB',
    [user]
  );

  const navItems: CandidateNavItem[] = useMemo(() => [
    {
      href: '/candidate/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: (value) => value === '/candidate/dashboard',
    },
    {
      href: '/jobs',
      label: 'Job Feed',
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      active: (value) => value.startsWith('/jobs'),
    },
    {
      href: '/candidate/dashboard#matches',
      label: 'AI Matches',
      icon: <BrainCircuit className="h-4 w-4" />,
      active: (value) => value === '/candidate/dashboard',
    },
    {
      href: '/candidate/applications',
      label: 'Applications',
      icon: <Bell className="h-4 w-4" />,
      active: (value) => value.startsWith('/candidate/applications'),
    },
    {
      href: '/candidate/interviews',
      label: 'Interviews',
      icon: <Video className="h-4 w-4" />,
      active: (value) => value.startsWith('/candidate/interviews') || value.startsWith('/meeting/'),
    },
    {
      href: '/candidate/messages',
      label: 'Messages',
      icon: <MessageSquare className="h-4 w-4" />,
      active: (value) => value.startsWith('/candidate/messages'),
    },
    {
      href: '/candidate/dashboard#saved-roles',
      label: 'Saved Roles',
      icon: <BookMarked className="h-4 w-4" />,
      active: (value) => value === '/candidate/dashboard',
    },
    {
      href: '/resume',
      label: 'Resume Scanner',
      icon: <FileSearch className="h-4 w-4" />,
      active: (value) => value.startsWith('/resume'),
    },
  ], []);

  const quickLinks = [
    { href: '/candidate/dashboard', label: 'Dashboard' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/candidate/applications', label: 'Pipeline' },
    { href: '/candidate/messages', label: 'Messages' },
    { href: '/profile/edit', label: 'Profile' },
  ];

  const workspaceCards = [
    {
      title: 'ATS Checker',
      links: [
        { href: '/resume', label: 'Resume Scanner' },
        { href: '/resume', label: 'Score Check' },
      ],
    },
    {
      title: 'Jobs',
      links: [
        { href: '/jobs', label: 'Browse Jobs' },
        { href: '/candidate/dashboard#matches', label: 'AI Matching' },
      ],
    },
    {
      title: 'Roadmaps',
      links: [
        { href: '/candidate/dashboard', label: 'Learning Paths' },
        { href: '/profile/edit', label: 'Skill Gaps' },
      ],
    },
  ];

  useEffect(() => {
    setIsCardMenuOpen(false);
  }, [pathname]);

  const isLightTheme = !mounted || resolvedTheme === 'light';

  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className={`theme-candidate ${isLightTheme ? 'theme-candidate-light' : ''} relative min-h-screen bg-[var(--bg0)] overflow-x-hidden text-[var(--white)] font-sans antialiased`}>
      <div className="aurora">
        <div className="aurora-blob ab1"></div>
        <div className="aurora-blob ab2"></div>
        <div className="aurora-blob ab3"></div>
        <div className="aurora-blob ab4"></div>
      </div>
      <div className="grain"></div>

      <div className="c-page-wrap">
        <aside className="c-sidebar">
          <div className="c-logo">
            <div className="c-logo-mark">J</div>
            <div>
              <div className="c-logo-text">JOBIE</div>
              <div className="c-logo-sub">Candidate Workspace</div>
            </div>
          </div>

          <div className="c-nav-label">Workspace</div>
          {navItems.slice(0, 3).map((item) => (
            <CandidateLink key={item.label} {...item} active={item.active(pathname)} />
          ))}

          <div className="c-nav-label">Progress</div>
          {navItems.slice(3).map((item) => (
            <CandidateLink key={item.label} {...item} active={item.active(pathname)} />
          ))}

          <div className="c-sidebar-sep"></div>
          <CandidateLink
            href={`/profile/${user.id}`}
            label="Public Profile"
            icon={<UserCircle2 className="h-4 w-4" />}
            active={pathname.startsWith('/profile')}
          />

          <button type="button" onClick={logout} className="c-nav-item mt-2">
            <span className="c-nav-ico"><LogOut className="h-4 w-4" /></span>
            <span>Logout</span>
          </button>

          <div className="c-sidebar-footer">
            <div className="c-user-card">
              <div className="c-avatar">{initials}</div>
              <div>
                <div className="c-user-name">{user.name}</div>
                <div className="c-user-role">Candidate Workspace</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="c-main-wrap">
          <header className="c-topbar">
            <div className="c-topbar-shell">
              <div className="c-topbar-main">
                <button
                  type="button"
                  className="c-menu-toggle"
                  onClick={() => setIsCardMenuOpen((current) => !current)}
                  aria-expanded={isCardMenuOpen}
                  aria-controls="candidate-card-menu"
                  aria-label={isCardMenuOpen ? 'Close workspace menu' : 'Open workspace menu'}
                >
                  {isCardMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>

                <div className="c-topbar-left">
                  <div className="c-topbar-greeting">Hi, {firstName}</div>
                  <div className="c-topbar-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div className="c-ai-status hidden md:flex">
                  <div className="c-pulse"></div>
                  <span>Jobie AI is scanning opportunities for you</span>
                </div>

                <div className="c-topbar-actions">
                  <button
                    type="button"
                    className="c-tb-btn"
                    onClick={() => setTheme(isLightTheme ? 'dark' : 'light')}
                    aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
                    title={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {isLightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                  <Link href="/candidate/applications" className="c-tb-btn" aria-label="View applications">
                    <Bell className="h-4 w-4" />
                  </Link>
                  <Link href="/candidate/messages" className="c-tb-btn" aria-label="Open messages">
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                  <Link href="/profile/edit" className="c-tb-btn" aria-label="Edit profile">
                    <Settings2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="c-mobile-quicknav lg:hidden">
                {quickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? 'border-[rgba(79,172,254,0.26)] bg-[rgba(79,172,254,0.12)] text-[var(--blue-2)]'
                        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[var(--white-dim)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div
                id="candidate-card-menu"
                className={`c-card-menu ${isCardMenuOpen ? 'open' : ''}`}
              >
                <div className="c-card-grid">
                  {workspaceCards.map((card) => (
                    <div key={card.title} className="c-nav-card">
                      <div className="c-nav-card-title">{card.title}</div>
                      <div className="c-nav-card-links">
                        {card.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setIsCardMenuOpen(false)}
                            className="c-nav-card-link"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
