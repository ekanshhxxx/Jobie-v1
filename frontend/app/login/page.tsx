'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api, setAuth } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth, provider } from "../../src/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider
} from "firebase/auth";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleProvider = new GoogleAuthProvider();
  const githubProvider = new GithubAuthProvider();
  const [userId, setUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password
      });

      // OTP step start
      if (data.userId) {
        setUserId(data.userId);
        setShowOtp(true);

        toast({
          type: 'success',
          title: 'OTP sent',
          message: 'Check your email for OTP'
        });
      }

    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Login failed";
      setError(msg);
      toast({
        type: 'error',
        title: 'Sign in failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const data = await api.post("/api/auth/firebase-login", { token: idToken });
      console.log("Firebase login response:", data);

      const userIdFromRes = data.userId;

      if (!userIdFromRes) {
        throw new Error("User ID missing in backend response");
      }

      setUserId(userIdFromRes);
      setShowOtp(true);

      toast({
        type: 'success',
        title: 'OTP sent',
        message: 'Check your email for OTP',
      });

    } catch (err: any) {
      console.error("Google login failed", err);
      toast({
        type: 'error',
        title: 'Login failed',
        message: err.message || "Something went wrong",
      });
    }
  };


  const handleGithubLogin = async () => {
    try {
      const githubProvider = new GithubAuthProvider();
      githubProvider.setCustomParameters({ allow_signup: 'true', prompt: 'select_account' });

      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const data = await api.post("/api/auth/firebase-login", { token: idToken });
      console.log("GitHub login response:", data);

      const userIdFromRes = data.userId;

      if (!userIdFromRes) throw new Error("User ID missing in backend response");

      setUserId(userIdFromRes);
      setShowOtp(true);

      toast({
        type: 'success',
        title: 'OTP sent',
        message: 'Check your email for OTP',
      });

    } catch (err: any) {
      console.error("GitHub login failed", err);
      toast({
        type: 'error',
        title: 'Login failed',
        message: err.message || "Something went wrong",
      });
    }
  };


  const verifyOtp = async () => {
    try {
      const data = await api.post('/api/auth/verify-otp', {
        userId,
        otp
      });

      setAuth(data.token, data.user);

      toast({
        type: 'success',
        title: 'Login successful',
        message: 'Welcome back!'
      });

      // Role-based redirect
      if (data.user.role === "recruiter") {
        router.push("/recruiter/dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err: any) {
      console.error("OTP verification failed", err);
      toast({
        type: 'error',
        title: 'OTP failed',
        message: err.message || "OTP verification failed"
      });
    }
  };


  const handleResendOtp = async () => {
    try {
      const data = await api.post("/api/auth/resend-otp", { userId });
      setMessage("OTP sent successfully");
    } catch (err) {
      setMessage("Failed to resend OTP");
    }
  };


  return (
    <div className="fixed inset-0 z-60 flex bg-white dark:bg-[#060610]">

      {/* ── LEFT: Form Panel ── */}
      <div className="w-full lg:w-[52%] flex flex-col h-full relative overflow-hidden bg-white dark:bg-[#060610]">

        {/* Subtle ambient blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/60 dark:bg-violet-900/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-50/80 dark:bg-blue-900/10 blur-3xl" />

        {/* Top bar: logo */}
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
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-violet-500/10 text-[#2563EB] dark:text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100 dark:border-violet-500/20">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-violet-400 inline-block animate-pulse" />
              200K+ candidates trust Jobie
            </div>

            <h1 className="text-[2rem] font-bold text-gray-900 dark:text-white mb-1 leading-tight">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              Sign in to continue your career journey.
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
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl transition cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl transition cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                </svg>
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <hr className="flex-1 border-gray-200 dark:border-white/10" />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or continue with email</span>
              <hr className="flex-1 border-gray-200 dark:border-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input
                    type="email"
                    className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 focus:bg-white dark:focus:bg-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2563EB]/40 dark:focus:ring-violet-500/40 focus:border-[#2563EB] dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <button type="button" className="text-xs text-[#2563EB] dark:text-violet-400 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 focus:bg-white dark:focus:bg-white/8 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2563EB]/40 dark:focus:ring-violet-500/40 focus:border-[#2563EB] dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Enter your password"
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
              </div>

              {showOtp && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  {/* Blur background */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                  {/* Popup box */}
                  <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-[400px]">
                    <h2 className="text-2xl font-semibold text-center mb-4">
                      Enter OTP
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                      We sent a 6 digit code to your email
                    </p>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg tracking-widest"
                    />
                    <button
                      onClick={verifyOtp}
                      className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
                    >
                      Verify OTP
                    </button>
                    <button
                      onClick={() => setShowOtp(false)}
                      className="w-full mt-2 text-gray-500"
                    >
                      Cancel
                    </button>
                    <button onClick={handleResendOtp}>
                      Resend OTP
                    </button>
                    {message && <p className="text-sm text-center mt-2 text-gray-500">{message}</p>}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden group bg-[#2563EB] dark:bg-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] dark:hover:bg-violet-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/30 dark:shadow-violet-600/30 mt-2 cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Signing in...
                  </span>
                ) : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#2563EB] dark:text-violet-400 font-semibold hover:underline">
                Create one free
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
        {/* Background image */}
        <Image
          src="/interview-i.png"
          alt="Professional at work"
          fill
          className="object-cover object-center"
          priority
        />

        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0f172a]/70 via-[#1e1b4b]/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0f172a]/90 via-transparent to-transparent" />

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
            <span className="text-lg">🏆</span>
            <span>Trusted by <strong>200K+</strong> job seekers</span>
          </div>
        </div>

        {/* Sparkle */}
        <div className="absolute top-1/2 right-12 -translate-y-32 text-white/30 text-5xl select-none">✦</div>
        <div className="absolute top-1/3 left-16 text-white/20 text-2xl select-none">✦</div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          {/* Stats row */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { value: '50K+', label: 'Companies' },
              { value: '1.2M+', label: 'Jobs Listed' },
              { value: '98%', label: 'Match Rate' },
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
            Your next opportunity<br />is one click away.
          </h2>
          <p className="text-white/65 text-sm max-w-sm mb-7 leading-relaxed">
            AI matches you to the perfect role based on your real skills — not just keywords.
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