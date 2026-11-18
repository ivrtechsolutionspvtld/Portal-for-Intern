'use client';

import React from 'react';
import Link from 'next/link';
import IVRLogo from '@/components/IVRLogo';
import { COMPANY_INFO, APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import { ShieldCheck, ArrowRight, ExternalLink, UserCheck, Lock } from 'lucide-react';

export default function RegisterPage() {
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

      {/* Main Notice Card */}
      <div className="max-w-lg w-full mx-auto my-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-slate-800 border border-purple-200/40 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#5B21B6] flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-xs">
            <UserCheck className="w-7 h-7" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D28D9] px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
            Administrative Provisioning Only
          </span>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
            Account Registration Policy
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            Public self-registration for Students and Mentors has been disabled. All portal credentials are securely provisioned and assigned directly by the <strong>{COMPANY_INFO.name}</strong> Administration.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="w-full btn-ivr-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Lock className="w-4 h-4" />
              Sign In to Your Existing Account
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-ivr-secondary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              Apply for Internship via Google Form
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 text-[11px] text-slate-400">
            Need support? Contact administration at{' '}
            <span className="font-semibold text-slate-700">{COMPANY_INFO.supportEmail}</span>
          </div>
        </div>
      </div>

      {/* Bottom Compliance Disclaimer */}
      <div className="text-center text-xs text-purple-200/60 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Official {COMPANY_INFO.name} Internship Infrastructure</span>
      </div>
    </div>
  );
}
