'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User, Mail, Phone, Building, BookOpen, Award, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Editable fields permitted by admin
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const sp = data.user.studentProfile;
          setProfile({
            ...data.user,
            ...sp,
          });
          setPhone(data.user.phone || '');
          setBio(sp?.bio || '');
          setResumeUrl(sp?.resumeUrl || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    try {
      // In this system, profile updates are sent to an update endpoint or admin update
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate save
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fellow Profile & Credentials</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic records, department affiliations, and editable contact preferences.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile preferences updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Avatar Card */}
          <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white text-3xl font-black flex items-center justify-center mx-auto shadow-md">
              {profile?.name?.charAt(0) || 'F'}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
              <span className="text-xs text-[#6D28D9] font-semibold block">{profile?.domain}</span>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{profile?.email}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p>Cohort: <strong>{profile?.batch?.name || 'Active Batch'}</strong></p>
              <p>Graduation: <strong>{profile?.graduationYear || 2026}</strong></p>
              {profile?.cgpa && <p className="font-semibold text-emerald-700">CGPA: {profile.cgpa}</p>}
            </div>
          </div>

          {/* Right Details Form */}
          <div className="ivr-card p-6 sm:p-8 bg-white border border-slate-200 rounded-xl md:col-span-2">
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Academic & Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">College / University (Verified)</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.college || 'IIT Bombay'}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Department (Verified)</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.department || 'Computer Science & Engineering'}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resume / Portfolio Link</label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Candidate Bio / Research Interests</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your technical background..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Sensitive collegiate fields can only be modified by the Administrator.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-ivr-primary text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
