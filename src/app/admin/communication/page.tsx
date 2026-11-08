'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import {
  MessagesSquare,
  Send,
  Mail,
  Phone,
  Bell,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

export default function AdminCommunicationPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [priority, setPriority] = useState('NORMAL');
  const [sendChannels, setSendChannels] = useState<string[]>(['IN_APP', 'EMAIL']);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.announcements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          targetAudience,
          priority,
          channels: sendChannels.join(','),
        }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setSuccessMsg('Multi-channel broadcast sent successfully to all recipients.');
        setTimeout(() => setSuccessMsg(''), 5000);
        loadAnnouncements();
      } else {
        alert('Failed to transmit broadcast');
      }
    } catch {
      alert('Error dispatching message');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (ch: string) => {
    if (sendChannels.includes(ch)) {
      setSendChannels(sendChannels.filter((c) => c !== ch));
    } else {
      setSendChannels([...sendChannels, ch]);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Communication & Multi-Channel Broadcast</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Omni-Channel Dispatcher
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dispatch synchronized notices, academic bulletins, and urgent alerts across In-App notifications, Email, and WhatsApp.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Composer */}
          <div className="lg:col-span-2 ivr-card p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#6D28D9]" />
              Compose Multi-Channel Broadcast
            </h2>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject / Bulletin Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cohort Midterm Milestone Review & Submission Window"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="ALL">All Portal Members (Students & Mentors)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="MENTORS">Faculty Mentors Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Critical Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Delivery Channels</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendChannels.includes('IN_APP')}
                      onChange={() => toggleChannel('IN_APP')}
                      className="rounded text-[#6D28D9]"
                    />
                    <span>In-App Notification</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendChannels.includes('EMAIL')}
                      onChange={() => toggleChannel('EMAIL')}
                      className="rounded text-[#6D28D9]"
                    />
                    <span>Official Email (SES)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendChannels.includes('WHATSAPP')}
                      onChange={() => toggleChannel('WHATSAPP')}
                      className="rounded text-[#6D28D9]"
                    />
                    <span>WhatsApp Cloud API</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Announcement Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Draft your detailed message, guidelines, or instructions here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || sendChannels.length === 0}
                  className="btn-ivr-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Transmitting...' : 'Dispatch Multi-Channel Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info & Help */}
          <div className="space-y-4">
            <div className="ivr-card p-5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 text-xs">
              <span className="font-bold text-[#4C1D95] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                Automated Notifications Engine
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                In addition to manual broadcasts, the portal automatically dispatches transactional notices for:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                <li>Account registration submissions</li>
                <li>Administrator approvals & activations</li>
                <li>Mentor allocations and assignments</li>
                <li>Project review submissions & grading</li>
                <li>Dynamic QR attendance verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Broadcast History */}
        <div className="ivr-card p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Recent Dispatches & Bulletins</h3>
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading broadcasts...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No broadcasts sent yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.map((a: any) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{a.title}</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{a.content}</p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Audience: <strong>{a.targetAudience}</strong></span>
                      <span>•</span>
                      <span>Channels: <strong>{a.channels}</strong></span>
                      <span>•</span>
                      <span>Priority: <strong>{a.priority}</strong></span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

