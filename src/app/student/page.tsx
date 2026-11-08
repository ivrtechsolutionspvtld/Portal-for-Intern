'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import {
  CalendarCheck,
  BookOpen,
  FolderGit2,
  Award,
  CreditCard,
  QrCode,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
} from 'lucide-react';

export default function StudentOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentOverview() {
      try {
        const res = await fetch('/api/student/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load student overview', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentOverview();
  }, []);

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Personalized Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#6D28D9] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold mb-3 border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C4B5FD]" />
              {data?.student?.domain || 'Full-Stack Web Development'} Fellow
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome Back, {data?.student?.name || 'Fellow'}!
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 mt-2 leading-relaxed">
              Enrolled in <strong>{data?.student?.batch?.name || 'Active Cohort'}</strong>. Assigned Mentor:{' '}
              <strong>{data?.student?.mentor?.name || 'Faculty Mentor'}</strong>.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/student/attendance"
                className="bg-white text-[#4C1D95] font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-purple-50 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                Scan Dynamic QR Attendance
              </Link>
              <Link
                href="/student/projects"
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                View Milestone Projects
              </Link>
            </div>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Attendance Compliance"
            value={loading ? '...' : `${data?.metrics?.attendancePercent || 100}%`}
            subtitle={`${data?.metrics?.presentClasses || 0}/${data?.metrics?.totalClasses || 0} Sessions Verified`}
            iconName="CalendarCheck"
            trend={{
              value: (data?.metrics?.attendancePercent || 100) >= 80 ? 'Eligible (>=80%)' : 'Below Threshold',
              isPositive: (data?.metrics?.attendancePercent || 100) >= 80,
            }}
            highlightColor={
              (data?.metrics?.attendancePercent || 100) >= 80 ? 'border-l-emerald-500' : 'border-l-amber-500'
            }
          />

          <StatCard
            title="LMS Learning Progress"
            value={loading ? '...' : `${data?.metrics?.learningProgressPercent || 0}%`}
            subtitle={`${data?.metrics?.completedModules || 0}/${data?.metrics?.totalModules || 4} Modules Completed`}
            iconName="BookOpen"
            trend={{ value: 'Curriculum Active', isPositive: true }}
            highlightColor="border-l-[#4C1D95]"
          />

          <StatCard
            title="Pending Milestone Tasks"
            value={loading ? '...' : data?.metrics?.pendingAssignmentsCount || 0}
            subtitle="Deliverables in progress"
            iconName="FolderGit2"
            trend={{ value: 'Due Next Week', isPositive: false }}
            highlightColor="border-l-amber-500"
          />

          <StatCard
            title="Certificate Readiness"
            value={
              loading
                ? '...'
                : data?.certificateEligibility?.hasCertificate
                ? 'Issued'
                : data?.certificateEligibility?.isEligible
                ? 'Eligible'
                : 'In Progress'
            }
            subtitle={
              data?.certificateEligibility?.hasCertificate
                ? data.certificateEligibility.certificateNumber
                : 'Criteria Evaluation'
            }
            iconName="Award"
            trend={{
              value: data?.certificateEligibility?.hasCertificate ? 'Verified QR Ready' : 'Criteria Pending',
              isPositive: data?.certificateEligibility?.isEligible,
            }}
            highlightColor="border-l-[#7C3AED]"
          />
        </div>

        {/* Certificate Eligibility Meter & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Eligibility Card */}
          <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6D28D9]" />
              Certificate Eligibility Benchmark
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Attendance Requirement</span>
                  <span className="text-[11px] text-slate-500">Benchmark: Minimum 75% Validated</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800">
                    {data?.certificateEligibility?.criteria?.attendance?.current || '100%'}
                  </span>
                  <div>
                    {data?.certificateEligibility?.criteria?.attendance?.met ? (
                      <Badge variant="success">MET</Badge>
                    ) : (
                      <Badge variant="warning">BELOW 75%</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Capstone Deliverables</span>
                  <span className="text-[11px] text-slate-500">Benchmark: All Submissions Approved</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800">
                    {data?.certificateEligibility?.criteria?.projects?.current || 'Pending'}
                  </span>
                  <div>
                    {data?.certificateEligibility?.criteria?.projects?.met ? (
                      <Badge variant="success">MET</Badge>
                    ) : (
                      <Badge variant="warning">IN PROGRESS</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/student/certificate"
                className="btn-ivr-primary text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-xs w-full"
              >
                View Official Certificate & QR &rarr;
              </Link>
            </div>
          </div>

          {/* Pending Tasks & Mentor Card */}
          <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl lg:col-span-2 space-y-5">
            {/* Mentor info pill */}
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {data?.student?.mentor?.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Your Assigned Faculty Mentor
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {data?.student?.mentor?.name || 'Faculty Mentor'}
                  </h4>
                  <span className="text-[11px] text-[#6D28D9] font-medium">
                    {data?.student?.mentor?.designation || 'Academic Faculty'}
                  </span>
                </div>
              </div>

              <Link
                href="/student/messages"
                className="btn-ivr-secondary text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
              >
                Message Mentor
              </Link>
            </div>

            {/* Pending Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Milestone Projects
                </h4>
                <Link href="/student/projects" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                  All Deliverables &rarr;
                </Link>
              </div>

              <div className="space-y-2.5">
                {data?.pendingAssignments?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 italic">No pending tasks. Great work!</p>
                ) : (
                  data?.pendingAssignments?.map((a: any) => (
                    <div
                      key={a.id}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{a.title}</span>
                        <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Due {new Date(a.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="warning">{a.submissionStatus}</Badge>
                        <Link
                          href="/student/projects"
                          className="btn-ivr-primary text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs"
                        >
                          Submit Work
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
