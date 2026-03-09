'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

const heroImages = ["/hero.png", "/interview-i.png"];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((c) => (c + 1) % heroImages.length), []);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-[#EFF6FF] via-[#EBF3FF] to-white dark:from-[#060610] dark:via-[#0d0b1e] dark:to-[#060610]">
      {/* Coloured mesh blobs � these give backdrop-blur something to blur against */}
      <div className="absolute top-10 left-6 w-125 h-125 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 left-72 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-24 w-72 h-72 bg-sky-300/18 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

      <section className="relative flex items-center justify-between px-8 md:px-20 lg:px-32 pt-12 pb-20 gap-10">

        {/* -- Left: Text -- */}
        <div className="max-w-xl z-10">

          {/* Glass pill badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/40 dark:bg-white/6 backdrop-blur-xl border border-blue-200/60 dark:border-white/10 text-[#2563EB] dark:text-violet-400 text-xs font-semibold px-5 py-2.5 rounded-full mb-8 shadow-sm shadow-blue-100 dark:shadow-none">
            <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse" />
            AI-Powered Job Matching
          </div>

          <h1 className="text-6xl font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white">
            Land Your{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED]">
              Dream Job
            </span>
            <br />
            <span className="text-gray-700 font-extrabold">With Your Skills</span>
          </h1>

          <p className="mt-6 text-[1.05rem] text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
            GitHub-verified skills. AI-parsed resumes. Thousands of roles
            matched exactly to what you bring to the table.
          </p>

          <div className="flex items-center mt-10 gap-5 flex-wrap">
            <Link
              href="/register"
              className="bg-[#2563EB] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#1D4ED8] transition-all shadow-xl shadow-blue-400/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2.5 text-gray-500 font-medium hover:text-[#2563EB] transition-colors group">
              <span className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-xl border border-blue-100/80 flex items-center justify-center text-xs text-gray-600 group-hover:border-[#2563EB]/40 group-hover:text-[#2563EB] transition-all shadow-sm">
                ?
              </span>
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div className="flex gap-10 mt-14 pt-8 border-t border-blue-100/60 dark:border-white/10">
            {([ ["20K+", "Active Users"], ["86K+", "Jobs Listed"], ["97%", "Success Rate"] ] as const).map(([num, label]) => (
              <div key={label}>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{num}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 tracking-wide font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* -- Right: Hero image carousel with glass cards -- */}
        <div className="relative flex-1 h-150 z-10">
          {/* Image carousel container */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            {heroImages.map((src, i) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <Image
                  src={src}
                  alt="hero"
                  fill
                  className="object-contain object-center"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/40 w-2'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>


          {/* - Glass card 1: Posted today (top-left, pokes out from image) - */}
          <div className="absolute top-10 -left-6 z-20 flex items-center gap-3 bg-white/15 [backdrop-filter:blur(32px)_saturate(180%)] border border-white/50 rounded-2xl px-5 py-3.5 shadow-[0_8px_40px_rgba(37,99,235,0.25)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/70 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-white/60 font-medium leading-none mb-0.5">Posted today</p>
              <p className="text-base font-black text-white leading-tight">250+ Jobs</p>
            </div>
          </div>

          {/* - Glass card 2: Match Score (mid-left, pokes out) - */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-8 z-20 bg-white/15 [backdrop-filter:blur(32px)_saturate(180%)] border border-white/50 rounded-2xl px-5 py-4 shadow-[0_8px_40px_rgba(124,58,237,0.25)]">
            <p className="text-[10px] text-white/55 font-semibold uppercase tracking-wider mb-2.5">Your Match</p>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#34D399" strokeWidth="3" strokeDasharray="94.2" strokeDashoffset="5.6" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-black">98</span>
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">Perfect fit</p>
                <p className="text-emerald-300 text-[10px] mt-0.5 font-medium">Senior UI Role</p>
              </div>
            </div>
          </div>

          {/* - Glass card 3: Companies (bottom-right, pokes out) - */}
          <div className="absolute bottom-10 -right-6 z-20 bg-white/15 [backdrop-filter:blur(32px)_saturate(180%)] border border-white/50 rounded-2xl px-5 py-4 shadow-[0_8px_40px_rgba(37,99,235,0.25)]">
            <p className="text-[10px] text-white/55 font-semibold uppercase tracking-wider mb-3">Top companies hiring</p>
            <div className="flex -space-x-2.5">
              {["/spotify-logo.png", "/stripe-logo.png", "/airbnb-logo.png"].map((src, i) => (
                <Image key={i} src={src} alt="company" width={30} height={30} className="rounded-full border-2 border-white/60 object-contain bg-white" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white/60 bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-bold">+81</div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}