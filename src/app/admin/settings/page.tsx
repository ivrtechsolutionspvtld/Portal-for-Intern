'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [internshipDays, setInternshipDays] = useState('60');
  const [minAttendance, setMinAttendance] = useState('75');
  const [minScore, setMinScore] = useState('70');
  const [attendanceMode, setAttendanceMode] = useState('AUTOMATIC');
  const [workHoursStart, setWorkHoursStart] = useState('09:30');
  const [workHoursEnd, setWorkHoursEnd] = useState('18:30');
  const [lateGraceTime, setLateGraceTime] = useState('10:00');
  const [minSessionDuration, setMinSessionDuration] = useState('30');
  const [contactEmail, setContactEmail] = useState('admin@ivrtechsolution.in');
  const [contactPhone, setContactPhone] = useState('+91 8143177907');
  const [mandatoryFields, setMandatoryFields] = useState<string[]>([
    'name',
    'email',
    'phone',
    'college',
    'department',
    'graduationYear',
  ]);

  const allPossibleFields = [
    { id: 'name', label: 'Full Name' },
    { id: 'email', label: 'Email Address' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'college', label: 'College / University' },
    { id: 'department', label: 'Department / Branch' },
    { id: 'degree', label: 'Degree / Course' },
    { id: 'academicYear', label: 'Academic Year' },
    { id: 'graduationYear', label: 'Graduation Year' },
    { id: 'domain', label: 'Internship Program Track' },
    { id: 'regNumber', label: 'Student Registration / Roll No' },
    { id: 'dob', label: 'Date of Birth' },
    { id: 'address', label: 'Residential Address' },
    { id: 'resumeUrl', label: 'Resume / Portfolio Link' },
  ];

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        setSettings(s);
        setInternshipDays(s.internshipDurationDays?.toString() || '60');
        setMinAttendance(s.minAttendancePercent?.toString() || '75');
        setMinScore(s.minProjectScore?.toString() || '70');
        setAttendanceMode(s.attendanceMode || 'AUTOMATIC');
        setWorkHoursStart(s.workHoursStart || '09:30');
        setWorkHoursEnd(s.workHoursEnd || '18:30');
        setLateGraceTime(s.lateArrivalGraceTime || '10:00');
        setMinSessionDuration(s.minSessionDurationMinutes?.toString() || '30');
        setContactEmail(s.contactEmail || 'admin@ivrtechsolution.in');
        setContactPhone(s.contactPhone || '+91 8143177907');
        if (s.mandatoryStudentFields) {
          setMandatoryFields(s.mandatoryStudentFields.split(','));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const toggleField = (fieldId: string) => {
    if (mandatoryFields.includes(fieldId)) {
      setMandatoryFields(mandatoryFields.filter((f) => f !== fieldId));
    } else {
      setMandatoryFields([...mandatoryFields, fieldId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internshipDurationDays: parseInt(internshipDays, 10),
          minAttendancePercent: parseFloat(minAttendance),
          minProjectScore: parseInt(minScore, 10),
          attendanceMode,
          workHoursStart,
          workHoursEnd,
          lateArrivalGraceTime: lateGraceTime,
          minSessionDurationMinutes: parseInt(minSessionDuration, 10),
          contactEmail,
          contactPhone,
          mandatoryStudentFields: mandatoryFields.join(','),
        }),
      });

      if (res.ok) {
        setSuccessMsg('System configuration, attendance mode, and rules saved successfully.');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert('Failed to save settings');
      }
    } catch {
      alert('Error updating system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Registration Configuration</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Platform Controls
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure fellowship graduation criteria, mandatory registration fields, and official administrative contacts.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Mandatory Registration Fields Configuration */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Mandatory Student Registration Fields</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Check which fields student applicants must provide during registration.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-[#5B21B6] border border-purple-200">
                {mandatoryFields.length} Mandatory Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {allPossibleFields.map((f) => {
                const isChecked = mandatoryFields.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-50/60 border-purple-300 text-[#4C1D95] font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">{f.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleField(f.id)}
                      className="rounded text-[#6D28D9] focus:ring-[#7C3AED] w-4 h-4 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Attendance Configuration Section */}
          <div id="attendance" className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Attendance Configuration & Mode Selection</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Select between Version A (Automatic Login Attendance) and Version B (Manual Student Check-in).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-[#5B21B6] border border-purple-200">
                Centralized Governance
              </span>
            </div>

            {/* Attendance Version Switcher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div
                onClick={() => setAttendanceMode('AUTOMATIC')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  attendanceMode === 'AUTOMATIC'
                    ? 'border-[#7C3AED] bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Version A: Automatic Portal Login Attendance
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Records presence automatically on the student&apos;s first daily login. Session duration is calculated, and repeated logins do not inflate counts.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="attendanceMode"
                    checked={attendanceMode === 'AUTOMATIC'}
                    onChange={() => setAttendanceMode('AUTOMATIC')}
                    className="text-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                  />
                </div>
              </div>

              <div
                onClick={() => setAttendanceMode('MANUAL')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  attendanceMode === 'MANUAL'
                    ? 'border-[#7C3AED] bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Version B: Manual Attendance Check-in
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Displays a prominent &quot;MARK MY ATTENDANCE&quot; button on the student dashboard. Captures server check-in/out timestamps and flags late arrivals.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="attendanceMode"
                    checked={attendanceMode === 'MANUAL'}
                    onChange={() => setAttendanceMode('MANUAL')}
                    className="text-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Rules & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Work Hours Start</label>
                <input
                  type="time"
                  value={workHoursStart}
                  onChange={(e) => setWorkHoursStart(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Work Hours End</label>
                <input
                  type="time"
                  value={workHoursEnd}
                  onChange={(e) => setWorkHoursEnd(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Late Arrival Grace Cutoff</label>
                <input
                  type="time"
                  value={lateGraceTime}
                  onChange={(e) => setLateGraceTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Min Session Duration (Mins)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={minSessionDuration}
                  onChange={(e) => setMinSessionDuration(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Academic Criteria Configuration */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Fellowship Evaluation & Certificate Criteria</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Rules governing automatic eligibility for cryptographic certificate generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Internship Standard Duration (Days)</label>
                <input
                  type="number"
                  required
                  value={internshipDays}
                  onChange={(e) => setInternshipDays(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Minimum Attendance Threshold (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={minAttendance}
                  onChange={(e) => setMinAttendance(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Minimum Capstone Score (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Institutional Contact Information */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Official Institutional Contact Channels</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Official contact parameters displayed on certificates, emails, and student portals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Support & Admissions Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Support Telephone</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-ivr-primary px-7 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Configuration Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

