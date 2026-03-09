'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api, setAuth } from '../lib/api';
import { useToast } from '../components/ToastProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/api/auth/register', form);
      setAuth(data.token, data.user);
      const firstName = form.name.trim().split(' ')[0];
      toast({
        type: 'success',
        emoji: '🎉',
        title: `Account created, ${firstName}!`,
        message: `Welcome to Jobie. Your journey starts now.`,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      toast({
        type: 'error',
        title: 'Registration failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex bg-white dark:bg-[#060610]">

      {/* ── LEFT: Form Panel ── */}
      <div className="w-full lg:w-[52%] flex flex-col h-full relative overflow-hidden bg-white dark:bg-[#060610]">

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-100/50 dark:bg-violet-900/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-50/80 dark:bg-indigo-900/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 px-8 md:px-14 pt-8 pb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-2xl font-extrabold tracking-tight">
            <span className="text-gray-900 dark:text-white">Job</span>
            <span className="bg-linear-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">ie</span>
          </Link>
        </div>

        {/* Center-aligned form */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 md:px-14 overflow-y-auto">
          <div className="w-full max-w-100">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-violet-100 dark:border-violet-500/20">
              <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 inline-block animate-pulse" />
              Free forever · No credit card needed
            </div>

            <h1 className="text-[2rem] font-bold text-gray-900 dark:text-white mb-1 leading-tight">
              Create your account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              Join 200K+ professionals landing their dream jobs.
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9h2v4H9V9zm0-2h2v2H9V7z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            {/* Social login */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <hr className="flex-1 border-gray-200 dark:border-white/10" />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or sign up with email</span>
              <hr className="flex-1 border-gray-200 dark:border-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 focus:bg-white dark:focus:bg-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 dark:focus:ring-violet-500/40 focus:border-violet-500 dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Alex Johnson"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input
                    type="email"
                    className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 focus:bg-white dark:focus:bg-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 dark:focus:ring-violet-500/40 focus:border-violet-500 dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 focus:bg-white dark:focus:bg-white/8 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 dark:focus:ring-violet-500/40 focus:border-violet-500 dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Min. 8 characters"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 pl-1">At least 8 characters</p>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am joining as a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    key="candidate"
                    type="button"
                    onClick={() => setForm({ ...form, role: 'candidate' })}
                    className={`relative py-3 px-3 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 overflow-hidden ${
                      form.role === 'candidate'
                        ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500 dark:border-violet-500 text-violet-600 dark:text-violet-400 shadow-sm shadow-violet-500/15'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/3'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Candidate
                    {form.role === 'candidate' && <span className="ml-auto w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse" />}
                  </button>
                  <button
                    key="recruiter"
                    type="button"
                    onClick={() => setForm({ ...form, role: 'recruiter' })}
                    className={`relative py-3 px-3 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 overflow-hidden ${
                      form.role === 'recruiter'
                        ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500 dark:border-violet-500 text-violet-600 dark:text-violet-400 shadow-sm shadow-violet-500/15'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/3'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Recruiter
                    {form.role === 'recruiter' && <span className="ml-auto w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden group bg-linear-to-r from-[#2563EB] to-[#7C3AED] text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-violet-500/25 mt-1 cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating your account...
                  </span>
                ) : 'Create account →'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-[#2563EB] dark:text-violet-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 md:px-14 py-6 flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
          <span>&copy; Jobie {new Date().getFullYear()}</span>
          <a href="mailto:support@jobie.com" className="hover:text-gray-600 dark:hover:text-gray-400 transition">support@jobie.com</a>
        </div>
      </div>

      {/* ── RIGHT: Visual Panel ── */}
      <div className="hidden lg:block lg:w-[48%] relative overflow-hidden h-full">
        <Image
          src="/interviewer-reading-applicants-long-resume.jpg"
          alt="Career growth"
          fill
          className="object-contain object-center scale-90"
          priority
        />

        {/* Multi-layer overlay — indigo/violet tinted for differentiation from login */}
        <div className="absolute inset-0 bg-linear-to-br from-[#1e1b4b]/75 via-[#312e81]/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0f0a2a]/90 via-transparent to-transparent" />

        {/* Top badge */}
        <div className="absolute top-10 left-10 right-10">
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-medium text-white"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <span className="text-lg">🚀</span>
            <span>Land your offer in <strong>30 days avg.</strong></span>
          </div>
        </div>

        {/* Sparkles */}
        <div className="absolute top-1/3 right-14 text-white/25 text-5xl select-none">✦</div>
        <div className="absolute top-1/2 left-10 text-white/20 text-2xl select-none">✦</div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          {/* Stats */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { value: '2 min', label: 'Sign up' },
              { value: 'AI', label: 'Matched jobs' },
              { value: '500+', label: 'Companies hiring' },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex-1 text-center py-3 px-2 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div className="text-white font-bold text-lg leading-tight">{stat.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-snug mb-3">
            Start building your<br />career today.
          </h2>
          <p className="text-white/65 text-sm max-w-sm mb-7 leading-relaxed">
            AI matches you with roles where you&apos;ll actually thrive — based on your skills, not just keyword hits.
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {['/spotify-logo.png', '/stripe-logo.png', '/airbnb-logo.png', '/slack-logo.png'].map((src, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-white overflow-hidden">
                  <Image src={src} alt="company" width={32} height={32} className="object-contain w-full h-full" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-sm tracking-tight">★★★★★</span>
              <span className="text-white font-bold text-sm">5.0</span>
              <span className="text-white/50 text-xs">· 200+ reviews</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
