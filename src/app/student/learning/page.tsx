'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, Video, FileText, CheckCircle2, Clock, Check, Loader2, Sparkles, ExternalLink } from 'lucide-react';

export default function StudentLearningPage() {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/materials');
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setModules(data.modules || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const toggleComplete = async (moduleId: string, currentlyCompleted: boolean) => {
    setUpdatingId(moduleId);
    try {
      const res = await fetch('/api/student/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, completed: !currentlyCompleted }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, isCompleted: !currentlyCompleted } : m
          )
        );
        // Refresh stats
        const updatedCompleted = !currentlyCompleted
          ? (stats?.completedModules || 0) + 1
          : (stats?.completedModules || 1) - 1;
        setStats((prev: any) => ({
          ...prev,
          completedModules: updatedCompleted,
          percentage: Math.round((updatedCompleted / (prev?.totalModules || 1)) * 100),
        }));
      }
    } catch {
      alert('Error updating completion progress');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header with Progress bar */}
        <div className="ivr-card p-6 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#5B21B6] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                {course?.domain || 'Full-Stack Web Development'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {course?.durationWeeks || 8} Weeks • {course?.level || 'Advanced'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {course?.title || 'Enterprise Curriculum Modules'}
            </h1>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Curriculum Progress</span>
              <span className="text-[#6D28D9]">{stats?.percentage || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4C1D95] to-[#7C3AED] rounded-full transition-all duration-300"
                style={{ width: `${stats?.percentage || 0}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block text-right">
              {stats?.completedModules || 0} of {stats?.totalModules || 4} modules mastered
            </span>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading learning modules...</div>
          ) : modules.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No modules uploaded yet.</div>
          ) : (
            modules.map((m) => (
              <div
                key={m.id}
                className={`ivr-card p-6 bg-white border rounded-xl transition-all ${
                  m.isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(m.id, m.isCompleted)}
                      disabled={updatingId === m.id}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        m.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 hover:border-[#6D28D9] text-transparent hover:text-slate-400'
                      }`}
                      title={m.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {updatingId === m.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Estimated Study Time: {m.durationMinutes} Minutes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.isCompleted ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>

                  {m.notes && (
                    <div className="p-3 bg-purple-50/50 rounded-lg text-xs border border-purple-100 text-slate-700">
                      <span className="font-bold text-[#5B21B6] block mb-0.5">Faculty Study Notes:</span>
                      {m.notes}
                    </div>
                  )}

                  {/* Resource Links */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                    {m.videoUrl && (
                      <a
                        href={m.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ivr-secondary px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-[#5B21B6]"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Watch Video Lecture
                      </a>
                    )}

                    {m.pdfUrl && (
                      <a
                        href={m.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ivr-secondary px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-[#5B21B6]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download PDF Syllabus & Notes
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
