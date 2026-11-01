import React from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { COMPANY_INFO, APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import { Target, Compass, Award, ShieldCheck, Users, Building, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-24 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            About {COMPANY_INFO.name}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {COMPANY_INFO.tagline}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {COMPANY_INFO.name} was established with a singular mission: to eliminate the gap between collegiate academia and industry technology excellence through immersive, hands-on internships.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="ivr-card p-8 border-l-4 border-l-[#4C1D95]">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5B21B6] flex items-center justify-center mb-5 border border-purple-100">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                To transform collegiate students into proficient software practitioners through rigorous, practical internships, structured mentor feedback, and mastery of modern software toolchains.
              </p>
            </div>

            <div className="ivr-card p-8 border-l-4 border-l-[#7C3AED]">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-5 border border-purple-100">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                To serve as a premier workforce skill-building accelerator, equipping fellows with the practical competence, architectural clarity, and professional discipline required for enduring engineering careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-2">
              Our Foundations
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Core Principles
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="ivr-card p-6 bg-white">
              <Award className="w-8 h-8 text-[#6D28D9] mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-2">Practical Rigor</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hands-on execution with production toolchains, relational databases, and clean code principles.
              </p>
            </div>

            <div className="ivr-card p-6 bg-white">
              <ShieldCheck className="w-8 h-8 text-[#6D28D9] mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-2">Security & Privacy</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full compliance with the Indian Digital Personal Data Protection (DPDP) Act and industry data safeguards.
              </p>
            </div>

            <div className="ivr-card p-6 bg-white">
              <Users className="w-8 h-8 text-[#6D28D9] mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-2">Dedicated Mentorship</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Structured guidance ensuring every fellow receives actionable critiques and milestone reviews.
              </p>
            </div>

            <div className="ivr-card p-6 bg-white">
              <Building className="w-8 h-8 text-[#6D28D9] mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-2">Industry Alignment</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Preparing candidates with the skills, repository portfolios, and problem-solving mindsets demanded by technology firms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Snapshot */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-2">
              Academic & Technology Leadership
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Leadership
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Chief Academic Director */}
            <div className="ivr-card p-8 text-center border-t-4 border-t-[#4C1D95]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white text-xl font-black flex items-center justify-center mx-auto mb-4 shadow-sm">
                IG
              </div>
              <h4 className="text-lg font-bold text-slate-900">I.V. Gowtham Kumar Reddy</h4>
              <p className="text-xs text-[#6D28D9] font-bold uppercase tracking-wider mt-1">
                Chief Academic Director
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Directs academic curriculum standards, fellowship governance, and pedagogical alignment across all internship tracks.
              </p>
            </div>

            {/* VP of Enterprise Engineering */}
            <div className="ivr-card p-8 text-center border-t-4 border-t-[#7C3AED]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white text-xl font-black flex items-center justify-center mx-auto mb-4 shadow-sm">
                SA
              </div>
              <h4 className="text-lg font-bold text-slate-900">Shaik Asif</h4>
              <p className="text-xs text-[#6D28D9] font-bold uppercase tracking-wider mt-1">
                VP of Enterprise Engineering
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Spearheads technical architecture, engineering standards, and cloud platform delivery for practical student implementations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#3B0764] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
            Begin Your Internship
          </h2>
          <p className="text-sm text-purple-200 mb-6 max-w-xl mx-auto">
            {COMPANY_INFO.tagline}
          </p>
          <a
            href={APPLICATION_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ivr-primary inline-flex items-center gap-2 text-sm font-bold px-7 py-3 rounded-xl shadow-md"
          >
            Apply for Internship
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
