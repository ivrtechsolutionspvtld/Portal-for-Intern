import React from 'react';
import Link from 'next/link';
import IVRLogo from '@/components/IVRLogo';
import { ShieldCheck, Mail, Phone, Globe } from 'lucide-react';
import { COMPANY_INFO, DOMAINS } from '@/lib/constants';

export default function PublicFooter() {
  return (
    <footer className="bg-[#1E1B4B] text-slate-300 pt-16 pb-12 border-t border-[#312E81]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#312E81]/80">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <IVRLogo size="lg" white />
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed mt-3">
              {COMPANY_INFO.name} delivers premier industry-immersed internship programs, technical mentorship, and high-performance talent development.
            </p>
            <div className="pt-2 text-xs text-purple-200/80 space-y-1">
              <div>Technology Internship & Skill Development Platform</div>
              <div className="text-purple-300/60">Digital Personal Data Protection (DPDP) Act Compliant</div>
            </div>
          </div>

          {/* Internship Domains */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Featured Domains
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {DOMAINS.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link href="/programs" className="hover:text-purple-300 transition-colors">
                    {d.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/programs" className="text-[#C4B5FD] font-semibold hover:underline inline-flex items-center gap-1">
                  View All 8 Domains &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Process */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Company & Process
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link href="/about" className="hover:text-purple-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-purple-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-purple-300 transition-colors">
                  Internship Application
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-300 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-purple-300 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/privacy-terms" className="hover:text-purple-300 transition-colors">
                  DPDP Privacy Notice & Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Remote Operations & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Official Contact
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-[#C4B5FD] shrink-0 mt-0.5" />
                <span>
                  <strong>Remote-First Operations:</strong><br />
                  Pan-India Virtual Workspace & Digital Cohorts
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-slate-200">
                <Mail className="w-4 h-4 text-[#C4B5FD] shrink-0" />
                <a href={`mailto:${COMPANY_INFO.admissionsEmail}`} className="hover:underline font-medium">
                  {COMPANY_INFO.admissionsEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Phone className="w-4 h-4 text-[#C4B5FD] shrink-0" />
                <a href="tel:+918143177907" className="hover:underline font-semibold">
                  +91 8143177907
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>&copy; 2026 {COMPANY_INFO.name}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy-terms" className="hover:text-white transition-colors">
              Privacy Policy (DPDP Act)
            </Link>
            <Link href="/privacy-terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
