'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  UserCog,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Lock,
  Plus,
  Users,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function AdminRolesPage() {
  const permissions = [
    { module: 'Account Approval Management', admin: true, mentor: false, student: false },
    { module: 'Student Profile Creation & Edit', admin: true, mentor: false, student: false },
    { module: 'Student Account Deletion', admin: true, mentor: false, student: false },
    { module: 'Faculty Mentor Allocation', admin: true, mentor: false, student: false },
    { module: 'View Assigned Students Roster', admin: true, mentor: true, student: false },
    { module: 'Create Dynamic QR Attendance Session', admin: true, mentor: true, student: false },
    { module: 'Scan QR / Mark Personal Attendance', admin: false, mentor: false, student: true },
    { module: 'Manual Attendance Correction', admin: true, mentor: false, student: false },
    { module: 'Project Deliverable Grading & Rubrics', admin: true, mentor: true, student: false },
    { module: 'Submit Milestone Project Files', admin: false, mentor: false, student: true },
    { module: 'Generate & Issue Verified Certificates', admin: true, mentor: false, student: false },
    { module: 'Multi-Channel Multi-User Broadcasts', admin: true, mentor: false, student: false },
    { module: 'Direct Student-Mentor Messaging', admin: true, mentor: true, student: true },
    { module: 'Export Enterprise Excel Rosters', admin: true, mentor: true, student: false },
    { module: 'Security Audit Telemetry Review', admin: true, mentor: false, student: false },
    { module: 'Global System Settings Configuration', admin: true, mentor: false, student: false },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Roles & Access Permissions</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              RBAC Governance
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cryptographic, session-backed Role-Based Access Control matrix enforced on both API endpoints and server components.
          </p>
        </div>

        {/* Roles Description Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ivr-card p-5 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                ROLE: ADMIN
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Enterprise Administrator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unrestricted platform sovereignty. Approves and rejects accounts, provisions faculty mentors, modifies system configurations, and issues certified credentials.
            </p>
          </div>

          <div className="ivr-card p-5 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-[#5B21B6] border border-purple-200">
                ROLE: MENTOR
              </span>
              <Users className="w-4 h-4 text-[#6D28D9]" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Academic Faculty Mentor</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Assigned to specific cohort tracks and students. Authorizes attendance via dynamic QR tokens, reviews code repositories, and provides feedback on milestones.
            </p>
          </div>

          <div className="ivr-card p-5 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                ROLE: STUDENT
              </span>
              <KeyRound className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Internship Fellow</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strictly scoped to their individual enrollment. Submits capstone project tasks, checks into daily attendance, communicates with assigned mentors, and accesses verified credentials.
            </p>
          </div>
        </div>

        {/* Permission Matrix Table */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">Role Permission Matrix</h3>
            <span className="text-[11px] text-slate-500">Enforced by JWT Session Claims</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">System Capability / Capability Module</th>
                  <th className="py-3 px-4 text-center">Admin</th>
                  <th className="py-3 px-4 text-center">Mentor</th>
                  <th className="py-3 px-4 text-center">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/20">
                    <td className="py-3 px-4 font-medium text-slate-800">{p.module}</td>
                    <td className="py-3 px-4 text-center">
                      {p.admin ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.mentor ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.student ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

