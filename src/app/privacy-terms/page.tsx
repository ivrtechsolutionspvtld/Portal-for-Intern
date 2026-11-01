import React from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/constants';

export default function PrivacyTermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Legal & Compliance
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Privacy Policy & Terms of Service
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-slate-500 font-mono">
            Compliant with the Digital Personal Data Protection (DPDP) Act, 2023 & Indian IT Rules • Last Updated: October 2026
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="ivr-card p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl space-y-8 text-slate-700 leading-relaxed text-sm">
            {/* DPDP Compliance Notice Banner */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#6D28D9] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-[#4C1D95] block mb-0.5">
                  Digital Personal Data Protection (DPDP) Act Notice
                </span>
                {COMPANY_INFO.name} processes student, mentor, and applicant personal data solely for legitimate purposes of academic evaluation, attendance tracking, certification, and corporate verification. Data is stored within the territory of India on AWS Mumbai (ap-south-1).
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Scope and Applicability</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                This Privacy Notice applies to all digital platforms, portals, application forms, and web interfaces operated by {COMPANY_INFO.name} ({COMPANY_INFO.cin}). It governs the collection, processing, storage, and erasure of personal data provided by collegiate fellows, faculty mentors, and public applicants.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Categories of Personal Data Collected</h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-3">
                We collect only minimal and necessary information required to deliver the internship fellowship:
              </p>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                <li><strong>Identity Information:</strong> Full name, university email, contact phone number, and collegiate enrollment department.</li>
                <li><strong>Academic Performance Records:</strong> Capstone project repositories, commit histories, rubric grades, and dynamic QR attendance records.</li>
                <li><strong>Payment Transaction Metadata:</strong> Order identifiers, receipt numbers, and Razorpay transaction references (we never store card numbers or CVVs).</li>
                <li><strong>Audit & Security Telemetry:</strong> Login timestamps, IP addresses, and authorization events to prevent unauthorized credential sharing.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Principal Rights Under the DPDP Act</h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">
                As a Data Principal, you are entitled to exercise the following statutory rights under the DPDP Act:
              </p>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                <li><strong>Right of Access & Summary:</strong> Request an itemized export of all personal information and progress records held in your profile.</li>
                <li><strong>Right of Correction:</strong> Update inaccurate contact details or academic references via your student portal or by contacting admissions.</li>
                <li><strong>Right of Grievance Redressal:</strong> Submit inquiries or concerns to our designated Grievance Officer at <code>admin@ivrtechsolution.in</code>.</li>
                <li><strong>Right of Erasure:</strong> Following completion of the statutory 3-year recordkeeping period for accredited credentials, request deletion of non-essential profile data.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Certificate Verification and Public Disclosures</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                To enable legitimate verification by prospective employers and universities, our public verification endpoint (<code>/verify/[id]</code>) displays only the minimum necessary information: recipient student name, internship domain, completion date, and issuance status. Personal contact details, phone numbers, and internal grades are never exposed to public crawlers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Fellowship Code of Conduct & Honor System</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Fellows agree to maintain the highest standard of academic integrity. Plagiarism, automated attendance evasion, sharing time-limited QR codes with non-attendees, or reverse-engineering proprietary coursework modules constitutes cause for immediate account deactivation and certificate revocation without refund.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{COMPANY_INFO.name}</span>
              <span>ISO 27001 Certified Security</span>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
