'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import {
  Users,
  CalendarCheck,
  UserCheck,
  GraduationCap,
  Award,
  CreditCard,
  FolderGit2,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load admin overview', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Operations Overview</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Live Production Cluster
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time platform metrics, admissions pipeline, and academic performance monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/students"
              className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Manage Students / Excel
            </Link>
            <Link
              href="/admin/batches"
              className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Batch
            </Link>
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={loading ? '...' : (data?.metrics?.totalStudents ?? 0)}
            subtitle={data?.metrics?.totalStudents > 0 ? `${data?.metrics?.activeStudents || 0} active fellows` : 'No students added yet'}
            iconName="Users"
            highlightColor="border-l-[#4C1D95]"
          />

          <StatCard
            title="Pending Applications"
            value={loading ? '...' : (data?.metrics?.pendingApplications ?? 0)}
            subtitle={data?.metrics?.pendingApplications > 0 ? "Admissions queue review" : "No applications received yet"}
            iconName="GraduationCap"
            highlightColor="border-l-amber-500"
          />

          <StatCard
            title="Overall Attendance"
            value={
              loading
                ? '...'
                : (data?.metrics?.totalAttendanceRecords > 0
                    ? `${data?.metrics?.overallAttendanceRate}%`
                    : 'N/A')
            }
            subtitle={
              data?.metrics?.totalAttendanceRecords > 0
                ? "Dynamic QR validated"
                : "No attendance records available"
            }
            iconName="CalendarCheck"
            highlightColor="border-l-emerald-500"
          />

          <StatCard
            title="Payment Collections"
            value={loading ? '...' : `₹${(data?.metrics?.totalRevenueINR || 0).toLocaleString('en-IN')}`}
            subtitle={
              data?.metrics?.totalRevenueINR > 0
                ? `${data?.metrics?.pendingOrdersCount || 0} pending settlements`
                : "No transactions recorded"
            }
            iconName="CreditCard"
            highlightColor="border-l-[#7C3AED]"
          />
        </div>

        {/* Secondary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="ivr-card p-4 bg-white text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Faculty Mentors</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {loading ? '...' : data?.metrics?.totalMentors || 0}
            </span>
          </div>
          <div className="ivr-card p-4 bg-white text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Active Batches</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {loading ? '...' : data?.metrics?.activeBatches || 0}
            </span>
          </div>
          <div className="ivr-card p-4 bg-white text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Submissions Pending</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {loading ? '...' : data?.metrics?.pendingSubmissions || 0}
            </span>
          </div>
          <div className="ivr-card p-4 bg-white text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Issued Certificates</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {loading ? '...' : data?.metrics?.completedInternships || 0}
            </span>
          </div>
        </div>

        {/* Domain Distribution & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Domain Breakdown */}
          <div className="ivr-card p-6 bg-white lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Domain Enrollment Breakdown</h3>
                <p className="text-xs text-slate-400">Distribution of fellows across engineering tracks</p>
              </div>
              <Link href="/admin/students" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                View Roster &rarr;
              </Link>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading distribution...</div>
              ) : !data?.domainDistribution || data.domainDistribution.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500 font-medium">No students added yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Import students via Excel or add student profiles to view track distribution.</p>
                </div>
              ) : (
                data?.domainDistribution?.map((item: any) => {
                  const maxCount = Math.max(...data.domainDistribution.map((d: any) => d.count), 1);
                  const percent = Math.round((item.count / (data.metrics.totalStudents || 1)) * 100);
                  return (
                    <div key={item.domain} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{item.domain}</span>
                        <span className="text-slate-500 font-mono">
                          {item.count} fellows ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4C1D95] to-[#7C3AED] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(10, (item.count / maxCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Project Milestones */}
          <div className="ivr-card p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#7C3AED]" />
                  Upcoming Deadlines
                </h3>
                <Link href="/admin/projects" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                  All
                </Link>
              </div>

              <div className="space-y-3">
                {data?.upcomingDeadlines?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No upcoming deadlines.</p>
                ) : (
                  data?.upcomingDeadlines?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-xs">
                      <span className="font-bold text-slate-800 block truncate">{p.title}</span>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Batch: {p.batch?.name || 'All'}</span>
                        <span className="font-semibold text-rose-600">
                          Due {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
              <Link
                href="/admin/projects"
                className="text-xs font-semibold text-[#6D28D9] hover:underline inline-flex items-center gap-1"
              >
                Manage All Project Requirements &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities Stream */}
        <div className="ivr-card p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Live Security & Audit Activity Trail
              </h3>
              <p className="text-xs text-slate-400">Authenticated system operations and changes</p>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-[#6D28D9] hover:underline">
              View Full Audit Log &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!data?.recentActivities || data.recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      No audit activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  data?.recentActivities?.map((act: any) => (
                    <tr key={act.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{act.userEmail}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {act.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#5B21B6]">{act.action}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{act.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
