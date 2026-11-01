'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import IVRLogo from '@/components/IVRLogo';
import { APPLICATION_GOOGLE_FORM_URL, COMPANY_INFO, DOMAINS } from '@/lib/constants';
import { ExternalLink, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex flex-col justify-center">
        <div className="ivr-card p-8 sm:p-12 bg-white rounded-2xl shadow-xl border border-purple-100 text-center space-y-8">
          {/* Logo & Header */}
          <div className="flex flex-col items-center">
            <IVRLogo size="lg" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-[#5B21B6] text-xs font-bold mt-6 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              Official Internship Application Channel
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Begin Your Internship Application
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
              Applications for {COMPANY_INFO.name} fellowship cohorts are submitted and processed exclusively through our official Google Form.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-[#FAF5FF] via-purple-50/50 to-white rounded-2xl border border-purple-200 max-w-xl mx-auto space-y-4">
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ivr-primary text-sm sm:text-base font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform w-full"
            >
              Open Official Google Application Form
              <ExternalLink className="w-5 h-5" />
            </a>

            <p className="text-xs text-slate-500">
              The application form opens in a secure new browser tab. Available on all mobile and desktop devices.
            </p>
          </div>

          {/* Application Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Step 1: Fill Details
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide academic background, college information, and desired domain specialization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Step 2: Track Review
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our Academic Admissions Committee reviews candidate submissions in scheduled batches.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Step 3: Portal Access
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepted fellows receive official login credentials for the internship workspace.
              </p>
            </div>
          </div>

          {/* Support Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Admissions: {COMPANY_INFO.admissionsEmail}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/programs" className="text-[#6D28D9] font-semibold hover:underline">
                View 8 Domains
              </Link>
              <Link href="/faq" className="text-[#6D28D9] font-semibold hover:underline flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
