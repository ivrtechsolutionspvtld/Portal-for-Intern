'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IVRLogo from '@/components/IVRLogo';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Share2,
  ExternalLink,
  Printer,
  ShieldCheck,
  QrCode,
  Sparkles,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

interface Criteria {
  label: string;
  met: boolean;
  currentValue: string;
  requiredValue: string;
}

interface CertificateData {
  certificate: {
    id: string;
    certificateNumber: string;
    grade: string;
    issueDate: string;
    qrCodeDataUrl?: string | null;
    status: string;
  } | null;
  hasCertificate: boolean;
  eligibility: {
    isEligible: boolean;
    criteria: Criteria[];
  };
  studentName: string;
  domain: string;
  batchName: string;
}

export default function StudentCertificatePage() {
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCert() {
      try {
        setLoading(true);
        const res = await fetch('/api/student/certificate');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, []);

  const handleCopyLink = () => {
    if (!data?.certificate?.certificateNumber) return;
    const url = `${window.location.origin}/verify/${data.certificate.certificateNumber}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const cert = data?.certificate;

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Certificate of Industrial Excellence
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cryptographically verified credential with permanent public verification ledger.
            </p>
          </div>
          {cert && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="text-xs">
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Link Copied!' : 'Copy Verification URL'}
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint} className="text-xs">
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print / Export PDF
              </Button>
            </div>
          )}
        </div>

        {/* Eligibility Verification Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                Institutional Graduation & Certification Criteria
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All 3 institutional standards must be satisfied before the digital credential is notarized.
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                data?.eligibility.isEligible
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {data?.eligibility.isEligible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Graduation Criteria Satisfied
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Requirements in Progress
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data?.eligibility.criteria.map((c, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border transition-all ${
                  c.met
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800">{c.label}</span>
                  {c.met ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-baseline justify-between text-xs mt-2">
                  <span className="text-slate-500">Current Status:</span>
                  <span className={`font-bold ${c.met ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {c.currentValue}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>Requirement:</span>
                  <span>{c.requiredValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Display Area */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Checking academic credential ledger...
          </div>
        ) : cert ? (
          <div className="space-y-4">
            {/* The Certificate Canvas */}
            <div
              id="printable-certificate"
              className="relative bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border-12 border-[#3B0764] shadow-2xl overflow-hidden max-w-4xl mx-auto"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(243, 232, 255, 0.4) 0%, rgba(255, 255, 255, 1) 70%)',
              }}
            >
              {/* Inner Decorative Border */}
              <div className="absolute inset-3 border-2 border-[#7C3AED]/40 rounded-2xl pointer-events-none" />
              <div className="absolute inset-5 border border-dashed border-[#DDD6FE] rounded-xl pointer-events-none" />

              {/* Watermark Crest */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Award className="w-96 h-96 text-[#3B0764]" />
              </div>

              {/* Certificate Header */}
              <div className="relative text-center space-y-3 z-10">
                <div className="flex justify-center mb-2">
                  <IVRLogo size="lg" />
                </div>
                <div className="text-[11px] tracking-[0.25em] font-extrabold uppercase text-[#7C3AED]">
                  IVR TECH SOLUTIONS PRIVATE LIMITED
                </div>
                <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
                  Certificate of Industrial Excellence
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent mx-auto mt-2" />
              </div>

              {/* Certificate Body */}
              <div className="relative text-center my-8 space-y-4 z-10">
                <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-widest">
                  This is proudly presented to
                </p>
                <div className="text-3xl sm:text-5xl font-serif font-bold text-[#3B0764] tracking-tight">
                  {data?.studentName}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed pt-2">
                  for outstanding completion of the intensive enterprise-grade internship program in
                </p>
                <div className="inline-block bg-purple-50 border border-purple-200 px-6 py-2 rounded-xl">
                  <span className="text-sm sm:text-base font-bold text-[#5B21B6] tracking-wide">
                    {data?.domain}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-xl mx-auto">
                  Having satisfied all rigorous industry milestones, live architecture deployments, code audits,
                  and faculty evaluations with honors.
                </p>
              </div>

              {/* Badge & Performance Details */}
              <div className="relative flex flex-wrap items-center justify-center gap-4 py-4 z-10">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Performance Grade</span>
                  <span className="text-sm font-black text-[#6D28D9]">{cert.grade}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch</span>
                  <span className="text-xs font-bold text-slate-700">{data?.batchName}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                  <span className="text-xs font-bold text-slate-700">
                    {new Date(cert.issueDate).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Signatures & QR Code Section */}
              <div className="relative mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">
                {/* Signatory 1 */}
                <div className="text-center sm:text-left">
                  <div className="font-serif italic font-bold text-slate-800 text-base">
                    I.V. Gowtham Kumar Reddy
                  </div>
                  <div className="w-40 h-0.5 bg-slate-300 mx-auto sm:mx-0 my-1" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Chief Academic Director
                  </span>
                  <span className="text-[9px] text-slate-400">IVR TECH SOLUTIONS PRIVATE LIMITED</span>
                </div>

                {/* QR Verification Seal */}
                <div className="text-center flex flex-col items-center">
                  {cert.qrCodeDataUrl ? (
                    <img
                      src={cert.qrCodeDataUrl}
                      alt="Verification QR Code"
                      className="w-20 h-20 p-1 bg-white border border-slate-300 rounded-lg shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                      <QrCode className="w-10 h-10" />
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">
                    {cert.certificateNumber}
                  </span>
                  <span className="text-[8px] text-slate-400">Scan to Verify Authenticity</span>
                </div>

                {/* Signatory 2 */}
                <div className="text-center sm:text-right">
                  <div className="font-serif italic font-bold text-slate-800 text-base">
                    Shaik Asif
                  </div>
                  <div className="w-40 h-0.5 bg-slate-300 mx-auto sm:ml-auto my-1" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    VP of Enterprise Engineering
                  </span>
                  <span className="text-[9px] text-slate-400">IVR TECH SOLUTIONS PRIVATE LIMITED</span>
                </div>
              </div>
            </div>

            {/* Public Ledger Verification Banner */}
            <div className="bg-purple-50 rounded-2xl p-4 sm:p-5 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4C1D95] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Cryptographic Public Ledger Status: Notarized
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Recruiters and corporate partners can verify this certificate at any time via the public verification portal.
                  </p>
                </div>
              </div>
              <a
                href={`/verify/${cert.certificateNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ivr-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <span>Open Public Ledger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Certificate Pending Release</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your official Certificate of Industrial Excellence will be cryptographically issued and released to this portal once your attendance meets 80%, all milestone submissions are approved by your mentor, and fees are settled.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
