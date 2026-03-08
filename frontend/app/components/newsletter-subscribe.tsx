"use client";
import Image from "next/image";
import React, { useState } from "react";

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section className="py-10 px-8 md:px-20">
      <div className="relative bg-linear-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] rounded-3xl overflow-hidden px-10 py-16 md:py-20">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          {/* Image */}
          <div className="hidden lg:block shrink-0">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl" />
              <Image src="/newsletter-image.jpg" alt="Newsletter" fill className="relative rounded-2xl object-cover shadow-2xl" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-white text-center lg:text-left">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
              Stay Ahead
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              Get notified for daily jobs
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-md">
              Never miss an opportunity. Subscribe and get curated job alerts delivered straight to your inbox.
            </p>

            {submitted ? (
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md text-white font-semibold px-8 py-4 rounded-2xl text-lg">
                <span className="text-green-300 text-2xl">&#10003;</span>
                You&apos;re on the list!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-5 py-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="bg-white text-[#2563EB] px-7 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg shadow-black/20 whitespace-nowrap"
                >
                  Get Notified
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
