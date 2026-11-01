'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { DOMAINS, COMPANY_INFO, APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Award,
  Layers,
  Terminal,
  ExternalLink,
  Code2,
  FileCheck2,
  UsersRound,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5FF] via-[#F8FAFC] to-white pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-purple-100">
        <div className="absolute inset-0 bg-[radial-gradient(#C4B5FD_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Official Company Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/90 text-[#5B21B6] text-xs font-bold mb-6 border border-purple-200 shadow-2xs">
            <span>{COMPANY_INFO.tagline}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.08]">
            Accelerating India's Premier{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#7C3AED]">
              Engineering Talent.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {COMPANY_INFO.name} bridges collegiate technology education and modern industry standards. Immersive cohorts featuring dedicated mentorship, hands-on production code, and verifiable credentials.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto btn-ivr-primary text-sm font-bold px-7 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
            >
              Apply for Internship
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/programs"
              className="w-full sm:w-auto btn-ivr-secondary text-sm font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2"
            >
              Explore 8 Domains
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-xs font-semibold px-5 py-3.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Program Domains Showcase */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-2">
              Industry-Aligned Curricula
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Specialized Engineering Domains
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Each track is architected around current tech industry specifications, from full-stack web applications to cloud computing and AI/ML.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DOMAINS.map((domain) => (
              <div
                key={domain.id}
                className="ivr-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-purple-50 text-[#5B21B6] border border-purple-100">
                      {domain.duration}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{domain.level}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {domain.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {domain.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {domain.techStack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={APPLICATION_GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#6D28D9] hover:text-[#4C1D95] flex items-center justify-between pt-3 border-t border-slate-100 group"
                >
                  <span>Apply for this track</span>
                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#5B21B6] hover:underline"
            >
              View Detailed Syllabi & Milestone Deliverables &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Architecture Pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-2">
                Program Highlights
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Practical Learning. <br />
                Real Technical Competence.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                We bridge academic learning with authentic software development environments. Fellows engage with modern version control workflows, architectural reviews, and production-ready deployments.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dedicated Mentorship Guidance</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Structured code reviews, technical critiques, and career orientation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dynamic Attendance Validation</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Encrypted, rolling QR attendance sessions ensuring authenticated student presence.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Verifiable Digital Certificates</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official credentials with verifiable IDs and digital authentication seals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3B0764] to-[#5B21B6] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="text-xs font-semibold uppercase tracking-wider text-purple-200 mb-2">
                Governance & Data Protection
              </div>
              <h3 className="text-2xl font-bold mb-4">DPDP Act Compliant Data Privacy</h3>
              <p className="text-xs text-purple-100 leading-relaxed mb-6">
                All records, coursework, and credentials adhere to the Indian Digital Personal Data Protection Act with encrypted storage on secure cloud infrastructure in India.
              </p>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-200">Organization:</span>
                  <span className="font-semibold">{COMPANY_INFO.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200">Official Contact:</span>
                  <span className="font-mono">{COMPANY_INFO.admissionsEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200">Delivery Model:</span>
                  <span className="font-semibold">Pan-India Virtual Workspace</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200">Compliance:</span>
                  <span className="font-semibold">DPDP Act India 2023</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-400/30 flex items-center justify-between text-xs">
                <span className="text-purple-200 font-medium">Have inquiries?</span>
                <Link
                  href="/contact"
                  className="font-bold text-white hover:underline flex items-center gap-1"
                >
                  Contact Admissions &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Educational Pillars */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-2">
              Why Choose IVR
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Educational & Technical Methodology
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="ivr-card p-6 bg-white">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center mb-4 border border-purple-100">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Production-Oriented Projects
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fellows build functional architectures rather than trivial tutorials. Every milestone requires clean repository structure, test coverage, and structured documentation.
              </p>
            </div>

            <div className="ivr-card p-6 bg-white">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center mb-4 border border-purple-100">
                <UsersRound className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Structured Mentor Evaluation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Regular review cadences provide actionable feedback on code quality, architectural decisions, and industry-standard best practices.
              </p>
            </div>

            <div className="ivr-card p-6 bg-white">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center mb-4 border border-purple-100">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Verifiable Academic Credentials
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eligible students earn credentials with unique cryptographic IDs that can be verified online by prospective employers, colleges, and academic institutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#6D28D9] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Begin Your Internship
          </h2>
          <p className="text-base sm:text-lg text-purple-200 mb-8 max-w-2xl mx-auto">
            {COMPANY_INFO.tagline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-[#4C1D95] font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              Apply Now via Official Form
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/programs"
              className="w-full sm:w-auto text-sm font-semibold px-6 py-3.5 rounded-xl text-white border border-purple-300/40 hover:bg-white/10 transition-colors"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
