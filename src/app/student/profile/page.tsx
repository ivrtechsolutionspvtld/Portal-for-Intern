'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User, Mail, Phone, Building, BookOpen, Award, Save, CheckCircle2, ShieldCheck, Camera, UploadCloud, Loader2 } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Photo upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // Validate type: JPG, JPEG, PNG
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setPhotoError('Invalid format. Please upload JPG, JPEG, or PNG.');
      return;
    }

    // Validate size: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size exceeds 5MB limit.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/student/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setProfile((prev: any) => ({ ...prev, avatar: data.avatarUrl }));
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      } else {
        setPhotoError(data.error || 'Failed to upload photograph');
      }
    } catch {
      setPhotoError('Network error uploading photograph');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bio, resumeUrl }),
      });
      if (res.ok) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      } else {
        alert('Failed to update profile');
      }
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Intern Profile & Credentials</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic records, department affiliations, and editable contact preferences.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile and credentials updated successfully!</span>
          </div>
        )}

        {photoError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            {photoError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Avatar & Photo Upload Card */}
          <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl text-center space-y-4">
            <div className="relative inline-block mx-auto">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || 'Student Photo'}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-[#7C3AED] shadow-md mx-auto"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white text-3xl font-black flex items-center justify-center mx-auto shadow-md">
                  {profile?.name?.charAt(0) || 'I'}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white shadow-lg transition-transform hover:scale-105"
                title="Upload Passport-Size Photo"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-xs font-bold text-[#6D28D9] hover:underline inline-flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {profile?.avatar ? 'Replace Passport Photo' : 'Upload Passport Photo'}
              </button>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, JPEG or PNG (Max 5MB)</p>
            </div>

            <div className="pt-2">
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
