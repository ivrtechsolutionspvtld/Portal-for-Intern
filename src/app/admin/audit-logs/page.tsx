'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldAlert, Search, Filter, RefreshCw } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (moduleFilter) query.set('module', moduleFilter);
      if (search) query.set('search', search);

      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter, search]);

  const modules = [
    'ALL',
    'AUTH',
    'APPLICATIONS',
    'STUDENT_MANAGEMENT',
    'BATCH_MANAGEMENT',
    'MENTOR_MANAGEMENT',
    'COURSE_MANAGEMENT',
    'ATTENDANCE',
    'PROJECTS',
    'CERTIFICATES',
    'PAYMENTS',
    'COMMUNICATIONS',
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Operations Audit Trail</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically timestamped telemetry of all administrative and mentor mutations.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="btn-ivr-secondary text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Trail
          </button>
        </div>

        {/* Filters */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by actor email, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value === 'ALL' ? '' : e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          >
            {modules.map((m) => (
              <option key={m} value={m === 'ALL' ? '' : m}>
                {m === 'ALL' ? 'All System Modules' : m}
              </option>
            ))}
          </select>
        </div>

        {/* Audit Table */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC+5:30)</th>
                  <th className="py-3 px-4">Actor Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Mutation Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No audit events match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{l.userEmail}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-sans font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {l.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#5B21B6] font-semibold">{l.module}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{l.action}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600 max-w-md truncate">{l.details}</td>
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
