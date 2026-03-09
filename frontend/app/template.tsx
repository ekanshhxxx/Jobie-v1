'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/login', '/register'];

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    return (
      <div className="relative overflow-hidden">
        {/* ── Curtain sweep overlay ── */}
        <motion.div
          key={`curtain-${pathname}`}
          className="fixed inset-0 z-9999 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #4F46E5 100%)',
          }}
          initial={{ x: '-101%' }}
          animate={{ x: ['-101%', '0%', '0%', '101%'] }}
          transition={{
            duration: 0.75,
            times: [0, 0.38, 0.58, 1],
            ease: [0.76, 0, 0.24, 1],
          }}
        />

        {/* ── Curtain shimmer gloss ── */}
        <motion.div
          key={`gloss-${pathname}`}
          className="fixed inset-0 z-10000 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
          }}
          initial={{ x: '-101%' }}
          animate={{ x: ['-101%', '0%', '0%', '101%'] }}
          transition={{
            duration: 0.75,
            times: [0, 0.38, 0.58, 1],
            ease: [0.76, 0, 0.24, 1],
          }}
        />

        {/* ── Page content – always visible ── */}
        <div>
          {children}
        </div>
      </div>
    );
  }

  /* ── Non-auth pages: render immediately, no animation ── */
  return <>{children}</>;
}
