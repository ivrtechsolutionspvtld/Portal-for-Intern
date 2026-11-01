'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import Badge from '@/components/ui/Badge';
import { Search, Loader2, AlertCircle, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';

function StatusContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [refNumber, setRefNumber] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState<{
    refNumber: string;
    fullName: string;
    domain: string;
    college: string;
    status: string;
    notes?: string;
    createdAt: string;
  } | null>(null);

  const fetchStatus = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const res = await fetch(`/api/public/status/${encodeURIComponent(ref.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No application found with this reference number.');
      } else {
        setApplication(data.application);
      }
    } catch {
      setError('Network error checking status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchStatus(initialRef);
    }
  }, [initialRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(refNumber);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">APPROVED FOR COHORT</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">UNDER ADMISSIONS REVIEW</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">APPLICATION NOT ACCEPTED</Badge>;
      default:
        return <Badge variant="purple">PENDING SCREENING</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="ivr-card p-6 sm:p-10 bg-white border border-slate-200 rounded-2xl">
        <div className="mb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-1 block">
            Admissions Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Check Application Status
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Enter the unique reference number issued upon your application submission (e.g. <code>IVR-APP-2026-1042</code>).
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="e.g. IVR-APP-2026-1042"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-ivr-primary px-5 py-3 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Track Status
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Record Not Found</div>
              <div className="mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {application && (
          <div className="p-6 bg-purple-50/50 rounded-xl border border-purple-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Reference
                </span>
                <div className="font-mono text-base font-black text-[#4C1D95]">
                  {application.refNumber}
                </div>
              </div>
              <div>{getStatusBadge(application.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Candidate Name</span>
                <span className="font-bold text-slate-800">{application.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Internship Domain</span>
                <span className="font-bold text-slate-800">{application.domain}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">University / College</span>
                <span className="font-semibold text-slate-700">{application.college}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submission Date</span>
                <span className="text-slate-600">
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {application.notes && (
              <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">
                  Admissions Committee Feedback
                </span>
                <p className="text-slate-700">{application.notes}</p>
              </div>
            )}

            {application.status === 'APPROVED' && (
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full btn-ivr-primary py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  Proceed to Student Portal Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <PublicNavbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading status tracker...</div>}>
        <StatusContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
