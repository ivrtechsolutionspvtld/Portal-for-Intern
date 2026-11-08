'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import IVRLogo from '@/components/IVRLogo';
import Badge from '@/components/ui/Badge';
import { ShieldCheck, AlertTriangle, XCircle, Award, CheckCircle2, Calendar, FileText, ArrowLeft, Printer } from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certNumber = params?.certNumber as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    valid: boolean;
    status: 'VALID' | 'REVOKED' | 'NOT_FOUND';
    message?: string;
    certificate?: {
      certificateNumber: string;
      studentName: string;
      domain: string;
      issueDate: string;
      completionDate: string;
      issuedBy: string;
      templateName: string;
      batchName: string;
      qrCodeData: string;
      verificationUrl: string;
    };
  } | null>(null);

  useEffect(() => {
    async function verify() {
      if (!certNumber) return;
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(certNumber)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [certNumber]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Portal
          </Link>

          {data?.status === 'VALID' && (
            <button
              onClick={() => window.print()}
              className="text-xs font-semibold text-[#6D28D9] hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Verification Record
            </button>
          )}
        </div>

        {loading ? (
          <div className="ivr-card p-12 bg-white rounded-2xl text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Verifying digital certificate authenticity...</p>
          </div>
        ) : !data || data.status === 'NOT_FOUND' ? (
          <div className="ivr-card p-10 bg-white rounded-2xl text-center space-y-5 border-l-4 border-l-rose-500">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Certificate Not Found</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                The identifier <code className="font-mono font-bold text-rose-600">{certNumber}</code> could not be located in the IVR Enterprise Academic Registry. Please ensure the certificate ID was entered accurately.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/contact" className="btn-ivr-primary text-xs font-bold px-6 py-2.5 rounded-lg">
                Contact Academic Verification Office
              </Link>
            </div>
          </div>
        ) : data.status === 'REVOKED' ? (
          <div className="ivr-card p-10 bg-white rounded-2xl text-center space-y-5 border-l-4 border-l-amber-500">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <Badge variant="danger" className="mb-2">OFFICIALLY REVOKED</Badge>
              <h2 className="text-2xl font-black text-slate-900">Certificate Revocation Notice</h2>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Certificate identifier <code className="font-mono font-bold">{certNumber}</code> was revoked by order of the IVR Academic Governance Board. This certificate is no longer valid.
              </p>
            </div>
          </div>
        ) : (
          /* Official Verified Certificate Card */
          <div className="ivr-card p-8 sm:p-12 bg-white rounded-2xl border-2 border-[#5B21B6]/30 shadow-xl relative overflow-hidden">
            {/* Top Security Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">Official Authenticity Verified</h2>
                    <Badge variant="success">LEGITIMATE CREDENTIAL</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Verified through IVR TECH SOLUTIONS Academic Registry (ap-south-1)</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Certificate Number</span>
                <span className="font-mono font-black text-sm text-[#4C1D95]">
                  {data.certificate?.certificateNumber}
                </span>
              </div>
            </div>

            {/* Certificate Details Body */}
            <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Certified Fellow
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {data.certificate?.studentName}
                  </h3>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Internship Specialization Track
                  </span>
                  <p className="text-base font-bold text-[#5B21B6]">
                    {data.certificate?.domain}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cohort: {data.certificate?.batchName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Completion Date</span>
                    <span className="font-bold text-slate-800">
                      {new Date(data.certificate?.completionDate || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Issuance Date</span>
                    <span className="font-bold text-slate-800">
                      {new Date(data.certificate?.issueDate || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block font-semibold mb-0.5">Authorized Issuing Authority</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {data.certificate?.issuedBy}
                  </span>
                </div>
              </div>

              {/* QR Verification Visual Seal */}
              <div className="flex flex-col items-center justify-center p-6 bg-purple-50/50 rounded-2xl border border-purple-100 text-center">
                {data.certificate?.qrCodeData && (
                  <img
                    src={data.certificate.qrCodeData}
                    alt="Certificate QR Verification Code"
                    className="w-40 h-40 rounded-lg shadow-xs border border-white bg-white p-2 mb-3"
                  />
                )}
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Scan to Verify
                </span>
                <span className="text-[11px] font-bold text-[#5B21B6] mt-0.5">
                  IVR Cryptographic Seal
                </span>
              </div>
            </div>

            {/* Legal Footnote */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>IVR TECH SOLUTIONS PRIVATE LIMITED</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid Academic Credential
              </span>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
