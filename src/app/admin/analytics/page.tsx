'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  PieChart,
  Activity,
  Layers,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = data?.metrics || {};
  const domainDist = data?.domainDistribution || [];
  const workloads = data?.mentorWorkloads || [];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Analytics & Intelligence</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Live Metrics Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated real-time metrics across cohort attendance, enrollment distribution, and mentor capacities.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ivr-secondary text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Students"
            value={loading ? '...' : (metrics.totalStudents ?? 0)}
            subtitle={metrics.activeStudents > 0 ? `${metrics.activeStudents} active fellows` : 'No active students'}
            iconName="Users"
            highlightColor="border-l-[#4C1D95]"
          />

          <StatCard
            title="Faculty Mentors"
            value={loading ? '...' : (metrics.totalMentors ?? 0)}
            subtitle={metrics.activeMentors > 0 ? `${metrics.activeMentors} active faculty` : 'No mentors configured'}
            iconName="UserCheck"
            highlightColor="border-l-[#6D28D9]"
          />

          <StatCard
            title="Cohort Attendance Rate"
            value={loading ? '...' : `${metrics.overallAttendanceRate ?? 0}%`}
            subtitle={metrics.totalAttendanceRecords > 0 ? `${metrics.totalAttendanceRecords} sessions logged` : 'No sessions logged yet'}
            iconName="CalendarCheck"
            highlightColor="border-l-emerald-600"
          />

          <StatCard
            title="Accredited Certificates"
            value={loading ? '...' : (metrics.completedInternships ?? 0)}
            subtitle="Verified credentials issued"
            iconName="Award"
            highlightColor="border-l-amber-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Distribution */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#6D28D9]" />
                <h3 className="font-bold text-slate-900 text-sm">Enrollment by Engineering Domain</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Real Database Records</span>
            </div>

            {domainDist.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No student domain distribution data recorded yet.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {domainDist.map((d: any) => {
                  const maxCount = Math.max(...domainDist.map((item: any) => item.count), 1);
                  const widthPercent = Math.max(5, Math.round((d.count / maxCount) * 100));
                  return (
                    <div key={d.domain} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{d.domain}</span>
                        <span className="font-bold text-[#5B21B6]">{d.count} fellow(s)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4C1D95] to-[#7C3AED] rounded-full transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mentor Workload Analytics */}
          <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#6D28D9]" />
                <h3 className="font-bold text-slate-900 text-sm">Faculty Mentor Workload & Capacity</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Allocation Index</span>
            </div>

            {workloads.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No mentor allocations active in current cohorts.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {workloads.map((mw: any) => {
                  const capacityPercent = Math.min(100, Math.round((mw.assignedCount / (mw.maxStudents || 30)) * 100));
                  return (
                    <div key={mw.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{mw.name}</span>
                          <span className="text-slate-400 text-[11px] block">{mw.designation}</span>
                        </div>
                        <span className="font-bold text-slate-700">
                          {mw.assignedCount} / {mw.maxStudents || 30} ({capacityPercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            capacityPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(4, capacityPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Admissions Pipeline Status */}
        <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#6D28D9]" />
              <h3 className="font-bold text-slate-900 text-sm">Admissions Pipeline Summary</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Verified Database Sums</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Applications</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalApplications ?? 0}</span>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Review</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.pendingApplications ?? 0}</span>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Approved Fellows</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics.approvedApplications ?? 0}</span>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rejected Applications</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">{metrics.rejectedApplications ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

