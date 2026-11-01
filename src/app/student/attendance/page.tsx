'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  CalendarCheck,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Scan,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // QR Scan state
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scannedToken, setScannedToken] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/attendance');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedToken.trim() || scanLoading) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/student/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedToken.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult({
          success: true,
          message: data.message || 'Attendance verified and marked PRESENT via dynamic QR code!',
        });
        setScannedToken('');
        loadAttendance();
      } else {
        setScanResult({
          success: false,
          message: data.error || 'Invalid or expired QR attendance code.',
        });
      }
    } catch {
      setScanResult({
        success: false,
        message: 'Network error validating attendance code.',
      });
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Record & Dynamic QR Scanner</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan your mentor's live QR code during synchronous sessions to record verified attendance.
            </p>
          </div>

          <button
            onClick={() => {
              setScanResult(null);
              setIsScanOpen(true);
            }}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
          >
            <Scan className="w-4 h-4" />
            Scan / Enter Live Attendance Token
          </button>
        </div>

        {/* Stats Summary Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="ivr-card p-4 bg-white border-l-4 border-l-[#4C1D95]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.attendanceRate}%</span>
              <span
                className={`text-[11px] font-semibold mt-1 block ${
                  stats.isRequirementMet ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {stats.isRequirementMet ? 'Requirement Met (>=80%)' : 'Below 80% Threshold'}
              </span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-emerald-500">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Present Days</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.presentDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Full session verified</span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-amber-500">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Late Check-Ins</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.lateDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Recorded after 10m cutoff</span>
            </div>

            <div className="ivr-card p-4 bg-white border-l-4 border-l-rose-500">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Unexcused Absences</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{stats.absentDays}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Missed cohorts</span>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Attendance Log History</h3>
            <span className="text-xs text-slate-400 font-mono">Total Verified Sessions: {records.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4 text-center">Verification Method</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Verifier / Override Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading attendance records...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No attendance records logged yet.</td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{r.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.method === 'QR_SCAN' && <QrCode className="w-3 h-3 text-[#5B21B6]" />}
                          {r.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'LATE' ? 'warning' : 'danger'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {r.notes || r.markedBy || 'Verified Session'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Scanner / Token Input Modal */}
      <Modal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        title="Dynamic QR Code Check-In"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-[#4C1D95] block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Cryptographic Token Verification
            </span>
            <p className="text-slate-600 leading-relaxed">
              Scan the live QR code displayed by your faculty mentor during the sync session, or paste the dynamic session token below. Tokens are valid for 15 minutes.
            </p>
          </div>

          {scanResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                scanResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {scanResult.success ? 'Attendance Verified!' : 'Check-In Failed'}
                </span>
                <p className="mt-0.5">{scanResult.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleScanSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dynamic QR Code Token
              </label>
              <textarea
                rows={3}
                required
                placeholder="Paste the session token generated by your mentor..."
                value={scannedToken}
                onChange={(e) => setScannedToken(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setScannedToken('IVR-QR-SESSION-TOKEN-LIVE-2026')}
                className="text-[11px] text-[#6D28D9] hover:underline font-semibold"
              >
                Use Active Demo Session Token
              </button>

              <button
                type="submit"
                disabled={scanLoading || !scannedToken.trim()}
                className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {scanLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Validating Signature...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify & Mark Present
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
