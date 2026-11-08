'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  UserCheck,
  Mail,
  Phone,
  Building2,
  Award,
  Briefcase,
  Users,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function MentorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            ...data.user,
            ...data.user.mentorProfile,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  return (
    <DashboardLayout role="MENTOR">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Mentor Profile</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Verified Faculty Credentials
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Professional specialization, institutional employee identification, and active cohort allocations.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading mentor profile...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Card */}
            <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-xs">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white text-3xl font-black flex items-center justify-center mx-auto shadow-md">
                {profile?.name?.charAt(0) || 'M'}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
                <span className="text-xs text-[#6D28D9] font-semibold block">{profile?.designation}</span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{profile?.email}</span>
                {profile?.isDemo && (
                  <span className="mt-2 inline-block text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    DEMO MENTOR
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1 text-left">
                <p>Mentor ID: <strong className="font-mono text-slate-800">{profile?.mentorId || 'IVR-DEMO-MEN-001'}</strong></p>
                <p>Employee ID: <strong className="font-mono text-slate-800">{profile?.employeeId || 'IVR-DEMO-EMP-001'}</strong></p>
                <p>Department: <strong className="text-slate-800">{profile?.department}</strong></p>
                <p>Experience: <strong className="text-slate-800">{profile?.experience || '3 Years'}</strong></p>
              </div>
            </div>

            {/* Right Card Details */}
            <div className="ivr-card p-6 sm:p-8 bg-white border border-slate-200 rounded-xl md:col-span-2 space-y-6 shadow-xs">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-3">
                  Professional Specialization & Program Scope
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Track</span>
                    <span className="font-bold text-slate-900">{profile?.assignedProgram || 'Full-Stack Web Development'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Student Capacity</span>
                    <span className="font-bold text-slate-900">{profile?.maxStudents || 30} Fellow Seats Max</span>
                  </div>

                  <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Area of Expertise</span>
                    <span className="text-slate-800 font-medium">{profile?.expertise}</span>
                  </div>

                  {profile?.bio && (
                    <div className="sm:col-span-2 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Professional Bio</span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
                <ShieldCheck className="w-5 h-5 text-[#6D28D9] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#4C1D95] block mb-0.5">Authorized Faculty Permissions</span>
                  As an accredited faculty mentor, you hold authorized privileges to create dynamic cryptographic QR attendance
                  sessions for assigned cohorts, review and score student deliverables, and submit evaluations to the Academic Board.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

