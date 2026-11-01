'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Bell, Plus, Send, CheckCircle2, Mail, MessageSquare } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    batchId: '',
    priority: 'NORMAL',
    channels: ['IN_APP', 'EMAIL'],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, bRes] = await Promise.all([
        fetch('/api/admin/announcements'),
        fetch('/api/admin/batches'),
      ]);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnnouncements(aData.announcements || []);
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
  }, []);

  const handleChannelToggle = (ch: string) => {
    setForm((prev) => {
      const exists = prev.channels.includes(ch);
      return {
        ...prev,
        channels: exists ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: '',
          content: '',
          targetAudience: 'ALL',
          batchId: '',
          priority: 'NORMAL',
          channels: ['IN_APP', 'EMAIL'],
        });
        loadData();
      } else {
        alert('Failed to publish announcement');
      }
    } catch {
      alert('Error publishing announcement');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Announcement Dispatcher</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast critical cohort updates via In-App Alerts, Amazon SES Email, and WhatsApp Cloud API.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Broadcast
          </button>
        </div>

        {/* Announcements Stream */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No announcements published yet.</div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-[#5B21B6] border border-purple-200'
                      }`}
                    >
                      {ann.priority} Priority
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Target: {ann.targetAudience === 'ALL' ? 'All Fellows' : ann.batch?.name || 'Assigned Batch'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Dispatched Channels:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    {ann.channels.split(',').map((ch: string) => (
                      <span key={ch} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] uppercase">
                        {ch.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Compose Multi-Channel Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for Mid-Term Architecture Reviews"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audience Target</label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">All Cohorts & Fellows</option>
                <option value="BATCH">Target Specific Batch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Action Required</option>
              </select>
            </div>
          </div>

          {form.targetAudience === 'BATCH' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Cohort Batch</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Select Target Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.domain})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Body Content</label>
            <textarea
              rows={4}
              required
              placeholder="Draft your announcement message..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          {/* Delivery Channels Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Delivery Channels</label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.channels.includes('IN_APP')}
                  onChange={() => handleChannelToggle('IN_APP')}
                  className="rounded text-[#6D28D9]"
                />
                <span className="font-medium">In-App Notification</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.channels.includes('EMAIL')}
                  onChange={() => handleChannelToggle('EMAIL')}
                  className="rounded text-[#6D28D9]"
                />
                <span className="font-medium">Amazon SES Email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.channels.includes('WHATSAPP')}
                  onChange={() => handleChannelToggle('WHATSAPP')}
                  className="rounded text-[#6D28D9]"
                />
                <span className="font-medium">WhatsApp Cloud API</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Broadcast to Recipients
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
