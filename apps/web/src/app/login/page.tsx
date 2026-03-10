'use client';
import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  function handleOAuth(provider: 'google' | 'apple') {
    if (redirect !== '/account') sessionStorage.setItem('oauth_redirect', redirect);
    window.location.href = `${API}/auth/${provider}`;
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Blikcart account</p>
        </div>

        {/* Social login */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-3 bg-black rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors"
          >
            <svg width="16" height="18" viewBox="0 0 814 1000" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-155.5-127.4C46 376.8 0 293.7 0 219.1c0-116.9 80.3-178.8 158.5-178.8 71.2 0 119.9 47.2 161.1 47.2 39.5 0 101.1-50.8 181.4-50.8 28.9 0 130.9 3.2 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium">or sign in with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold-600 disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-gold font-semibold hover:underline">Register</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          Wholesale buyer?{' '}
          <Link href="/wholesale" className="text-navy hover:underline">Apply here</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
