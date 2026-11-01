import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import {
  FileText,
  UserCheck,
  Rocket,
  Users,
  Code2,
  Award,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Online Application & Track Selection',
      icon: FileText,
      description:
        'Submit the streamlined candidate application form specifying your collegiate department, year of study, resume, and preferred internship engineering domain.',
    },
    {
      number: '02',
      title: 'Admissions Screening & Background Review',
      icon: UserCheck,
      description:
        'Our Academic Admissions Committee conducts profile verification. Approved applicants are issued an official reference number and portal login credentials.',
    },
    {
      number: '03',
      title: 'Cohort Onboarding & Batch Assignment',
      icon: Rocket,
      description:
        'Fellows are enrolled into a 25–30 person dedicated cohort, introduced to their Lead Mentor, and given immediate access to curriculum learning materials.',
    },
    {
      number: '04',
      title: 'Active Mentorship & QR-Authenticated Attendance',
      icon: Users,
      description:
        'Attend weekly architectural syncs, live code reviews, and mark authenticated daily attendance through time-limited dynamic QR code scanning.',
    },
    {
      number: '05',
      title: 'Capstone Project Deliverables & Rubric Grading',
      icon: Code2,
      description:
        'Build production-grade full-stack, AI, or cloud applications. Mentors provide line-by-line code feedback, rubric grading, and revision requests.',
    },
    {
      number: '06',
      title: 'Certificate Issuance & Public QR Verification',
      icon: Award,
      description:
        'Upon achieving >= 80% attendance and passing all milestones, receive an official Certificate of Excellence featuring an immutable QR verification URL.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Structured Fellowship Journey
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How The IVR Internship Operates
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            From initial admissions screening to verifiable digital certification, explore the structured phases of the internship fellowship.
          </p>
        </div>
      </section>

      {/* Process Roadmap */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative border-l-2 border-purple-200 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative group">
                  {/* Step Dot */}
                  <div className="absolute -left-[35px] sm:-left-[51px] top-1.5 w-10 h-10 rounded-full bg-white border-2 border-[#6D28D9] text-[#6D28D9] font-black text-xs flex items-center justify-center shadow-xs">
                    {step.number}
                  </div>

                  <div className="ivr-card p-6 sm:p-8 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5B21B6] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ivr-primary text-sm font-bold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
            >
              Start Your Application Today
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
