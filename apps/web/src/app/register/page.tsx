'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', accountType: 'retail', companyName: '', vatNumber: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      if (form.accountType === 'retail') {
        router.push('/login?registered=true');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-navy mb-2">Application Submitted</h2>
          <p className="text-gray-600 text-sm">Your B2B application is under review. We'll email you within 1-2 business days.</p>
          <Link href="/" className="btn-primary inline-block mt-6">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-navy mb-6 text-center">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, accountType: 'retail' }))}
              className={`p-3 rounded-lg border-2 text-sm font-semibold transition-colors ${form.accountType === 'retail' ? 'border-gold bg-gold/5 text-gold' : 'border-gray-200 text-gray-600'}`}
            >
              🛒 Retail
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, accountType: 'wholesale' }))}
              className={`p-3 rounded-lg border-2 text-sm font-semibold transition-colors ${form.accountType === 'wholesale' ? 'border-gold bg-gold/5 text-gold' : 'border-gray-200 text-gray-600'}`}
            >
              🏢 B2B Account
            </button>
          </div>

          <input
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required minLength={8}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />

          {form.accountType === 'wholesale' && (
            <>
              <input
                type="text"
                placeholder="Company name"
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                placeholder="VAT number (NL123456789B01)"
                value={form.vatNumber}
                onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold-600 disabled:opacity-60">
            {isLoading ? 'Creating...' : form.accountType === 'wholesale' ? 'Apply for B2B' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link href="/login" className="text-gold font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
