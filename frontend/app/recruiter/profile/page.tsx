'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Globe, MapPin, PenSquare } from 'lucide-react';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

type RecruiterProfile = {
  companyName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  companyLogo?: string;
  skills?: string[];
};

export default function RecruiterProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'recruiter') {
        router.push('/candidate/dashboard');
        return;
      }
      const result = await api.get(`/api/profile/${user.id}`);
      const nextProfile = result.profile ?? result;
      setProfile(nextProfile);
      if (!nextProfile?.companyName && !nextProfile?.headline) {
        router.push('/recruiter/profile/edit');
      }
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      router.push('/recruiter/profile/edit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <main className="r-main"><div className="text-sm text-[var(--t2)]">Loading company profile...</div></main>;
  }

  if (!profile) return null;

  return (
    <main className="r-main">
      <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--s2)]">
              {profile.companyLogo ? (
                <img src={profile.companyLogo} alt="Company logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-[var(--t3)]" />
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--t3)]">Company Profile</div>
              <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--t1)]">
                {profile.companyName || user?.name || 'Your Company'}
              </h1>
              <p className="mt-2 text-sm text-[var(--t2)]">{profile.headline || 'Add your company positioning and employer value proposition.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/recruiter/profile/edit')}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs font-medium text-[var(--t2)] hover:text-[var(--t1)]"
          >
            <PenSquare className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--t3)]">Company Story</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--t2)]">
            {profile.bio || 'No company story added yet. Add one in edit mode to improve candidate trust and application quality.'}
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--t3)]">Core Stack & Hiring Themes</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
              <span key={skill} className="rounded-full border border-[var(--border)] bg-[var(--s2)] px-2.5 py-1 text-xs text-[var(--t2)]">
                {skill}
              </span>
            ))}
            {(profile.skills || []).length === 0 && (
              <span className="text-xs text-[var(--t3)]">No stack tags yet.</span>
            )}
          </div>
        </div>

        <aside className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--t3)]">Public Details</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Location</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-[var(--t2)]">
                <MapPin className="h-4 w-4" />
                <span>{profile.location || 'Not specified'}</span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--s2)] p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--t3)]">Website</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-[var(--t2)]">
                <Globe className="h-4 w-4" />
                {profile.website ? (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <span>Not specified</span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
