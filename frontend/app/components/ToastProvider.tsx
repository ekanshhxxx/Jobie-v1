'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  emoji?: string;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS: Record<ToastType, { bar: string; icon: string; iconBg: string }> = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'text-red-500',
    iconBg: 'bg-red-500/10 dark:bg-red-500/15',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: 'text-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const colors = COLORS[toast.type];

  return (
    <motion.div
      layout
      key={toast.id}
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="relative flex items-start gap-3 w-80 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden cursor-pointer select-none"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
      onClick={() => onRemove(toast.id)}
    >
      {/* Dark mode bg */}
      <div className="absolute inset-0 bg-white dark:bg-[#1a1a2e]/95 -z-10 rounded-2xl" />

      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.bar}`} />

      {/* Icon */}
      <div className={`mt-3.5 ml-3.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
        {toast.emoji ? (
          <span className="text-base leading-none">{toast.emoji}</span>
        ) : (
          <span className={`text-sm font-bold ${colors.icon}`}>{ICONS[toast.type]}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 py-3 pr-2 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        className="mt-3 mr-3 shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition text-lg leading-none cursor-pointer"
      >
        ×
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${colors.bar} opacity-30`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />
    </motion.div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...opts, id }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal-style toast stack — bottom-right */}
      <div className="fixed bottom-6 right-6 z-99999 flex flex-col gap-2.5 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
