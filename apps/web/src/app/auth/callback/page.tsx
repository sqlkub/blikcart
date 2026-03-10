'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.push('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('accessToken', token);

    // Fetch user info
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user) setUser(user);
        const redirect = sessionStorage.getItem('oauth_redirect') || '/account';
        sessionStorage.removeItem('oauth_redirect');
        router.push(redirect);
      })
      .catch(() => router.push('/account'));
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#C8860A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><p>Loading…</p></div>}>
      <OAuthCallback />
    </Suspense>
  );
}
