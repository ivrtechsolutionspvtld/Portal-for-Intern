'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IVRLogo from '@/components/IVRLogo';
import { APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import { Menu, X, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Programs', href: '/programs' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full ivr-glass-nav shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <IVRLogo size="md" />

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-150 relative py-1 ${
                  isActive ? 'text-[#6D28D9]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6D28D9] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={APPLICATION_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-4 py-2.5 rounded-lg transition-all border border-[#C4B5FD]/60 flex items-center gap-1.5 shadow-2xs hover:scale-[1.02]"
          >
            Apply Now
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <Link
            href="/login"
            className="btn-ivr-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            Login
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/login"
            className="btn-ivr-primary text-xs font-semibold px-3 py-1.5 rounded-lg sm:hidden"
          >
            Login
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#6D28D9] hover:bg-purple-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={APPLICATION_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#EDE9FE] text-[#5B21B6] font-semibold text-sm flex items-center justify-center gap-1.5"
            >
              Apply for Internship
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg btn-ivr-primary text-sm font-semibold"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
