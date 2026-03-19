'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@blikcart.nl');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const token = res.data.accessToken;
      localStorage.setItem('adminToken', token);
      // Decode role from JWT payload to route correctly
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload.accountType || '';
      router.push(role === 'manufacturer' ? '/manufacturer' : '/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
        <div className="text-center mb-8">
          <p className="font-bold text-2xl text-[#1A3C5E]">BLIKCART</p>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#1A3C5E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#112E4D] disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
