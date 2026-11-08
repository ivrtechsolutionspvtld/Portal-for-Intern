'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FileSpreadsheet,
  Download,
  Users,
  CalendarCheck,
  Award,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function MentorReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mentor/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const students = data?.assignedStudents || [];

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Cohort Performance & Reports</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Evaluator Summary
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Attendance compliance summaries and capstone review records for fellows assigned to your mentorship.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading cohort records...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="ivr-card p-5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Fellows</span>
                <span className="text-2xl font-black text-slate-900">{students.length}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Under active mentorship</span>
              </div>

              <div className="ivr-card p-5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pending Project Reviews</span>
                <span className="text-2xl font-black text-amber-600">{data?.metrics?.pendingReviews || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Milestone code submissions</span>
              </div>

              <div className="ivr-card p-5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verified Attendance Sessions</span>
                <span className="text-2xl font-black text-emerald-600">{data?.metrics?.totalSessions || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Dynamic QR scans recorded</span>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">Assigned Fellows Performance Roster</h3>
                <span className="text-[11px] text-slate-500">Real Database Records</span>
              </div>

              {students.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No students currently assigned to your mentorship.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Fellow Name & ID</th>
                        <th className="py-3 px-4">Program Domain</th>
                        <th className="py-3 px-4">Collegiate Institute</th>
                        <th className="py-3 px-4">Attendance %</th>
                        <th className="py-3 px-4">Submissions Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s: any) => (
                        <tr key={s.id} className="hover:bg-purple-50/20">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{s.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{s.studentId || s.email}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{s.domain}</td>
                          <td className="py-3 px-4 text-slate-600">{s.college || 'Collegiate Institute'}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-700">{s.attendancePercent || 100}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-[#5B21B6] font-semibold border border-purple-200">
                              {s.completedProjects || 0} Milestone(s) Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

