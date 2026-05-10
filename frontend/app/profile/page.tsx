'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../lib/api';

export default function ProfileIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    router.push(`/profile/${u.id}`);
  }, [router]);

  return <div className="flex items-center justify-center h-64 text-gray-400">Loading profile...</div>;
}
