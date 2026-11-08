'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  LogOut,
  Check,
  ShieldCheck,
  RefreshCw,
  Sun,
  Activity,
} from 'lucide-react';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/attendance');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleManualCheckIn = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MANUAL_CHECK_IN' }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: resJson.error || 'Attendance check-in failed.' });
      } else {
        setFeedback({ type: 'success', message: resJson.message || 'Your attendance has been successfully marked.' });
        loadAttendance();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error submitting attendance.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualCheckOut = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MANUAL_CHECK_OUT' }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: resJson.error || 'Check-out recording failed.' });
      } else {
        setFeedback({ type: 'success', message: resJson.message || 'Check-out recorded successfully.' });
        loadAttendance();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error submitting check-out.' });
    } finally {
      setActionLoading(false);
    }
  };

  const isMarkedToday = !!data?.todayRecord;
  const isCheckedOutToday = !!data?.todayRecord?.checkOutTime;
  const mode = data?.attendanceMode || 'AUTOMATIC';
  const stats = data?.stats;
  const records = data?.records || [];

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 uppercase tracking-widest">
                Attendance Compliance System
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Active Mode: {mode === 'AUTOMATIC' ? 'Version A (Auto Portal Login)' : 'Version B (Manual Check-In)'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Record & History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise daily presence verification, session duration logs, and compliance telemetry.
            </p>
          </div>

          <button
            onClick={loadAttendance}
            className="p-2 text-slate-600 hover:text-[#7C3AED] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7C3AED]' : ''}`} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
          </div>
        )}

        {/* ATTENDANCE INTERACTION HERO CARD */}
        <div className="ivr-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          {mode === 'MANUAL' ? (
            // VERSION B: MANUAL ATTENDANCE CHECK-IN
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] text-[11px] font-bold border border-purple-200">
                  <Sun className="w-3.5 h-3.5" />
                  Version B — Daily Manual Check-In
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isMarkedToday
                    ? `Attendance Marked for Today (${data.todayRecord.status})`
                    : "Ready for Today's Attendance Verification"}
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  {isMarkedToday
                    ? `Checked in at ${
                        data.todayRecord.checkInTime
                          ? new Date(data.todayRecord.checkInTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'earlier today'
                      }. ${
                        data.todayRecord.checkOutTime
                          ? `Checked out at ${new Date(data.todayRecord.checkOutTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} (${data.todayRecord.durationMinutes || 0} mins logged).`
                          : 'Remember to record check-out when completing your session.'
                      }`
                    : 'Click the button below to confirm your daily presence on the platform. Server timestamps are authenticated.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                {!isMarkedToday ? (
                  <button
                    onClick={handleManualCheckIn}
                    disabled={actionLoading}
                    className="btn-ivr-primary px-8 py-3.5 rounded-xl font-black text-sm tracking-wide shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    {actionLoading ? 'RECORDING PRESENCE...' : 'MARK MY ATTENDANCE'}
                  </button>
                ) : (
                  <>
                    <div className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2 shadow-2xs">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>Attendance Confirmed ({data.todayRecord.status})</span>
                    </div>

                    {!isCheckedOutToday ? (
                      <button
                        onClick={handleManualCheckOut}
                        disabled={actionLoading}
                        className="btn-ivr-secondary px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:border-[#7C3AED]"
                      >
                        <LogOut className="w-4 h-4 text-[#7C3AED]" />
                        {actionLoading ? 'Recording...' : 'Record Check-Out'}
                      </button>
                    ) : (
                      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Session Concluded</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            // VERSION A: AUTOMATIC PORTAL LOGIN ATTENDANCE
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] text-[11px] font-bold border border-purple-200">
                  <Activity className="w-3.5 h-3.5" />
                  Version A — Automatic Portal Login Attendance
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isMarkedToday
                    ? `Presence Automatically Verified (${data.todayRecord.status})`
                    : 'Automatic Attendance Active'}
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  {isMarkedToday
                    ? `First authenticated login of the day captured at ${
                        data.todayRecord.checkInTime
                          ? new Date(data.todayRecord.checkInTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'session start'
                      }. Method: ${data.todayRecord.method}. Total active session telemetry: ${
                        data.todayRecord.durationMinutes || 0
                      } minutes.`
                    : 'Your daily attendance is recorded seamlessly on your first portal login each day.'}
                </p>
              </div>

              <div className="shrink-0">
                {isMarkedToday ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-3 shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block text-sm">Today Logged: {data.todayRecord.status}</span>
                      <span className="text-[11px] text-emerald-700">Authenticated via Server Timestamp</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Synchronizing session telemetry...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="ivr-card p-4 bg-white border-l-4 border-l-[#4C1D95] rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Percentage</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.attendanceRate}%</span>
              <span
                className={`text-[11px] font-semibold mt-1 block ${
                  stats.isRequirementMet ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {stats.isRequirementMet ? `✓ Target Met (>=${stats.minRequiredPercent}%)` : `Below Target (<${stats.minRequiredPercent}%)`}
              </span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-emerald-500 rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Present Days</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.presentDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Full days confirmed</span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-amber-500 rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Late Arrivals</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.lateDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">After grace window</span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-rose-500 rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Absent Days</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.absentDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Unexcused missed sessions</span>
            </div>
          </div>
        )}

        {/* Attendance Records Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              Verified Daily Attendance History
            </h3>
            <span className="text-xs text-slate-500">
              Total Logged: <strong>{records.length}</strong> day(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Check-In Time</th>
                  <th className="p-3.5">Check-Out Time</th>
                  <th className="p-3.5">Session Duration</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading daily attendance records...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No attendance records found yet. {mode === 'MANUAL' ? 'Click "MARK MY ATTENDANCE" above to register today.' : 'Log in daily to record attendance automatically.'}
                    </td>
                  </tr>
                ) : (
                  records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {r.date}
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono text-[11px]">
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono text-[11px]">
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {r.durationMinutes ? `${r.durationMinutes} mins` : 'In progress'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {r.method}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            r.status === 'PRESENT'
                              ? 'success'
                              : r.status === 'LATE'
                              ? 'warning'
                              : r.status === 'ABSENT'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] truncate max-w-xs">
                        {r.notes || '—'}
                      </td>
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
