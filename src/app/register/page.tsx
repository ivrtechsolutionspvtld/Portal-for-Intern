'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import IVRLogo from '@/components/IVRLogo';
import { DOMAINS, COMPANY_INFO } from '@/lib/constants';
import {
  GraduationCap,
  Users,
  Lock,
  Mail,
  Phone,
  Building,
  BookOpen,
  Calendar,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState<any>(null);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
    academicYear: 'Final Year',
    graduationYear: '2026',
    regNumber: '',
    dob: '',
    address: '',
    resumeUrl: '',
    password: '',
    confirmPassword: '',
  });

  // Mentor Form State
  const [mentorForm, setMentorForm] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: 'Technical Mentor',
    department: 'Software Engineering & Cloud Architectures',
    expertise: 'Full-Stack Development, Cloud Systems',
    experience: '3 Years',
    assignedProgram: DOMAINS[0].name,
    bio: '',
    password: '',
    confirmPassword: '',
  });

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (studentForm.password !== studentForm.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'STUDENT',
          ...studentForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration submission failed.');
      } else {
        setSubmittedSuccess({
          role: 'STUDENT',
          name: studentForm.name,
          email: studentForm.email,
          id: data.id,
          message: data.message,
        });
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mentorForm.password !== mentorForm.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'MENTOR',
          ...mentorForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration submission failed.');
      } else {
        setSubmittedSuccess({
          role: 'MENTOR',
          name: mentorForm.name,
          email: mentorForm.email,
          id: data.id,
          message: data.message,
        });
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#3B0764] to-[#4C1D95] flex flex-col justify-between p-4 sm:p-8 text-slate-100 antialiased">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <IVRLogo size="md" white />
        <Link
          href="/login"
          className="text-xs text-purple-200 hover:text-white transition-colors flex items-center gap-1 font-semibold"
        >
          Already have an account? <strong>Sign In &rarr;</strong>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl w-full mx-auto my-8">
        {submittedSuccess ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 text-slate-800 border border-purple-200 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-[#5B21B6] flex items-center justify-center mx-auto border-2 border-purple-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                Status: Pending Administrator Approval
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                Registration Submitted Successfully!
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                Thank you, <strong>{submittedSuccess.name}</strong>. Your registration request has been assigned reference ID:
              </p>
              <div className="mt-3 inline-block font-mono text-base font-extrabold text-[#5B21B6] bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                {submittedSuccess.id}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-2 max-w-lg mx-auto">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6D28D9]" />
                Next Steps in the Verification Workflow:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>An IVR Tech Solutions administrator will review your application details.</li>
                <li>Upon approval, your account status will transition to <strong>ACTIVE</strong>.</li>
                <li>An official activation confirmation will be dispatched to <strong>{submittedSuccess.email}</strong>.</li>
                <li>You can then log in using your registered email and password.</li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="btn-ivr-primary px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
              >
                Go to Portal Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 text-slate-800 border border-purple-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#5B21B6] text-xs font-bold mb-2 border border-purple-100">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                Official Portal Registration
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Authorized registration for {COMPANY_INFO.name} Internship Fellowship
              </p>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setError('');
                }}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'STUDENT'
                    ? 'bg-white text-[#4C1D95] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Fellowship
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('MENTOR');
                  setError('');
                }}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'MENTOR'
                    ? 'bg-white text-[#4C1D95] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Academic Mentor
              </button>
            </div>

            {error && (
              <div className="p-3.5 mb-5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Student Registration Form */}
            {role === 'STUDENT' && (
              <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@university.edu.in"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">College / University *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Institute of Technology"
                      value={studentForm.college}
                      onChange={(e) => setStudentForm({ ...studentForm, college: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department / Branch *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science and Engineering"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Degree / Course</label>
                    <select
                      value={studentForm.degree}
                      onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      <option value="B.Tech">B.Tech / B.E.</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="Other">Other Degree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Academic Year</label>
                    <select
                      value={studentForm.academicYear}
                      onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Graduation Year</label>
                    <select
                      value={studentForm.graduationYear}
                      onChange={(e) => setStudentForm({ ...studentForm, graduationYear: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Registration / Roll No</label>
                    <input
                      type="text"
                      placeholder="e.g. 22CS0148"
                      value={studentForm.regNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date of Birth (Optional)</label>
                    <input
                      type="date"
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Residential Address (Optional)</label>
                    <input
                      type="text"
                      placeholder="City, State, PIN"
                      value={studentForm.address}
                      onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
                      <div className="text-xs text-purple-900 leading-relaxed">
                        <span className="font-bold">Administrative Course & Mentor Allocation:</span> In accordance with enterprise training policy, internship courses and dedicated mentors are assigned directly by authorized administrators upon credential evaluation.
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Resume / Portfolio Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or LinkedIn / GitHub profile"
                      value={studentForm.resumeUrl}
                      onChange={(e) => setStudentForm({ ...studentForm, resumeUrl: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Create Password (Min 8 Chars) *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={studentForm.confirmPassword}
                      onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    * Requires administrator approval before portal login
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-ivr-primary px-7 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Student Registration
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Mentor Registration Form */}
            {role === 'MENTOR' && (
              <form onSubmit={handleMentorSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Verma"
                      value={mentorForm.name}
                      onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Official / Professional Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mentor@institution.edu"
                      value={mentorForm.email}
                      onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={mentorForm.phone}
                      onChange={(e) => setMentorForm({ ...mentorForm, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Employee / Institutional ID</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-IVR-2026"
                      value={mentorForm.employeeId}
                      onChange={(e) => setMentorForm({ ...mentorForm, employeeId: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Technical Mentor / Senior Architect"
                      value={mentorForm.designation}
                      onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Development & Engineering"
                      value={mentorForm.department}
                      onChange={(e) => setMentorForm({ ...mentorForm, department: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Area of Expertise *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full-Stack Web Development, Node.js, Next.js, Cloud Architectures"
                      value={mentorForm.expertise}
                      onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Professional Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. 4 Years"
                      value={mentorForm.experience}
                      onChange={(e) => setMentorForm({ ...mentorForm, experience: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Preferred Mentorship Program Track</label>
                    <select
                      value={mentorForm.assignedProgram}
                      onChange={(e) => setMentorForm({ ...mentorForm, assignedProgram: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Password (Min 8 Chars) *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={mentorForm.password}
                      onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={mentorForm.confirmPassword}
                      onChange={(e) => setMentorForm({ ...mentorForm, confirmPassword: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    * Mentor registration is subject to administrative credential verification
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-ivr-primary px-7 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Mentor Registration
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-purple-200/60 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>End-to-End Encrypted Session • Indian DPDP Act Compliant</span>
      </div>
    </div>
  );
}

