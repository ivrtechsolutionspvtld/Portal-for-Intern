'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import {
  CalendarCheck,
  Users,
  QrCode,
  FolderGit2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function MentorBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      setLoading(true);
      try {
        const res = await fetch('/api/mentor/overview');
        if (res.ok) {
          const json = await res.json();
          setBatches(json.batches || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Assigned Batches &amp; Cohorts</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Cohort Administration
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Batches officially assigned to your faculty mentorship. Launch QR attendance sessions and review cohort milestones.
            </p>
          </div>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading assigned batches...</div>
          ) : batches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
              No specific cohort batches assigned yet. You can still manage individual fellows assigned to you under &quot;Assigned Students&quot;.
            </div>
          ) : (
            batches.map((b) => (
              <div
                key={b.id}
                className="ivr-card p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-4 shadow-2xs hover:border-purple-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-[#5B21B6] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                      {b.domain}
                    </span>
                    <Badge variant={b.status === 'ACTIVE' ? 'success' : 'default'}>
                      {b.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                  <div className="text-xs text-slate-500 space-y-1 mt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/mentor/attendance?batchId=${b.id}`}
                    className="btn-ivr-primary flex-1 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Launch QR
                  </Link>
                  <Link
                    href="/mentor/projects"
                    className="btn-ivr-secondary text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    Tasks
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

