'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { CalendarCheck, Search, Filter, Edit3, Download, CheckCircle2, QrCode } from 'lucide-react';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Correction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('PRESENT');
  const [correctionNotes, setCorrectionNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedBatch) query.set('batchId', selectedBatch);
      if (selectedDate) query.set('date', selectedDate);

      const [attRes, bRes] = await Promise.all([
        fetch(`/api/admin/attendance?${query.toString()}`),
        fetch('/api/admin/batches'),
      ]);

      if (attRes.ok) {
        const attData = await attRes.json();
        setRecords(attData.records || []);
        setStats(attData.stats || null);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBatches(bData.batches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedDate]);

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedRecord.id,
          status: newStatus,
          notes: correctionNotes,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setCorrectionNotes('');
        loadData();
      } else {
        alert('Failed to update attendance');
      }
    } catch {
      alert('Error updating attendance');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">PRESENT</Badge>;
      case 'LATE':
        return <Badge variant="warning">LATE</Badge>;
      case 'ABSENT':
        return <Badge variant="danger">ABSENT</Badge>;
      case 'EXCUSED':
        return <Badge variant="info">EXCUSED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance & Cryptographic QR Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live verified check-ins, manual administrative corrections, and compliance percentage tracking.
            </p>
          </div>
        </div>

        {/* Stats Summary Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="ivr-card p-3 bg-white text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{stats.totalRecords}</span>
            </div>
            <div className="ivr-card p-3 bg-white text-center border-l-2 border-emerald-500">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Present</span>
              <span className="text-lg font-black text-emerald-700 mt-0.5 block">{stats.presentCount}</span>
            </div>
            <div className="ivr-card p-3 bg-white text-center border-l-2 border-amber-500">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Late</span>
              <span className="text-lg font-black text-amber-700 mt-0.5 block">{stats.lateCount}</span>
            </div>
            <div className="ivr-card p-3 bg-white text-center border-l-2 border-rose-500">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Absent</span>
              <span className="text-lg font-black text-rose-700 mt-0.5 block">{stats.absentCount}</span>
            </div>
            <div className="ivr-card p-3 bg-purple-50 text-center border-l-2 border-[#5B21B6]">
              <span className="text-[10px] uppercase font-bold text-[#5B21B6] block">Compliance Rate</span>
              <span className="text-lg font-black text-[#5B21B6] mt-0.5 block">{stats.effectiveRate}%</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          />
        </div>

        {/* Attendance Records Table */}
        <div className="ivr-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Cohort Batch</th>
                  <th className="py-3 px-4 text-center">Method</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Verifier / Override</th>
                  <th className="py-3 px-4 text-right">Correct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance records available.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{r.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#6D28D9]">{r.batchName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.method === 'QR_SCAN' && <QrCode className="w-3 h-3 text-[#5B21B6]" />}
                          {r.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(r.status)}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{r.markedBy || 'System QR'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setNewStatus(r.status);
                            setCorrectionNotes(r.notes || '');
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg transition-colors"
                          title="Authorized Manual Correction"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Correction Modal */}
      {selectedRecord && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Authorized Attendance Correction">
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs">
              <div>
                <strong>Student:</strong> {selectedRecord.studentName} ({selectedRecord.studentEmail})
              </div>
              <div className="mt-1">
                <strong>Date:</strong> {selectedRecord.date} | <strong>Current Status:</strong> {selectedRecord.status}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Attendance Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED (Medical / Academic Leave)</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Administrative Override</label>
              <textarea
                rows={3}
                required
                placeholder="Document justification for audit trail (e.g. Verified university conflict letter)..."
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
                Log Authorized Correction
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
