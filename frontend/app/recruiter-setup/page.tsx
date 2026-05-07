'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../lib/api';
import { Building2, Save, ArrowRight, CheckCircle2, Bot, ShieldCheck, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '../components/ToastProvider';

export default function RecruiterOnboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    bio: '',
  });

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    setUser(u);
    checkProfile(u.id);
  }, [router]);

  const checkProfile = async (id: number) => {
    try {
      const profileRes = await api.get(`/api/profile/${id}`);
      const profile = profileRes?.profile ?? profileRes;
      const approvalState = String(profile?.headline ?? '').trim().toUpperCase();
      if (approvalState === "PENDING_ADMIN_APPROVAL") {
        setStep(4);
        return;
      }
      if (approvalState === "VERIFIED") {
        router.push('/recruiter/dashboard');
        return;
      }
      if (profile?.companyName) {
        router.push('/recruiter/dashboard');
      }
    } catch (e) {
      // Profile doesn't exist yet, proceed with onboarding
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 4 && user) {
      interval = setInterval(() => {
        checkProfile(user.id);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, user]);

  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName,
        website: form.website,
        bio: form.bio,
        headline: "PENDING_ADMIN_APPROVAL", // Track pending status
      };

      // Upsert strategy: update first (existing profile), create only if missing.
      try {
        await api.put(`/api/profile/${user.id}`, payload);
      } catch (error: any) {
        if (error?.status === 404) {
          await api.post(`/api/profile/${user.id}`, payload);
        } else {
          throw error;
        }
      }

      setAiScanning(false);
      setStep(4);
      toast({
        type: 'success',
        title: 'Profile Submitted',
        message: 'Your profile is queued for Admin Approval.'
      });
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Setup Failed',
        message: error?.message || 'We could not submit your profile at this time.'
      });
      setAiScanning(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 dark:bg-violet-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full">
        {/* Header Steps */}
        <div className="mb-8 flex items-center justify-between px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                ${step > s ? 'bg-violet-600 text-white' : step === s ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 ring-2 ring-violet-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}
              `}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s !== 3 && (
                <div className={`w-24 sm:w-32 h-1 mx-2 rounded-full transition-all duration-500
                  ${step > s ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-800'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/80 dark:border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative overflow-hidden transition-all duration-500">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome to Jobie HR</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Let's set up your company profile. We need a few details to verify your identity.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Website</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
                    placeholder="https://acme.com"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  disabled={!form.companyName || !form.website}
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-200 dark:shadow-violet-900/20 disabled:opacity-50"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Company Context</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Tell our AI about your company. We use this to verify legitimacy and match candidates.</p>
              
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Company Description</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="w-full px-5 py-4 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none dark:text-white text-base"
                  placeholder="We are a fast-growing startup revolutionizing..."
                />
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium">
                  Back
                </button>
                <button
                  disabled={form.bio.length < 20}
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20 disabled:opacity-50"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center py-10">
              {aiScanning ? (
                <>
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-violet-200 dark:border-violet-900/40 rounded-full" />
                    <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin" />
                    <Bot className="w-10 h-10 text-violet-600 dark:text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI Security Scan in Progress...</h1>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Analyzing domain authority and cross-referencing company description patterns.</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-gradient-to-tr from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <ShieldCheck className="w-12 h-12 text-white dark:text-gray-300" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Submit to Admin</h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg max-w-sm mx-auto">Your profile is ready to be sent to Jobie Admins for final verification.</p>
                  
                  <div className="flex justify-between items-center max-w-sm mx-auto">
                    <button onClick={() => setStep(2)} className="text-gray-500 font-medium">Back</button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-bold transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Verify & Submit
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in zoom-in-95 duration-1000 w-full max-w-4xl mx-auto py-8">
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative shadow-inner">
                  <div className="absolute inset-0 border-[3px] border-amber-400/30 rounded-[2rem] animate-ping opacity-30" />
                  <ShieldCheck className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Pending Admin Verification</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Your profile has been queued for security review to protect candidate data. You will receive an email once an administrator approves your access.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="bg-gray-50/80 dark:bg-white/5 border border-gray-100/50 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Identity Scan</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Website cross-checked</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/80 dark:bg-white/5 border border-gray-100/50 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 relative">
                       <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Admin Approval</h3>
                      <p className="text-xs text-amber-600 dark:text-amber-400">In Queue (Est: 2hrs)</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <button 
                    onClick={() => checkProfile(user.id)}
                    className="group relative px-6 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-bold border border-violet-500/30 transition-all flex items-center gap-2 mx-auto overflow-hidden group"
                  >
                    <Loader2 className="w-4 h-4 group-hover:animate-spin" />
                    I've been approved — Recheck Status
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 pt-8 mt-2 max-w-2xl mx-auto">
                    <h2 className="text-left font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Latest Platform Updates
                    </h2>
                    <div className="space-y-3">
                        <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 text-left border border-white/40 dark:border-white/5">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Candidate Matching is Live</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Our LLaMA-based parser now auto-ranks candidates against your active jobs instantly.</p>
                        </div>
                        <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 text-left border border-white/40 dark:border-white/5">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">New Analytics Dashboard</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track pipeline conversion rates securely via our improved Dashboard Metrics.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10">
                   <button className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => {
                     api.post('/api/auth/logout').finally(() => router.push('/login'));
                   }}>Sign out of Account</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
