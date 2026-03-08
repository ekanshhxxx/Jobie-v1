'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  author: string | null;
}

const TABS = [
  { id: 'all',  label: 'All',           emoji: '🌐' },
  { id: 'jobs', label: 'Jobs & Hiring', emoji: '💼' },
  { id: 'ai',   label: 'AI',            emoji: '🤖' },
  { id: 'tech', label: 'Tech',          emoji: '⚡' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonCard({ big = false }: { big?: boolean }) {
  return (
    <div className={`animate-pulse rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/5 ${big ? 'h-96' : 'h-72'}`}>
      <div className={`w-full bg-gray-200 dark:bg-white/8 ${big ? 'h-56' : 'h-40'}`} />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-2/3" />
      </div>
    </div>
  );
}

function HeroCard({ article }: { article: Article }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="group relative rounded-3xl overflow-hidden block h-120 shadow-xl shadow-black/10 dark:shadow-black/40"
    >
      <Image
        src={article.urlToImage}
        alt={article.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
        unoptimized
      />
      {/* gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

      {/* top badges */}
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <span className="bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
          {article.source.name}
        </span>
        <span className="bg-black/40 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* content */}
      <div className="absolute bottom-0 left-0 right-0 p-7">
        <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3 group-hover:text-blue-300 transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-4 max-w-xl">
          {article.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 rounded-full transition">
          Read full story
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </span>
      </div>
    </a>
  );
}

function ArticleCard({ article, i }: { article: Article; i: number }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-white/4 border border-gray-100 dark:border-white/6 hover:shadow-xl hover:shadow-blue-500/8 dark:hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden shrink-0">
        <Image
          src={article.urlToImage}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-600"
          unoptimized
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 dark:bg-black/60 backdrop-blur-sm text-gray-700 dark:text-white/80 text-xs font-medium px-2.5 py-1 rounded-full">
            {article.source.name}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(article.publishedAt)}</span>
          {article.author && (
            <>
              <span className="text-gray-200 dark:text-white/20">·</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 max-w-32">{article.author.split(',')[0]}</span>
            </>
          )}
        </div>

        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-2 group-hover:text-[#2563EB] dark:group-hover:text-violet-300 transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
          {article.description}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/6 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#2563EB] dark:text-violet-400 group-hover:underline">
            Read more
          </span>
          <svg className="w-4 h-4 text-[#2563EB] dark:text-violet-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </div>
      </div>
    </motion.a>
  );
}

export default function ArticlesSection() {
  const [activeTab, setActiveTab] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/news?category=${activeTab}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArticles(data.articles ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <section className="py-28 px-6 md:px-16 lg:px-24 bg-[#f8faff] dark:bg-[#060610] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-lg h-lg rounded-full bg-blue-200/25 dark:bg-violet-900/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-200/20 dark:bg-blue-900/10 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-violet-500/10 text-[#2563EB] dark:text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-blue-100 dark:border-violet-500/20">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-violet-400 inline-block animate-pulse" />
              Live from the industry
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Latest in Tech,<br className="hidden md:block" /> AI & Hiring
            </h2>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-base max-w-sm leading-relaxed">
            Real-time news on the job market, artificial intelligence breakthroughs, and the tech industry.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] dark:bg-violet-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-violet-600/25'
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-[#2563EB]/40 dark:hover:border-violet-500/40 hover:text-[#2563EB] dark:hover:text-violet-400'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">📡</p>
            <p className="font-medium">Couldn&apos;t reach the news feed.</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="space-y-8">
            <SkeletonCard big />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && articles.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Hero */}
              {hero && <HeroCard article={hero} />}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {rest.map((a, i) => (
                    <ArticleCard key={a.url} article={a} i={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">🗞️</p>
            <p className="font-medium">No articles found right now.</p>
          </div>
        )}
      </div>
    </section>
  );
}
