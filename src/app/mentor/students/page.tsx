'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import { Users, Search, Award, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Fellows</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review individual progress, attendance compliance, and recommend candidates for certificates.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="ivr-card p-4 bg-white max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assigned students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading assigned fellows...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">No students match search.</div>
          ) : (
            filteredStudents.map((s) => (
              <div key={s.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-[#5B21B6] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                      {s.batchName}
                    </span>
                    <Badge variant={s.attendancePercent >= 80 ? 'success' : 'warning'}>
                      {s.attendancePercent}% Attendance
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mb-2">{s.email}</p>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="truncate font-medium">{s.college}</p>
                    <p className="text-slate-500">{s.department} • Grad {s.graduationYear}</p>
                    {s.cgpa && <p className="text-[#5B21B6] font-semibold">CGPA: {s.cgpa}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Milestone Projects:</span>
                    <span className="font-bold text-slate-800">
                      {s.approvedProjects} / {s.totalProjects || 1} Approved
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Credential Status:</span>
                    {s.hasCertificate ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Issued ({s.certificateNumber})
                      </span>
                    ) : s.attendancePercent >= 80 && s.approvedProjects >= 1 ? (
                      <span className="text-purple-700 font-bold">Eligible for Issuance</span>
                    ) : (
                      <span className="text-amber-600 font-medium">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
