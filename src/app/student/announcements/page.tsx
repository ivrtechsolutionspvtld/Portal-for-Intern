'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Bell,
  AlertTriangle,
  Info,
  Calendar,
  Search,
  Mail,
  Smartphone,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  channels: string;
  createdAt: string;
  batch?: { id: string; name: string } | null;
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setLoading(true);
        const res = await fetch('/api/student/announcements');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, []);

  const filtered = announcements.filter((a) => {
    const matchesPriority = filterPriority === 'ALL' || a.priority === filterPriority;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Official Academic Bulletins & Notices
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Direct institutional broadcasts from the Academic Council, Mentorship Council, and Executive Board.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-[#5B21B6] border border-purple-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#7C3AED]" />
              Multi-channel Broadcasts
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'URGENT', 'HIGH', 'NORMAL'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                  filterPriority === p
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'ALL' ? 'All Priority' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Stream */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Loading academic notices...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Announcements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no announcements matching your current search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const isUrgent = item.priority === 'URGENT';
              const isHigh = item.priority === 'HIGH';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-xs ${
                    isUrgent
                      ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                      : isHigh
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-700 border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.priority} PRIORITY
                      </span>

                      {item.batch ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                          Batch: {item.batch.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          All Fellows Broadcast
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3.5 space-y-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Broadcast Channels:</span>
                      {item.channels.includes('EMAIL') && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <Mail className="w-3 h-3 text-[#7C3AED]" /> SES Email
                        </span>
                      )}
                      {item.channels.includes('WHATSAPP') && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <Smartphone className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </span>
                      )}
                      {item.channels.includes('IN_APP') && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <Bell className="w-3 h-3 text-indigo-600" /> Web Portal
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 font-mono text-[10px]">
                      Notarized Academic Notice
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
