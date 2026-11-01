'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { QrCode, Clock, CheckCircle2, Save, Users, Sparkles, AlertCircle } from 'lucide-react';

export default function MentorAttendancePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QR Session Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadAttendance = async (batchId?: string, targetDate?: string) => {
    setLoading(true);
    try {
      const bId = batchId || selectedBatchId;
      const d = targetDate || date;
      const query = new URLSearchParams();
      if (bId) query.set('batchId', bId);
      if (d) query.set('date', d);

      const res = await fetch(`/api/mentor/attendance?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        setSelectedBatchId(data.selectedBatchId || data.batches?.[0]?.id || '');
        setAttendanceSheet(data.attendanceSheet || []);
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

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setAttendanceSheet((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mentor/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date,
          records: attendanceSheet.map((s) => ({
            studentId: s.studentId,
            status: s.status,
          })),
        }),
      });
      if (res.ok) {
        alert('Attendance sheet saved successfully!');
        loadAttendance(selectedBatchId, date);
      } else {
        alert('Failed to save attendance records.');
      }
    } catch {
      alert('Error saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Launch dynamic QR attendance session
  const handleLaunchQrSession = async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/mentor/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          durationMinutes: 15,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setIsQrModalOpen(true);
      } else {
        alert(data.error || 'Failed to generate attendance session.');
      }
    } catch {
      alert('Error launching QR session.');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Batch Attendance & Dynamic QR Generator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch time-limited cryptographic QR check-in sessions or manually record attendance.
            </p>
          </div>

          <button
            onClick={handleLaunchQrSession}
            disabled={!selectedBatchId || qrLoading}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
          >
            <QrCode className="w-4 h-4" />
            Launch Live QR Check-In Session (15m)
          </button>
        </div>

        {/* Controls Bar */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Cohort Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                loadAttendance(e.target.value, date);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.domain})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                loadAttendance(selectedBatchId, e.target.value);
              }}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Attendance Sheet Table */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Roster for {batches.find((b) => b.id === selectedBatchId)?.name || 'Selected Batch'} ({attendanceSheet.length} Students)
            </h3>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="btn-ivr-primary text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving Sheet...' : 'Save Manual Attendance'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Verification Method</th>
                  <th className="py-3 px-4 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading attendance sheet...</td>
                  </tr>
                ) : attendanceSheet.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No students enrolled in this batch.</td>
                  </tr>
                ) : (
                  attendanceSheet.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{s.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {s.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-1">
                          {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, st)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                                s.status === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : st === 'LATE'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : st === 'EXCUSED'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dynamic QR Session Modal */}
      {activeSession && (
        <Modal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Active Dynamic Attendance Session"
        >
          <div className="space-y-5 text-center">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-xs font-bold text-[#4C1D95] block">
                Session Active for {activeSession.batchName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Valid for {activeSession.durationMinutes} Minutes (Expires at {new Date(activeSession.expiresAt).toLocaleTimeString()})
              </span>
            </div>

            {/* High-Resolution QR Code */}
            <div className="p-6 bg-white rounded-2xl border-2 border-[#5B21B6]/30 inline-block shadow-lg mx-auto">
              <img
                src={activeSession.qrDataUrl}
                alt="Dynamic Attendance QR Code"
                className="w-56 h-56 mx-auto"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                Signed Cryptographic Token (One-time, non-reusable)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-left text-xs font-mono text-slate-600 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Encrypted Session Token:</span>
              <p className="break-all text-[11px] text-[#5B21B6] mt-0.5">{activeSession.token}</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Students scan this QR code from their student portal attendance page. Duplicate scans for the day will be automatically rejected.
            </p>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="btn-ivr-primary text-xs font-bold px-6 py-2 rounded-lg"
            >
              Keep Running in Background & Close Window
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
