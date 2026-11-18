'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import IVRLogo from '@/components/IVRLogo';
import { APPLICATION_GOOGLE_FORM_URL, COMPANY_INFO } from '@/lib/constants';
import { ExternalLink, CheckCircle2, ShieldCheck, Sparkles, HelpCircle, FileText, Layout } from 'lucide-react';

export default function ApplyPage() {
  const [formUrl, setFormUrl] = useState<string>(APPLICATION_GOOGLE_FORM_URL);
  const [showEmbedded, setShowEmbedded] = useState<boolean>(true);

  useEffect(() => {
    async function loadFormUrl() {
      try {
        const res = await fetch('/api/public/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.googleFormsUrl) {
            setFormUrl(data.googleFormsUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load Google Form URL', err);
      }
    }
    loadFormUrl();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full space-y-8">
        <div className="ivr-card p-6 sm:p-10 bg-white rounded-2xl shadow-xl border border-purple-100 text-center space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center">
            <IVRLogo size="lg" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-[#5B21B6] text-xs font-bold mt-5 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              Official Internship Application Channel
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Begin Your Internship Application
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
              Applications for {COMPANY_INFO.name} internship cohorts are submitted and processed through our official Google Form. Complete the form below or open it in a new window.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ivr-primary text-xs sm:text-sm font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
            >
              Open Form in New Window
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setShowEmbedded(!showEmbedded)}
              className="btn-ivr-secondary text-xs sm:text-sm font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Layout className="w-4 h-4" />
              {showEmbedded ? 'Hide Embedded Form' : 'Show Embedded Form'}
            </button>
          </div>

          {/* Embedded Google Form View */}
          {showEmbedded && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200 shadow-inner">
                <iframe
                  src={formUrl}
                  width="100%"
                  height="800"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  title="Official Internship Application Form"
                  className="w-full rounded-xl bg-white shadow-xs"
                >
                  Loading Application Form...
                </iframe>
              </div>
            </div>
          )}

          {/* Application Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100">
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
                Accepted interns receive official login credentials for the internship workspace.
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
                View All Domain Tracks
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
