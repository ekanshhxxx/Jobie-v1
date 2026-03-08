'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Article {
  title: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  description?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-72 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 animate-pulse">
      <div className="h-44 bg-gray-200 dark:bg-white/8" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-2/3" />
        <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-full mt-2" />
        <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function NewsScrollBelt() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const refreshRef = useRef(0);

  const CATEGORIES = useMemo(() => ['all', 'jobs', 'ai', 'tech'], []);

  useEffect(() => {
    const count = refreshRef.current++;
    const category = CATEGORIES[count % CATEGORIES.length];
    const page = (Math.floor(count / CATEGORIES.length) % 4) + 1;
    fetch(`/api/news?category=${category}&pageSize=12&page=${page}`)
      .then(r => r.json())
      .then(data => {
        const fresh = data.articles ?? [];
        if (fresh.length > 0) setArticles(fresh);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [CATEGORIES]);

  // Triple for seamless loop
  const track = loading
    ? null
    : [...articles, ...articles, ...articles];

  const DURATION = 55;

  return (
    <section className="py-24 bg-white dark:bg-[#060610] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-100/40 dark:bg-violet-900/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-100/30 dark:bg-blue-900/8 blur-3xl" />

      {/* ── Header ── */}
      <div className="relative z-10 px-6 md:px-16 mb-12 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-violet-500/10 text-[#2563EB] dark:text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-blue-100 dark:border-violet-500/20">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-violet-400 animate-pulse inline-block" />
            Live news feed
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            What&apos;s happening in{' '}
            <span className="bg-linear-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              Tech &amp; Jobs
            </span>
          </h2>
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs leading-relaxed">
          Hover over any card to pause. Click to read the full story.
        </p>
      </div>

      {/* ── Scrolling belt ── */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none bg-linear-to-r from-white dark:from-[#060610] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none bg-linear-to-l from-white dark:from-[#060610] to-transparent" />

        {/* Track */}
        <div
          className="flex gap-5 w-max px-6 py-3"
          style={{
            animation: `newsMarquee ${DURATION}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {loading
            ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
            : track!.map((article, i) => (
                <motion.a
                  key={`${article.url}-${i}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.04, y: -10 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="group shrink-0 w-72 rounded-2xl overflow-hidden bg-white dark:bg-[#0d0b1e] border border-gray-100 dark:border-white/8 shadow-lg shadow-black/5 dark:shadow-black/40 cursor-pointer"
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={article.urlToImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-600 ease-out"
                      unoptimized
                    />
                    {/* gradient vignette */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold text-white px-2.5 py-1 rounded-full truncate max-w-36"
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {article.source.name}
                      </span>
                      <span
                        className="text-xs text-white/85 px-2 py-1 rounded-full shrink-0"
                        style={{
                          background: 'rgba(0,0,0,0.35)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {timeAgo(article.publishedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-3 group-hover:text-[#2563EB] dark:group-hover:text-violet-300 transition-colors mb-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                        {article.description}
                      </p>
                    )}
                  </div>
                </motion.a>
              ))}
        </div>
      </div>

      {/* ── View all CTA ── */}
      <div className="relative z-10 flex justify-center mt-12">
        <Link
          href="/news"
          className="group inline-flex items-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#2563EB]/50 dark:hover:border-violet-500/50 text-gray-700 dark:text-gray-200 hover:text-[#2563EB] dark:hover:text-violet-400 px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-violet-500/10"
        >
          <svg className="w-4 h-4 text-[#2563EB] dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-1M9 9h6m-6 4h4"/>
          </svg>
          <span>Explore the full news feed</span>
          <motion.span
            className="text-base"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </Link>
      </div>

      {/* Keyframe injected inline */}
      <style>{`
        @keyframes newsMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
      `}</style>
    </section>
  );
}
