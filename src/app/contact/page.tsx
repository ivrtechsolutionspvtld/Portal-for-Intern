'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { COMPANY_INFO } from '@/lib/constants';
import { Mail, Phone, MapPin, Globe, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message.');
      }
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Connect With Admissions
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Contact {COMPANY_INFO.name}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have questions regarding fellowship cohorts, university MoUs, or fee arrangements? Our admissions team is ready to assist.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Remote Operations & Contact Info */}
            <div className="space-y-6">
              <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#6D28D9]" />
                  100% Remote-First Operations
                </h3>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p className="font-semibold text-slate-900">Virtual Fellowship & Digital Cohorts</p>
                  <p>Pan-India remote internship operations with live interactive code walkthroughs, cloud sandbox deployments, and direct mentor channels.</p>
                </div>
              </div>

              <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5B21B6] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Admissions & Support</span>
                    <a href={`mailto:${COMPANY_INFO.admissionsEmail}`} className="font-bold text-slate-800 hover:text-[#6D28D9]">
                      {COMPANY_INFO.admissionsEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs pt-2 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5B21B6] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Direct Mobile Helpline</span>
                    <a href="tel:+918143177907" className="font-bold text-slate-800 hover:text-[#6D28D9]">
                      +91 8143177907
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-2">
              <div className="ivr-card p-8 bg-white border border-slate-200 rounded-2xl">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Send an Official Inquiry</h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Inquiries are logged into our enterprise CRM and triaged to the appropriate academic or technical advisor.
                </p>

                {success ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900">Message Received</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting {COMPANY_INFO.name}. A member of our admissions committee will reach out to <strong>{formData.email}</strong> within 24 business hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                          placeholder="e.g. Ananya Deshmukh"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                          placeholder="e.g. ananya@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Subject</label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none bg-white font-medium"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Internship Cohort Details">Internship Cohort Details</option>
                          <option value="University MoU / Bulk Enrollment">University MoU / Bulk Enrollment</option>
                          <option value="Fees & Payment Clarification">Fees & Payment Clarification</option>
                          <option value="Certificate Verification Assistance">Certificate Verification Assistance</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                        placeholder="Please describe your query in detail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-ivr-primary px-6 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Inquiry
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
