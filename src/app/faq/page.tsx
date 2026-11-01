'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'Program' | 'Attendance' | 'Fees' | 'Certification' | 'Technical';
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'Program',
      question: 'Who is eligible to participate in the internship program?',
      answer: 'Our cohorts are open to collegiate students enrolled in B.Tech / B.E., M.Tech, MCA, or relevant quantitative degrees (pre-final or final year students), as well as recent graduates seeking corporate software engineering capability transformation.',
    },
    {
      category: 'Program',
      question: 'What is the weekly time commitment required?',
      answer: 'Fellows are expected to dedicate approximately 8 to 12 hours per week, consisting of 2–3 hours of live interactive mentoring/architectural syncs and 6–9 hours of asynchronous capstone project engineering and LMS study.',
    },
    {
      category: 'Attendance',
      question: 'How is attendance tracked during live sessions?',
      answer: 'IVR TECH SOLUTIONS uses a dynamic, time-limited cryptographic QR attendance system. During the session, the mentor generates an authenticated QR code valid for 15 minutes. Students scan this code from their student portal to record validated attendance. Duplicate scans are automatically prevented.',
    },
    {
      category: 'Attendance',
      question: 'What happens if I miss a live cohort session?',
      answer: 'A minimum of 80% attendance is strictly enforced for certificate eligibility. If an unavoidable academic examination or medical circumstance arises, students can request an excused absence through their mentor before the session.',
    },
    {
      category: 'Fees',
      question: 'Are there any registration or program fees?',
      answer: 'A nominal registration fee (₹499) is assessed upon admissions approval to confirm seat allocation, followed by the subsidized program fee (₹4,999) covering cloud infrastructure sandboxes, 1-on-1 mentor evaluations, and certification. Merit-based waivers are available for high CGPA applicants.',
    },
    {
      category: 'Fees',
      question: 'Which payment methods are accepted?',
      answer: 'All payments are processed securely through Razorpay, supporting UPI (Google Pay, PhonePe, Paytm), NetBanking across all major Indian banks, and Visa/Mastercard/RuPay debit and credit cards with instant automated receipts.',
    },
    {
      category: 'Certification',
      question: 'How are certificates verified by prospective employers?',
      answer: 'Every graduate certificate includes an immutable, unique certificate ID (e.g., IVR-CERT-2026-89412) and a cryptographic QR code linking directly to our public verification portal (/verify/{id}). Employers can instantly confirm graduation date, domain, and issuing authority without contacting registrars.',
    },
    {
      category: 'Technical',
      question: 'What hardware and software tools are needed?',
      answer: 'Fellows need a personal laptop (macOS, Windows, or Linux) with at least 8GB RAM, stable broadband internet, Node.js v20+, Git, and a modern code editor such as VS Code. All AWS cloud resources are provisioned in the ap-south-1 (Mumbai) region.',
    },
  ];

  const categories = ['All', 'Program', 'Attendance', 'Fees', 'Certification', 'Technical'];

  const filteredFaqs =
    activeCategory === 'All'
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Frequently Asked Questions
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Got Questions? We Have Answers.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Everything you need to know about admissions, dynamic QR attendance, mentorship cadence, and certificate authenticity.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#6D28D9]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
