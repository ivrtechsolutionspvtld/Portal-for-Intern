'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FileSpreadsheet,
  Download,
  Users,
  UserCheck,
  CalendarCheck,
  CreditCard,
  ShieldAlert,
  Award,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (key: string, url: string, filename: string) => {
    setDownloading(key);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1500);
  };

  const reportCards = [
    {
      id: 'students',
      title: 'Students Master Roster (Excel)',
      description: 'Full export of student fellows, contact details, college affiliations, enrolled domains, mentors, and completion metrics.',
      icon: Users,
      url: '/api/admin/students/export',
      filename: `IVR_Students_Export_${Date.now()}.xlsx`,
      format: 'XLSX Spreadsheet',
    },
    {
      id: 'mentors',
      title: 'Mentor Faculty Directory (Excel)',
      description: 'Comprehensive roster of academic faculty mentors, employee IDs, department specializations, and active student allocations.',
      icon: UserCheck,
      url: '/api/admin/mentors/export',
      filename: `IVR_Mentors_Export_${Date.now()}.xlsx`,
      format: 'XLSX Spreadsheet',
    },
    {
      id: 'attendance',
      title: 'Cohort Attendance History',
      description: 'Chronological attendance logs across manual entry and cryptographic dynamic QR check-ins.',
      icon: CalendarCheck,
      url: '/api/admin/attendance?export=true',
      filename: `IVR_Attendance_Export_${Date.now()}.csv`,
      format: 'CSV Export',
    },
    {
      id: 'audit',
      title: 'Security & System Audit Telemetry',
      description: 'Official enterprise audit records documenting administrative approvals, credential changes, and system modifications.',
      icon: ShieldAlert,
      url: '/api/admin/audit-logs?export=true',
      filename: `IVR_AuditLogs_${Date.now()}.csv`,
      format: 'Audit Stream CSV',
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Reports & Data Exports</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Compliant Data Extraction
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Generate and download encrypted, standardized Excel and CSV data exports across all platform registries.
          </p>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCards.map((r) => {
            const Icon = r.icon;
            const isBusy = downloading === r.id;

            return (
              <div
                key={r.id}
                className="ivr-card p-6 bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center border border-purple-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider font-mono">
                      {r.format}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{r.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Ready for on-demand extraction</span>
                  <button
                    disabled={isBusy}
                    onClick={() => handleDownload(r.id, r.url, r.filename)}
                    className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance Note */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
          <FileSpreadsheet className="w-5 h-5 text-[#6D28D9] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#4C1D95] block mb-0.5">DPDP Act Compliance & Data Governance</span>
            Exported spreadsheets contain sensitive personal contact information. Ensure files are shared only with
            authorized collegiate administrators and encrypted during external transit.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

