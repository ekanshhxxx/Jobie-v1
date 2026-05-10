'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../lib/api';

export default function RecruiterOnboarding() {
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    // Legacy route shim. Keep one single onboarding flow at /recruiter-setup.
    router.replace('/recruiter-setup');
  }, [router]);

  return null;
}
