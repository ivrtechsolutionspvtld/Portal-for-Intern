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
  FolderGit2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  UserPlus,
  AlertTriangle,
  ArrowRightLeft,
  Activity,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
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

  const metrics = data?.metrics || {};
  const hasPendingApprovals =
    (metrics.pendingStudentApprovals || 0) > 0 || (metrics.pendingMentorApprovals || 0) > 0;
  const hasAllocationBacklog =
    (metrics.awaitingCourseAllocation || 0) > 0 || (metrics.awaitingMentorAssignment || 0) > 0;

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Operations Overview</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200">
                Live Enterprise Database
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time platform metrics, course track allocations, daily attendance compliance, and mentor governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/approvals"
              className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Account Approvals
            </Link>
            <Link
              href="/admin/courses"
              className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manage Courses
            </Link>
            <Link
              href="/admin/allocation"
              className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Mentor Allocation
            </Link>
            <Link
              href="/admin/administrators"
              className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrators
            </Link>
          </div>
        </div>

        {/* Operational Attention Banners */}
        <div className="space-y-3">
          {hasPendingApprovals && (
            <div className="p-4 bg-gradient-to-r from-purple-50 via-purple-100/50 to-white border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-200 text-[#5B21B6] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">
                    Registrations Awaiting Administrator Approval & Allocation
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    <strong>{metrics.pendingStudentApprovals || 0}</strong> student(s) and <strong>{metrics.pendingMentorApprovals || 0}</strong> mentor(s) pending verification.
                  </span>
                </div>
              </div>
              <Link
                href="/admin/approvals"
                className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
              >
                Review Approvals &rarr;
              </Link>
            </div>
          )}

          {hasAllocationBacklog && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Allocation Attention:</strong> {metrics.awaitingCourseAllocation || 0} student(s) awaiting course track and {metrics.awaitingMentorAssignment || 0} awaiting mentor assignment.
                </span>
              </div>
              <Link href="/admin/allocation" className="font-bold text-[#7C3AED] hover:underline">
                Resolve in Allocations &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Primary Operational KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Students"
            value={loading ? '...' : (metrics.activeStudents ?? 0)}
            subtitle={`${metrics.totalStudents || 0} total enrolled in platform`}
            iconName="Users"
            highlightColor="border-l-[#4C1D95]"
          />

          <StatCard
            title="Active Mentors"
            value={loading ? '...' : (metrics.activeMentors ?? 0)}
            subtitle={`${metrics.totalMentors || 0} faculty registered`}
            iconName="UserCheck"
            highlightColor="border-l-[#6D28D9]"
          />

          <StatCard
            title="Pending Approvals"
            value={loading ? '...' : ((metrics.pendingStudentApprovals || 0) + (metrics.pendingMentorApprovals || 0))}
            subtitle={`${metrics.pendingStudentApprovals || 0} students • ${metrics.pendingMentorApprovals || 0} mentors`}
            iconName="GraduationCap"
            highlightColor="border-l-amber-500"
          />

          <StatCard
            title="Attendance Compliance"
            value={loading ? '...' : `${metrics.overallAttendance?.ratePercent || 100}%`}
            subtitle={`${metrics.overallAttendance?.totalRecords || 0} total verified sessions`}
            iconName="CalendarCheck"
            highlightColor="border-l-emerald-500"
          />
        </div>

        {/* Today's Attendance Real-Time Dashboard Card */}
        <div className="ivr-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-base font-bold text-slate-900">Today&apos;s Attendance Real-Time Telemetry</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily presence authenticated via server timestamps across automatic login and manual check-in modes.
              </p>
            </div>

            <Link
              href="/admin/attendance"
              className="text-xs font-semibold text-[#6D28D9] hover:underline flex items-center gap-1"
            >
              View Full Attendance Registry &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present Today</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">
                {loading ? '...' : metrics.todayAttendance?.present || 0}
              </span>
              <span className="text-[11px] text-emerald-600">On-time verified</span>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Late Today</span>
              <span className="text-2xl font-black text-amber-800 mt-1 block">
                {loading ? '...' : metrics.todayAttendance?.late || 0}
              </span>
              <span className="text-[11px] text-amber-600">After grace cutoff</span>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent Today</span>
              <span className="text-2xl font-black text-rose-800 mt-1 block">
                {loading ? '...' : metrics.todayAttendance?.absent || 0}
              </span>
              <span className="text-[11px] text-rose-600">Unexcused</span>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Total Check-Ins</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">
                {loading ? '...' : metrics.todayAttendance?.totalToday || 0}
              </span>
              <span className="text-[11px] text-purple-600">Active fellows logged</span>
            </div>
          </div>
        </div>

        {/* Course Enrollment Overview & Deliverables Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Enrollment Overview */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                  Course Enrollment Overview
                </h3>
                <p className="text-xs text-slate-400">Distribution of enrolled students across official internship courses</p>
              </div>
              <Link href="/admin/courses" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                Course Catalog &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading course distribution...</div>
              ) : !data?.courseEnrollments || data.courseEnrollments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No courses provisioned yet.
                </div>
              ) : (
                data.courseEnrollments.map((c: any) => {
                  const studentCount = c._count?.students || 0;
                  const total = metrics.activeStudents || 1;
                  const pct = Math.round((studentCount / total) * 100);
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">
                          {c.code ? `[${c.code}] ` : ''}{c.title} ({c.department})
                        </span>
                        <span className="text-slate-500 font-mono">
                          {studentCount} student(s) • {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4C1D95] to-[#7C3AED] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Internship Progress & Deliverables */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#7C3AED]" />
                  Internship Progress
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live Status
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Completed Fellowships</span>
                    <span className="text-[11px] text-slate-500">QR Certificates Issued</span>
                  </div>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {loading ? '...' : metrics.completedInternships || 0}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Pending Submissions</span>
                    <span className="text-[11px] text-slate-500">Awaiting Mentor Review</span>
                  </div>
                  <span className="text-lg font-black text-amber-700 font-mono">
                    {loading ? '...' : metrics.pendingSubmissions || 0}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Approved Deliverables</span>
                    <span className="text-[11px] text-slate-500">Passed Quality Review</span>
                  </div>
                  <span className="text-lg font-black text-[#5B21B6] font-mono">
                    {loading ? '...' : metrics.approvedSubmissions || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href="/admin/certificates"
                className="text-xs font-semibold text-[#6D28D9] hover:underline inline-flex items-center gap-1"
              >
                Certificate & QR Registry &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Administrator Activities (Live Audit Log Stream) */}
        <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Recent Administrator Activities & Security Audit Trail
              </h3>
              <p className="text-xs text-slate-400">Authenticated system actions, allocations, and approval events</p>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-[#6D28D9] hover:underline">
              View Full Audit Log &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100 font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!data?.recentActivities || data.recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      No administrator activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recentActivities.map((act: any) => (
                    <tr key={act.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{act.userEmail}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {act.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#5B21B6]">{act.action}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">{act.details}</td>
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
