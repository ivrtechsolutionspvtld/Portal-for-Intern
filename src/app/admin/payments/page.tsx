'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function AdminPaymentsPage() {
  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-purple-50 text-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto border border-purple-200 shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] text-xs font-bold border border-purple-200">
            <Sparkles className="w-3.5 h-3.5" />
            Institutional Policy Status
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment & Fee Processing Disabled
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            In accordance with current academic governance, all internship courses, enrollment tracks, and certifications are fully sponsored and fee-waived. Payment gateway integrations and fee transactions have been deactivated.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Active Platform Policy</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Fellowships focus on academic evaluation, mentor allocation, daily attendance tracking, capstone project reviews, and verified QR certificates.
          </p>
        </div>

        <div>
          <Link
            href="/admin"
            className="btn-ivr-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard Overview
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
