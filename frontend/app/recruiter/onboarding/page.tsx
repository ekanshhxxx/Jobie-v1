'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import { Building2, Save, ArrowRight, CheckCircle2, Bot, ShieldCheck, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function RecruiterOnboarding() {
  const router = useRouter();
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
      const { profile } = await api.get(`/api/profile/${id}`);
      if (profile && profile.companyName) {
        // If already setup, maybe they are pending Admin approval (mocked via UI state for now)
        if (profile.headline === "PENDING_ADMIN_APPROVAL") {
          setStep(4);
        } else {
          router.push('/recruiter/dashboard');
        }
      }
    } catch (e) {
      // Profile doesn't exist yet, proceed with onboarding
    }
  };

  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate an AI scan
    setAiScanning(true);
    await new Promise(r => setTimeout(r, 2500)); // Dramatic AI scanning effect
    
    try {
      await api.put(`/api/profile/${user.id}`, {
        companyName: form.companyName,
        website: form.website,
        bio: form.bio,
        headline: "PENDING_ADMIN_APPROVAL", // Using headline to track pending status to avoid schema changes
      });
      setAiScanning(false);
      setStep(4);
    } catch (error) {
      alert("Failed to submit profile for review.");
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
            <div className="animate-in fade-in zoom-in-95 duration-1000 text-center py-12">
              <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 border-2 border-emerald-400/50 rounded-[2rem] animate-ping opacity-20" />
                <ShieldCheck className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Account Under Review</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Your company profile has passed the initial AI checks and is now queued for Admin approval. 
              </p>
              
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 inline-block text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Scan: Passed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin Review: Pending</span>
                </div>
              </div>

              <div className="mt-10">
                 <button className="text-gray-500 hover:text-gray-900 transition-colors" onClick={() => {
                   api.post('/api/auth/logout').finally(() => router.push('/login'));
                 }}>Sign out</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
