'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import {
  Users,
  CalendarCheck,
  FolderGit2,
  QrCode,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function MentorOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMentorOverview() {
      try {
        const res = await fetch('/api/mentor/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load mentor overview', err);
      } finally {
        setLoading(false);
      }
    }
    loadMentorOverview();
  }, []);

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Mentorship Workspace</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Lead Architect Portal
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Welcome, <strong>{data?.mentor?.name || 'Faculty Mentor'}</strong> ({data?.mentor?.designation || 'Principal Solutions Architect'}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mentor/attendance"
              className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              Launch Live QR Attendance
            </Link>
            <Link
              href="/mentor/messages"
              className="btn-ivr-secondary text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat With Fellows
            </Link>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Fellows"
            value={loading ? '...' : (data?.metrics?.totalStudents ?? 0)}
            subtitle={data?.metrics?.totalStudents > 0 ? `Capacity: ${data?.mentor?.maxStudents || 30} fellows` : 'No fellows assigned yet'}
            iconName="Users"
            highlightColor="border-l-[#4C1D95]"
          />

          <StatCard
            title="Active Batches"
            value={loading ? '...' : (data?.metrics?.totalBatches ?? 0)}
            subtitle={data?.metrics?.totalBatches > 0 ? "Assigned cohorts" : "No active batches"}
            iconName="CalendarCheck"
            highlightColor="border-l-[#7C3AED]"
          />

          <StatCard
            title="Pending Submissions"
            value={loading ? '...' : (data?.metrics?.pendingSubmissionsCount ?? 0)}
            subtitle="Deliverables to evaluate"
            iconName="FolderGit2"
            highlightColor="border-l-amber-500"
          />

          <StatCard
            title="Cohort Attendance Rate"
            value={
              loading
                ? '...'
                : (data?.metrics?.totalRecords > 0
                    ? `${data?.metrics?.averageAttendance}%`
                    : 'N/A')
            }
            subtitle={
              data?.metrics?.totalRecords > 0
                ? "Dynamic QR validated"
                : "No attendance records available"
            }
            iconName="CalendarCheck"
            highlightColor="border-l-emerald-500"
          />
        </div>

        {/* Pending Submissions & Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions Queue */}
          <div className="ivr-card p-6 bg-white lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Deliverables Awaiting Rubric Evaluation</h3>
                <p className="text-xs text-slate-400">Review candidate code, test coverage, and assign rubric scores</p>
              </div>
              <Link href="/mentor/projects" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                View All Deliverables &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading submissions queue...</div>
            ) : data?.pendingSubmissions?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All submissions evaluated! No pending deliverables.
              </div>
            ) : (
              <div className="space-y-3">
                {data?.pendingSubmissions?.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{sub.student.user.name}</div>
                      <div className="text-[11px] text-[#5B21B6] font-semibold mt-0.5">{sub.project.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={sub.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#6D28D9] font-mono hover:underline flex items-center gap-1 font-semibold"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                      <Link
                        href="/mentor/projects"
                        className="btn-ivr-primary text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs"
                      >
                        Grade Deliverable
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Batch Milestones */}
          <div className="ivr-card p-6 bg-white flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mb-4">
                <Clock className="w-4 h-4 text-[#7C3AED]" />
                Upcoming Milestones
              </h3>

              <div className="space-y-3">
                {data?.upcomingProjects?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No upcoming deadlines.</p>
                ) : (
                  data?.upcomingProjects?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <span className="font-bold text-slate-800 block truncate">{p.title}</span>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span className="text-[#6D28D9] font-semibold">{p.domain}</span>
                        <span className="font-bold text-rose-600">
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
                href="/mentor/attendance"
                className="text-xs font-bold text-[#6D28D9] hover:underline inline-flex items-center gap-1"
              >
                Launch QR Attendance Session &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
