'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bell, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

export default function MentorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/student/announcements');
        if (res.ok) {
          const json = await res.json();
          setAnnouncements(json.announcements || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Bulletins & Notices</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
              Faculty Noticeboard
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Important announcements, review deadlines, and platform alerts issued by IVR Tech Solutions Administration.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No announcements yet</h3>
            <p className="text-xs text-slate-500">Official bulletins will appear here when published.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <div key={a.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-[#5B21B6] border border-purple-200">
                      {a.priority || 'NORMAL'} PRIORITY
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500 font-medium">{a.targetAudience} Notice</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(a.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

