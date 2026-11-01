'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { DOMAINS, APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import { Clock, Layers, ArrowRight, CheckCircle2, Award, Terminal, ExternalLink } from 'lucide-react';

export default function ProgramsPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const filteredDomains =
    selectedDomain === 'all'
      ? DOMAINS
      : DOMAINS.filter((d) => d.id === selectedDomain);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Comprehensive Curricula
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Specialized Internship Programs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Engineered around the modern enterprise software stack. Fellows acquire hands-on mastery through real architectural deliveries, not passive tutorials.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                selectedDomain === 'all'
                  ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Domains (8)
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  selectedDomain === d.id
                    ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Domain Catalog */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {filteredDomains.map((domain, index) => (
            <div
              key={domain.id}
              className="ivr-card p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-md bg-purple-50 text-[#5B21B6] border border-purple-200">
                    {domain.duration}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {domain.level}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Track #{index + 1}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {domain.name}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {domain.description}
                </p>

                {/* Tech Stack Badges */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Core Technologies & Frameworks
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {domain.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-purple-50/60 text-[#4C1D95] border border-purple-100"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Milestone Projects */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Production Capstone Deliverables
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                    {domain.projects.map((proj, pIdx) => (
                      <div
                        key={proj}
                        className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{proj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Action Box */}
              <div className="bg-gradient-to-br from-[#FAF5FF] to-white p-6 rounded-xl border border-purple-100 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#7C3AED]" />
                    Fellowship Prerequisites
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>• Basic proficiency in core programming concepts.</li>
                    <li>• Enrolled in or graduated from recognized university.</li>
                    <li>• Minimum 8–10 hours per week commitment.</li>
                    <li>• Personal laptop meeting standard dev requirements.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-purple-100">
                  <a
                    href={APPLICATION_GOOGLE_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-ivr-primary text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm text-center"
                  >
                    Apply for this Domain
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
