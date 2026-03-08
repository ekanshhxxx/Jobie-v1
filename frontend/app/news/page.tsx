'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  title: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  description?: string;
  author?: string;
}

const TABS = ['JOBS', 'AI', 'TECH'] as const;
type Tab = typeof TABS[number];
const TAB_CATS: Record<Tab, string> = { JOBS: 'jobs', AI: 'ai', TECH: 'tech' };
const PAGE_SIZE = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function longDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function editionDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ─── Category label ───────────────────────────────────────────────────────────

function CatLabel({ name, red = false }: { name: string; red?: boolean }) {
  return (
    <span className={`np-mono text-[10px] uppercase tracking-[0.18em] font-medium ${red ? 'text-[#CC0000]' : 'text-[#737373]'}`}>
      {name}
    </span>
  );
}

// ─── Breaking ticker ──────────────────────────────────────────────────────────

function BreakingTicker({ articles }: { articles: Article[] }) {
  const doubled = [...articles, ...articles];
  return (
    <div className="bg-[#111111] overflow-hidden np-ticker-wrap border-b-4 border-[#CC0000]">
      <div className="flex items-stretch">
        <span className="shrink-0 bg-[#CC0000] np-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 text-white flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Breaking
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex np-ticker-track">
            {doubled.map((a, i) => (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 np-mono text-[11px] px-5 py-2.5 text-neutral-300 hover:text-white transition-colors whitespace-nowrap border-r border-neutral-800 flex items-center gap-2"
              >
                <span className="text-[#CC0000] text-xs">◆</span>
                {a.title.length > 80 ? a.title.slice(0, 80) + '…' : a.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonPulse({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`bg-[#E5E5E0] animate-pulse ${className}`} style={style} />;
}

function HeroSkeleton() {
  return (
    <div className="grid lg:grid-cols-12 border-b border-[#111111]">
      <div className="lg:col-span-8 border-r border-[#111111] p-6 md:p-10 space-y-4">
        <SkeletonPulse className="w-full" style={{ height: '300px' } as React.CSSProperties} />
        <SkeletonPulse className="w-24 h-3" />
        <SkeletonPulse className="w-full h-12" />
        <SkeletonPulse className="w-4/5 h-12" />
        <SkeletonPulse className="w-3/5 h-10" />
        <div className="space-y-2 pt-2">
          <SkeletonPulse className="w-full h-3" />
          <SkeletonPulse className="w-full h-3" />
          <SkeletonPulse className="w-4/5 h-3" />
        </div>
      </div>
      <div className="lg:col-span-4 p-5 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 py-4 border-b border-[#E5E5E0]">
            <SkeletonPulse className="shrink-0" style={{ width: 72, height: 72 } as React.CSSProperties} />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="w-full h-3" />
              <SkeletonPulse className="w-4/5 h-3" />
              <SkeletonPulse className="w-16 h-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#111111]">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="border-b border-r border-[#111111] p-0 space-y-0">
          <SkeletonPulse className="w-full" style={{ height: 180 } as React.CSSProperties} />
          <div className="p-4 space-y-2">
            <SkeletonPulse className="w-20 h-2.5" />
            <SkeletonPulse className="w-full h-4" />
            <SkeletonPulse className="w-4/5 h-4" />
            <SkeletonPulse className="w-full h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hero article ─────────────────────────────────────────────────────────────

function HeroArticle({ article }: { article: Article }) {
  const cleanAuthor = article.author
    ? article.author.split(',')[0].split('(')[0].split('By ').pop()?.trim() ?? ''
    : '';

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="np-card group block lg:col-span-8 border-r border-[#111111] p-6 md:p-10 hover:bg-[#F4F4F2] transition-colors duration-200"
    >
      {/* Big grayscale image */}
      <div className="relative w-full overflow-hidden mb-6" style={{ height: 320 }}>
        <Image
          src={article.urlToImage}
          alt={article.title}
          fill
          className="object-cover np-img"
          style={{ borderRadius: 0 }}
          unoptimized
        />
        {/* Fig. caption strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#111111]/85 px-4 py-1.5">
          <span className="np-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Fig. 1.1 — {article.source.name}
          </span>
        </div>
      </div>

      {/* Source + time row */}
      <div className="flex items-center gap-4 mb-3">
        <CatLabel name={article.source.name} red />
        <span className="w-1 h-1 rounded-full bg-[#BCBCB8] inline-block" />
        <span className="np-mono text-[10px] text-[#737373]">{timeAgo(article.publishedAt)}</span>
      </div>

      {/* Massive Playfair headline */}
      <h1 className="np-serif font-black text-[#111111] leading-[0.93] tracking-tighter mb-6 text-4xl md:text-5xl lg:text-6xl">
        {article.title}
      </h1>

      {/* Drop-cap body */}
      {article.description && (
        <p className="np-body text-base md:text-lg leading-relaxed text-[#404040] np-drop-cap text-justify">
          {article.description}
        </p>
      )}

      {/* Meta footer */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[#E5E5E0]">
        {cleanAuthor && (
          <span className="np-mono text-[10px] uppercase tracking-widest text-[#737373]">
            By {cleanAuthor}
          </span>
        )}
        <span className="np-mono text-[10px] text-[#737373]">
          {longDate(article.publishedAt)}
        </span>
        <span className="ml-auto np-mono text-xs uppercase tracking-widest text-[#CC0000] underline-offset-4 decoration-[#CC0000] group-hover:underline">
          Read Full Story →
        </span>
      </div>
    </a>
  );
}

// ─── Sidebar article ─────────────────────────────────────────────────────────

function SidebarArticle({ article, idx }: { article: Article; idx: number }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`np-card group flex gap-3 py-4 -mx-3 px-3 hover:bg-[#F4F4F2] transition-colors ${idx > 0 ? 'border-t border-[#E5E5E0]' : ''}`}
    >
      <div className="relative shrink-0 overflow-hidden" style={{ width: 72, height: 72 }}>
        <Image
          src={article.urlToImage}
          alt={article.title}
          fill
          className="object-cover np-img"
          style={{ borderRadius: 0 }}
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <CatLabel name={article.source.name} red />
        <p className="np-serif text-sm font-bold text-[#111111] leading-tight mt-1 line-clamp-3 group-hover:underline underline-offset-2 decoration-[#CC0000] decoration-[1.5px]">
          {article.title}
        </p>
        <span className="np-mono text-[10px] text-[#737373] mt-1 block">{timeAgo(article.publishedAt)}</span>
      </div>
    </a>
  );
}

// ─── Grid card ───────────────────────────────────────────────────────────────

function GridCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="np-card group block hover:bg-[#F4F4F2] transition-colors duration-200"
    >
      <div className="relative overflow-hidden" style={{ height: 190 }}>
        <Image
          src={article.urlToImage}
          alt={article.title}
          fill
          className="object-cover np-img"
          style={{ borderRadius: 0 }}
          unoptimized
        />
      </div>
      <div className="p-4 border-t border-[#111111]">
        <div className="flex items-center justify-between mb-2">
          <CatLabel name={article.source.name} red />
          <span className="np-mono text-[10px] text-[#737373]">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="np-serif text-lg font-bold text-[#111111] leading-tight line-clamp-3 group-hover:underline underline-offset-2 decoration-[#CC0000] decoration-2 mb-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="np-body text-xs text-[#525252] leading-relaxed line-clamp-2 hidden md:block">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [tab, setTab] = useState<Tab>('JOBS');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingTab, setLoadingTab] = useState<Tab | null>('JOBS');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const [groqInsight, setGroqInsight] = useState<string | null>(null);
  const [groqLoading, setGroqLoading] = useState(false);

  const startPage = useRef(1);
  const nextPage  = useRef(2);
  const switchCount = useRef(0);

  const loading = loadingTab === tab;

  // Defined before useEffect so it can be called inside it
  async function fetchGroqInsight(headlines: string[], category: string) {
    setGroqLoading(true);
    setGroqInsight(null);
    try {
      const res = await fetch('/api/groq-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headlines, category }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroqInsight(data.insight ?? null);
      }
    } catch { /* Groq is optional - fail silently */ }
    setGroqLoading(false);
}

  // Randomise start page on mount for variety on each refresh
  useEffect(() => {
    startPage.current = Math.ceil(Math.random() * 4);
    nextPage.current  = startPage.current + 1;
  }, []);

  // Fetch articles when tab changes
  useEffect(() => {
    let cancelled = false;
    const pg = startPage.current;
    fetch(`/api/news?category=${TAB_CATS[tab]}&pageSize=${PAGE_SIZE}&page=${pg}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const fresh: Article[] = data.articles ?? [];
        setArticles(fresh);
        setHasMore(fresh.length === PAGE_SIZE);
        nextPage.current = pg + 1;
        setLoadingTab(null);
        if (fresh.length > 0) fetchGroqInsight(fresh.slice(0, 6).map(a => a.title), TAB_CATS[tab]);
      })
      .catch(() => { if (!cancelled) setLoadingTab(null); });
    return () => { cancelled = true; };
  }, [tab]);

  function switchTab(t: Tab) {
    if (t === tab) return;
    setTab(t);
    setLoadingTab(t);
    setArticles([]);
    setGroqInsight(null);
    setQuery('');
    switchCount.current += 1;
    const p = (switchCount.current % 4) + 1;
    startPage.current = p;
    nextPage.current  = p + 1;
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    const pg = nextPage.current;
    fetch(`/api/news?category=${TAB_CATS[tab]}&pageSize=${PAGE_SIZE}&page=${pg}`)
      .then(r => r.json())
      .then(data => {
        const more: Article[] = data.articles ?? [];
        setArticles(prev => {
          const existingUrls = new Set(prev.map(a => a.url));
          return [...prev, ...more.filter(a => !existingUrls.has(a.url))];
        });
        setHasMore(more.length === PAGE_SIZE);
        nextPage.current = pg + 1;
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }

  // fetchGroqInsight is defined above, before the useEffect

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return articles;
    const q = query.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.source.name.toLowerCase().includes(q)
    );
  }, [articles, query]);

  const hero    = filtered[0];
  const sidebar = filtered.slice(1, 5);
  const grid    = filtered.slice(5);

  return (
    <main className="min-h-screen np-dot-bg" style={{ background: '#F9F9F7', color: '#111111' }}>

      {/* ── MASTHEAD ──────────────────────────────────────────────── */}
      <div className="border-b-4 border-[#111111]">
        <div className="border-b border-[#111111] px-4 md:px-8 py-1.5 flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
          <span className="np-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Jobs · AI · Technology
          </span>
          <span className="np-mono text-[10px] text-[#737373] hidden sm:block">{editionDate()}</span>
          <span className="np-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Vol. I — Career Intelligence Daily
          </span>
        </div>
        <div className="text-center py-8 md:py-12 px-4 select-none">
          <p className="np-mono text-[10px] uppercase tracking-[0.5em] text-[#BCBCB8] mb-4">◆ ◆ ◆</p>
          <h1 className="np-serif font-black text-[#111111] leading-none tracking-tighter text-5xl sm:text-7xl md:text-8xl lg:text-9xl">
            The Jobie
          </h1>
          <h1 className="np-serif font-black text-[#111111] leading-none tracking-tighter text-5xl sm:text-7xl md:text-8xl lg:text-9xl">
            Dispatch
          </h1>
          <p className="np-serif italic text-[#737373] text-sm md:text-base mt-3">
            &ldquo;All the Jobs That Are Fit to Print.&rdquo;
          </p>
          <p className="np-mono text-[10px] uppercase tracking-[0.5em] text-[#BCBCB8] mt-4">◆ ◆ ◆</p>
        </div>
      </div>

      {/* ── BREAKING TICKER ───────────────────────────────────────── */}
      {!loading && articles.length > 0 && (
        <BreakingTicker articles={articles.slice(0, 8)} />
      )}

      {/* ── TABS + SEARCH ─────────────────────────────────────────── */}
      <div className="border-b border-[#111111] flex flex-wrap items-stretch">
        {/* Tab buttons */}
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`np-mono text-[11px] uppercase tracking-widest font-semibold shrink-0 px-5 md:px-8 py-3 border-r border-[#111111] transition-colors duration-150 min-h-11 ${
                tab === t
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-transparent text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex-1 flex items-center border-l border-[#111111] min-w-48 relative">
          <span className="pointer-events-none absolute left-3 text-[#BCBCB8]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stories…"
            className="w-full np-mono text-xs bg-transparent text-[#111111] pl-8 pr-4 py-3 min-h-11 focus:outline-none focus:bg-[#F4F4F2] placeholder:text-[#BCBCB8] transition-colors"
            style={{ borderRadius: 0 }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 text-[#BCBCB8] hover:text-[#111111] transition-colors"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Home link */}
        <Link
          href="/"
          className="np-mono text-[11px] uppercase tracking-widest text-[#737373] hover:text-[#CC0000] px-5 py-3 transition-colors duration-150 hidden md:flex items-center gap-2 shrink-0 border-l border-[#111111]"
        >
          ← Jobie Home
        </Link>
      </div>

      {/* ── GROQ AI DISPATCH STRIP ────────────────────────────────── */}
      {(groqInsight || groqLoading) && (
        <div className="border-b border-[#111111]" style={{ background: '#111111' }}>
          <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-7xl mx-auto">
            <span className="np-mono text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 shrink-0 flex items-center gap-1.5"
              style={{ background: '#CC0000', color: '#fff', borderRadius: 0 }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              AI Dispatch
            </span>
            {groqLoading ? (
              <div className="flex items-center gap-2">
                <span className="np-mono text-[11px] text-neutral-500">Groq is analysing today&apos;s headlines</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </div>
            ) : (
              <p className="np-body text-sm text-neutral-300 leading-relaxed">{groqInsight}</p>
            )}
          </div>
        </div>
      )}

      {/* ── SEARCH RESULTS NOTICE ─────────────────────────────────── */}
      {query.trim() && !loading && (
        <div className="border-b border-[#E5E5E0] px-4 md:px-8 py-2 flex items-center gap-3">
          <span className="np-mono text-[10px] uppercase tracking-widest text-[#737373]">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </span>
        </div>
      )}

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">

        {/* Hero + Sidebar */}
        {loading ? (
          <HeroSkeleton />
        ) : hero ? (
          <div className="grid lg:grid-cols-12 border-b border-[#111111]">
            <HeroArticle article={hero} />
            <div className="lg:col-span-4 p-5 md:p-6">
              <div className="pb-2 mb-3 border-b-2 border-[#111111]">
                <span className="np-mono text-[10px] uppercase tracking-widest font-bold text-[#111111]">
                  Also Today
                </span>
              </div>
              {sidebar.map((a, i) => (
                <SidebarArticle key={a.url} article={a} idx={i} />
              ))}
            </div>
          </div>
        ) : !loading && filtered.length === 0 ? (
          <div className="py-20 text-center border-b border-[#E5E5E0]">
            <p className="np-serif text-3xl font-black text-[#111111] mb-2">No stories found.</p>
            <p className="np-body text-sm text-[#737373]">
              {query ? `Try a different search term.` : `No articles available right now. Try a different category.`}
            </p>
          </div>
        ) : null}

        {/* Ornamental divider */}
        {!loading && filtered.length > 0 && (
          <div className="py-5 text-center border-b border-[#E5E5E0]">
            <span className="np-serif text-2xl text-[#CDCDC9] tracking-[0.8em] select-none">✦ ✦ ✦</span>
          </div>
        )}

        {/* More stories label */}
        {!loading && grid.length > 0 && (
          <div className="px-4 md:px-6 pt-5 pb-3 border-b border-[#111111] flex items-center justify-between">
            <span className="np-mono text-[10px] uppercase tracking-widest font-bold text-[#111111]">More Stories</span>
            <span className="np-mono text-[10px] text-[#737373]">{grid.length} articles</span>
          </div>
        )}

        {/* 4-column grid */}
        {loading ? (
          <GridSkeleton />
        ) : grid.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#111111]">
            {grid.map(a => (
              <div key={a.url} className="border-b border-r border-[#111111]">
                <GridCard article={a} />
              </div>
            ))}
          </div>
        ) : null}

        {/* ── LOAD MORE ─────────────────────────────────────────── */}
        {!loading && !query && articles.length > 0 && (
          <div className="border-t-4 border-[#111111] text-center py-10 px-4">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="np-mono text-xs uppercase tracking-widest font-bold px-10 py-4 min-h-11 border-2 border-[#111111] transition-all duration-200 disabled:opacity-50"
                style={{
                  background: loadingMore ? '#111111' : 'transparent',
                  color: loadingMore ? '#F9F9F7' : '#111111',
                  borderRadius: 0,
                }}
                onMouseEnter={e => { if (!loadingMore) { (e.currentTarget as HTMLButtonElement).style.background = '#111111'; (e.currentTarget as HTMLButtonElement).style.color = '#F9F9F7'; } }}
                onMouseLeave={e => { if (!loadingMore) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#111111'; } }}
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                    Loading next edition…
                  </span>
                ) : (
                  '↓ Load Next Edition'
                )}
              </button>
            ) : (
              <p className="np-mono text-[10px] uppercase tracking-widest text-[#BCBCB8]">
                — End of this edition —
              </p>
            )}
          </div>
        )}

        {/* ── INVERTED SUBSCRIBE ─────────────────────────────────── */}
        <div
          className="relative overflow-hidden px-6 md:px-16 py-16 md:py-20 text-center border-t border-[#111111]"
          style={{ background: '#111111', color: '#F9F9F7' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 98%, rgba(255,255,255,0.15) 100%), linear-gradient(90deg, transparent 98%, rgba(255,255,255,0.15) 100%)',
              backgroundSize: '3px 3px',
            }}
          />
          <p className="np-mono text-[10px] uppercase tracking-[0.5em] text-neutral-600 mb-5 relative">◆ ◆ ◆</p>
          <h2 className="np-serif text-3xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter text-[#F9F9F7] mb-4 relative">
            Stay Ahead of the{' '}
            <span className="italic" style={{ color: '#CC0000' }}>News Cycle.</span>
          </h2>
          <p className="np-body text-sm md:text-base text-neutral-400 max-w-lg mx-auto leading-relaxed mb-10 relative">
            The most important career, AI, and technology stories — curated fresh for job seekers and tech professionals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center max-w-sm mx-auto relative">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 np-mono text-sm bg-[#1c1c1c] text-white border border-neutral-700 focus:border-[#CC0000] focus:outline-none px-4 py-3 min-h-11 placeholder:text-neutral-600"
              style={{ borderRadius: 0 }}
            />
            <button
              className="np-mono text-[11px] uppercase tracking-widest font-bold px-6 py-3 min-h-11 transition-colors duration-200 shrink-0"
              style={{ background: '#CC0000', color: '#fff', borderRadius: 0, border: '1px solid #CC0000' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#aa0000'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#CC0000'; }}
            >
              Subscribe
            </button>
          </div>
          <p className="np-mono text-[10px] uppercase tracking-[0.5em] text-neutral-700 mt-10 relative">◆ ◆ ◆</p>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer className="border-t border-[#111111] grid grid-cols-1 md:grid-cols-3">
          <div className="p-6 md:p-8 md:border-r border-[#111111] border-b md:border-b-0">
            <p className="np-serif text-xl font-black text-[#111111] mb-2">The Jobie Dispatch</p>
            <p className="np-body text-xs text-[#737373] leading-relaxed max-w-xs">
              Career intelligence for the modern professional. AI-curated news on jobs, hiring trends, and the future of work.
            </p>
          </div>
          <div className="p-6 md:p-8 text-left md:text-center md:border-r border-[#111111] border-b md:border-b-0">
            <p className="np-mono text-[10px] uppercase tracking-widest text-[#737373] mb-1">Edition</p>
            <p className="np-serif text-base font-bold text-[#111111]">Vol. I, Issue No. 1</p>
            <p className="np-mono text-[10px] text-[#737373] mt-1">{editionDate()}</p>
            <p className="np-mono text-[10px] text-[#BCBCB8] mt-3">Powered by NewsAPI · Groq AI</p>
          </div>
          <div className="p-6 md:p-8">
            <p className="np-mono text-[10px] uppercase tracking-widest text-[#737373] mb-3">Navigate</p>
            <div className="flex flex-col gap-2">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => { switchTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="np-mono text-xs text-[#111111] hover:text-[#CC0000] uppercase tracking-widest transition-colors text-left"
                >
                  {t}
                </button>
              ))}
              <Link href="/" className="np-mono text-xs text-[#737373] hover:text-[#CC0000] uppercase tracking-widest transition-colors mt-1">
                ← Back to Jobie
              </Link>
            </div>
          </div>
        </footer>

        <div className="border-t-4 border-[#111111] px-6 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: '#111111' }}>
          <span className="np-mono text-[10px] uppercase tracking-widest text-neutral-600">
            © {new Date().getFullYear()} The Jobie Dispatch · All rights reserved.
          </span>
          <span className="np-mono text-[10px] uppercase tracking-widest text-neutral-600">
            Vol. I · Career Intelligence Edition
          </span>
        </div>

      </div>
    </main>
  );
}
