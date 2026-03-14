'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { useTheme } from 'next-themes';
import { getUser, clearAuth } from '../lib/api';
import { useToast } from './ToastProvider';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

type CardNavItem = {
  label: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  links: CardNavLink[];
};

const navItems: CardNavItem[] = [
  {
    label: 'ATS Checker',
    bgLight: 'rgba(239,246,255,0.7)',
    bgDark: 'rgba(13,7,22,0.75)',
    textLight: '#1e3a5f',
    links: [
      { label: 'Resume Scanner', href: '/resume', ariaLabel: 'Resume ATS Scanner' },
      { label: 'Score Check', href: '/resume', ariaLabel: 'ATS Score Check' },
    ],
  },
  {
    label: 'Jobs',
    bgLight: 'rgba(240,237,255,0.7)',
    bgDark: 'rgba(23,13,39,0.75)',
    textLight: '#3b2e7e',
    links: [
      { label: 'Browse Jobs', href: '/jobs', ariaLabel: 'Browse Jobs' },
      { label: 'AI Matching', href: '/jobs', ariaLabel: 'AI Matched Jobs' },
    ],
  },
  {
    label: 'Roadmaps',
    bgLight: 'rgba(245,240,255,0.7)',
    bgDark: 'rgba(39,30,55,0.75)',
    textLight: '#4a2d8a',
    links: [
      { label: 'Learning Paths', href: '/dashboard', ariaLabel: 'Learning Paths' },
      { label: 'Skill Gaps', href: '/profile', ariaLabel: 'Skill Gap Analysis' },
    ],
  },
];

export default function CardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const { toast } = useToast();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, [pathname]);

  const isDark = mounted && resolvedTheme === 'dark';

  const logout = () => {
    const name = user?.name?.split(' ')[0] ?? 'User';
    clearAuth();
    setUser(null);
    toast({
      type: 'info',
      emoji: '👋',
      title: `See you later, ${name}!`,
      message: 'You have been signed out successfully.',
    });
    router.push('/login');
  };

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 280;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVis = contentEl.style.visibility;
        const wasPE = contentEl.style.pointerEvents;
        const wasPos = contentEl.style.position;
        const wasH = contentEl.style.height;
        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        void contentEl.offsetHeight;
        const h = 60 + contentEl.scrollHeight + 16;
        contentEl.style.visibility = wasVis;
        contentEl.style.pointerEvents = wasPE;
        contentEl.style.position = wasPos;
        contentEl.style.height = wasH;
        return h;
      }
    }
    return 280;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 40, opacity: 0, scale: 0.96 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.5, ease: 'power4.out' });
    tl.to(cardsRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power4.out', stagger: 0.06 }, '-=0.25');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newH = calculateHeight();
        gsap.set(navRef.current, { height: newH });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) { newTl.progress(1); tlRef.current = newTl; }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) tlRef.current = newTl;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const closeMenu = () => {
    if (isExpanded) {
      setIsHamburgerOpen(false);
      tlRef.current?.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tlRef.current?.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const lineColor = isDark ? '#fff' : '#333';

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 pb-1">
      {/* DarkVeil behind in dark mode */}
      {mounted && isDark && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-b-2xl">
          <DarkVeilBg />
        </div>
      )}

      <div className="relative left-1/2 -translate-x-1/2 w-full max-w-5xl z-50">
        <nav
          ref={navRef}
          className="block h-15 p-0 rounded-2xl relative overflow-hidden will-change-[height]"
          style={{
            background: isDark
              ? 'rgba(12,10,25,0.55)'
              : 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.55)',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 32px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {/* ─── Top bar ─── */}
          <div className="absolute inset-x-0 top-0 h-15 flex items-center justify-between px-5 z-2">

            {/* Left: Hamburger */}
            <div
              className="group flex flex-col items-center justify-center cursor-pointer gap-1.5 shrink-0"
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? 'Close menu' : 'Open menu'}
              tabIndex={0}
            >
              <div
                className={`w-5 h-px transition-all duration-300 ease-[cubic-bezier(.23,1,.32,1)] origin-center ${isHamburgerOpen ? 'translate-y-[3.5px] rotate-45' : ''} group-hover:opacity-70`}
                style={{ backgroundColor: lineColor }}
              />
              <div
                className={`w-5 h-px transition-all duration-300 ease-[cubic-bezier(.23,1,.32,1)] origin-center ${isHamburgerOpen ? '-translate-y-[3.5px] -rotate-45' : ''} group-hover:opacity-70`}
                style={{ backgroundColor: lineColor }}
              />
            </div>

            {/* Center: Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition">Dashboard</Link>
                  <Link href="/jobs" className="text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition">Jobs</Link>
                  {user.role === 'candidate' && (
                    <>
                      <Link href="/profile" className="text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition">Profile</Link>
                      <Link href="/resume" className="text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition">Resume AI</Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href="/" className="text-[#2563EB] dark:text-violet-400 font-semibold">Home</Link>
                  <a href="#how-it-works" className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition">How it Works</a>
                  <a href="#services" className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition">About Us</a>
                  <a href="#contact" className="text-gray-500 dark:text-white/60 hover:text-[#2563EB] dark:hover:text-white transition">Contact</a>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Logo (visible on mobile, hidden on desktop since links take center) */}
              <Link href="/" className="md:hidden text-lg font-extrabold tracking-tight mr-auto">
                <span className="text-gray-900 dark:text-white">Job</span>
                <span className="text-[#2563EB] dark:text-violet-400">ie</span>
              </Link>

              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/8 transition text-sm"
                  aria-label="Toggle theme"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              )}
              {user ? (
                <>
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80 hidden sm:block">{user.name}</span>
                  <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] dark:bg-violet-400/20 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium hidden sm:block">{user.role}</span>
                  <button
                    onClick={logout}
                    className="text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                    style={{
                      background: isDark
                        ? 'rgba(239,68,68,0.8)'
                        : 'rgba(239,68,68,0.9)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-600 dark:text-white/70 hover:text-[#2563EB] dark:hover:text-white transition font-medium hidden md:block">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:inline-flex text-white text-sm px-5 py-2 rounded-full font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isDark
                        ? 'rgba(124,58,237,0.8)'
                        : 'rgba(37,99,235,0.85)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isDark
                        ? '0 4px 16px rgba(124,58,237,0.3)'
                        : '0 4px 16px rgba(37,99,235,0.25)',
                    }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ─── Expanding cards ─── */}
          <div
            className={`card-nav-content absolute left-0 right-0 top-15 bottom-0 p-2.5 flex flex-col items-stretch gap-2 justify-start z-1 ${isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'} md:flex-row md:items-end md:gap-2.5`}
            aria-hidden={!isExpanded}
          >
            {navItems.map((item, idx) => (
              <div
                key={item.label}
                className="relative flex flex-col gap-2 p-4 rounded-xl min-w-0 flex-[1_1_auto] h-auto min-h-15 md:h-full md:min-h-0 md:flex-[1_1_0%] select-none"
                ref={setCardRef(idx)}
                style={{
                  background: isDark ? item.bgDark : item.bgLight,
                  color: isDark ? '#fff' : item.textLight,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(255,255,255,0.5)',
                }}
              >
                <div className="font-semibold tracking-tight text-lg">{item.label}</div>
                <div className="mt-auto flex flex-col gap-1">
                  {item.links.map((lnk) => (
                    <Link
                      key={lnk.label}
                      href={lnk.href}
                      className="inline-flex items-center gap-1.5 no-underline cursor-pointer transition-opacity duration-200 hover:opacity-70 text-sm"
                      aria-label={lnk.ariaLabel}
                      onClick={closeMenu}
                    >
                      <GoArrowUpRight className="shrink-0" aria-hidden="true" />
                      {lnk.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

/* Lazy wrapper — DarkVeil (WebGL) only mounts client-side in dark mode */
function DarkVeilBg() {
  const [Comp, setComp] = useState<React.ComponentType<{ speed?: number }> | null>(null);
  useEffect(() => {
    import('./DarkVeil').then((m) => setComp(() => m.default as React.ComponentType<{ speed?: number }>));
  }, []);
  if (!Comp) return null;
  return <Comp speed={0.5} />;
}
