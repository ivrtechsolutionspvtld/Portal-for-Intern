'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import { CalendarCheck, Plus, Users, Edit, Clock, Award } from 'lucide-react';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    domain: DOMAINS[0].name,
    startDate: '',
    endDate: '',
    mentorId: '',
    status: 'ACTIVE',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, mRes] = await Promise.all([
        fetch('/api/admin/batches'),
        fetch('/api/admin/mentors'),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBatches(bData.batches || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMentors(mData.mentors || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          name: '',
          domain: DOMAINS[0].name,
          startDate: '',
          endDate: '',
          mentorId: '',
          status: 'ACTIVE',
        });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create batch');
      }
    } catch {
      alert('Error creating batch');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Batch Operations & Scheduling</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure cohort start/end dates, mentor assignments, and monitor active cohort progress.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Batch
          </button>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">No batches created yet.</div>
          ) : (
            batches.map((b) => (
              <div key={b.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {b.name}
                    </span>
                    <Badge variant={b.status === 'ACTIVE' ? 'success' : 'default'}>
                      {b.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{b.domain}</h3>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      Mentor: <span className="font-semibold text-slate-700">{b.mentor?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Fellows</span>
                    <span className="font-bold text-slate-800 text-sm">{b.studentCount}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">QR Sessions</span>
                    <span className="font-bold text-slate-800 text-sm">{b.sessionCount}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Projects</span>
                    <span className="font-bold text-slate-800 text-sm">{b.projectCount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Internship Batch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Identifier Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Batch FS-2026-B"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Engineering Domain</label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cohort Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cohort End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign Lead Faculty Mentor</label>
            <select
              value={form.mentorId}
              onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Select Mentor (Optional)</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.designation})
                </option>
              ))}
            </select>
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
              Launch Batch
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
