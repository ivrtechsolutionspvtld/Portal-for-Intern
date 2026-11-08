'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IVRLogo from '@/components/IVRLogo';
import { APPLICATION_GOOGLE_FORM_URL, COMPANY_INFO } from '@/lib/constants';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck, KeyRound, ExternalLink } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      } else {
        router.push(data.redirectUrl || '/admin');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectAdminPreset = () => {
    setEmail('admin@ivrtechsolution.in');
    setPassword('Admin@IVR2026!');
  };

  const selectDemoStudentPreset = () => {
    setEmail('rahul.demo@ivrtechsolution.in');
    setPassword('StudentDemo@2026!');
  };

  const selectDemoMentorPreset = () => {
    setEmail('arjun.demo@ivrtechsolution.in');
    setPassword('MentorDemo@2026!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#3B0764] to-[#4C1D95] flex flex-col justify-between p-4 sm:p-8 text-slate-100 antialiased">
      {/* Top Branding Bar */}
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <IVRLogo size="md" white />
        <Link
          href="/"
          className="text-xs text-purple-200 hover:text-white transition-colors flex items-center gap-1 font-semibold"
        >
          &larr; Back to Public Website
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-slate-800 border border-purple-200/40">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5B21B6] flex items-center justify-center mx-auto mb-3 border border-purple-100">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Authorized access to {COMPANY_INFO.name}
            </p>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@ivrtechsolution.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-ivr-primary py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating Session...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fast-Fill Credentials for Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Evaluation & Demo Access:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAdminPreset}
                className="text-[11px] px-2.5 py-1 bg-purple-50 text-[#5B21B6] hover:bg-purple-100 rounded-md font-semibold border border-purple-200 transition-colors"
              >
                Fill Admin
              </button>
              <button
                type="button"
                onClick={selectDemoStudentPreset}
                className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md font-semibold border border-emerald-200 transition-colors"
              >
                Fill Demo Student (Rahul)
              </button>
              <button
                type="button"
                onClick={selectDemoMentorPreset}
                className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-md font-semibold border border-blue-200 transition-colors"
              >
                Fill Demo Mentor (Arjun)
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs">
            <span className="text-slate-500">Need an account? </span>
            <Link
              href="/register"
              className="font-bold text-[#6D28D9] hover:underline"
            >
              Register for Student or Mentor Access &rarr;
            </Link>
          </div>

          <div className="mt-3 text-center text-[11px] text-slate-400">
            Admissions via Google Form:{' '}
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#6D28D9] hover:underline inline-flex items-center gap-0.5"
            >
              Open Form
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Compliance Disclaimer */}
      <div className="text-center text-xs text-purple-200/60 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>End-to-End Encrypted Session • Indian DPDP Act Compliant</span>
      </div>
    </div>
  );
}
