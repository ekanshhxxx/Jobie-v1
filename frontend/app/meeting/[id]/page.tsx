'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, clearAuth, isApiError } from '../../lib/api';

export default function MeetingRoomPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [error, setError] = useState('');

  useEffect(() => {
    const redirectToGoogleMeet = async () => {
      try {
        const data = await api.get(`/api/meetings/${id}/join-url`);
        const meetingUrl = String(data?.meetingUrl || '').trim();
        if (!meetingUrl) {
          setError('Google Meet link is missing for this interview.');
          return;
        }
        window.location.href = meetingUrl;
      } catch (err) {
        if (isApiError(err) && err.status === 401) {
          clearAuth();
          router.push('/login');
          return;
        }
        setError(isApiError(err) ? err.message : 'Could not open Google Meet link.');
      }
    };

    if (id) {
      void redirectToGoogleMeet();
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center rounded-2xl border border-white/10 bg-white/5 p-8 text-white">
        {!error ? (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <h1 className="text-xl font-semibold">Opening Google Meet...</h1>
            <p className="mt-2 text-sm text-white/70">If this takes too long, check pop-up blockers and try again.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Unable to open Google Meet</h1>
            <p className="mt-3 text-sm text-red-300">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
