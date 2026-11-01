'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { FolderGit2, ExternalLink, CheckCircle2, AlertTriangle, Edit3, Eye, Loader2 } from 'lucide-react';

export default function MentorProjectsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Grading Modal
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [score, setScore] = useState('90');
  const [status, setStatus] = useState('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mentor/submissions/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          score: parseInt(score, 10),
          status,
          mentorFeedback: feedback,
        }),
      });
      if (res.ok) {
        alert('Evaluation and rubric score saved! Fellow notified.');
        setIsGradeOpen(false);
        loadData();
      } else {
        alert('Failed to save evaluation.');
      }
    } catch {
      alert('Error saving evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Capstone & Deliverable Reviews</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect submitted GitHub repositories, perform architectural evaluations, and assign rubric scores.
            </p>
          </div>
        </div>

        {/* Submissions Table / Queue */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Fellow Deliverables Queue</h3>
            <span className="text-xs text-slate-400 font-semibold">
              {data?.pendingSubmissions?.length || 0} Awaiting Evaluation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fellow</th>
                  <th className="py-3 px-4">Milestone Deliverable</th>
                  <th className="py-3 px-4">Repository & Live URL</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading deliverables...</td>
                  </tr>
                ) : data?.pendingSubmissions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      All submissions have been reviewed and approved!
                    </td>
                  </tr>
                ) : (
                  data?.pendingSubmissions?.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sub.student.user.name}</div>
                        <div className="text-[11px] text-slate-400">{sub.student.user.email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#5B21B6]">{sub.project.title}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 font-mono text-[11px]">
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#6D28D9] hover:underline flex items-center gap-1 font-semibold"
                          >
                            GitHub Repo <ExternalLink className="w-3 h-3" />
                          </a>
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              Live App <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="warning">{sub.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveSubmission(sub);
                            setScore(sub.score ? String(sub.score) : '90');
                            setStatus(sub.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
                            setFeedback(sub.mentorFeedback || '');
                            setIsGradeOpen(true);
                          }}
                          className="btn-ivr-primary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Evaluate Rubric
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

      {/* Rubric Evaluation Modal */}
      {activeSubmission && (
        <Modal
          isOpen={isGradeOpen}
          onClose={() => setIsGradeOpen(false)}
          title={`Grade: ${activeSubmission.student.user.name} - ${activeSubmission.project.title}`}
        >
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-1">
              <div>
                <strong>Repository:</strong>{' '}
                <a
                  href={activeSubmission.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#6D28D9] font-mono hover:underline"
                >
                  {activeSubmission.repoUrl}
                </a>
              </div>
              {activeSubmission.notes && (
                <div className="text-slate-600">
                  <strong>Candidate Notes:</strong> {activeSubmission.notes}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rubric Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evaluation Decision</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="APPROVED">APPROVED (Passed Milestone)</option>
                  <option value="REVISION_REQUESTED">REVISION REQUESTED (Corrections Needed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Technical Feedback & Critique</label>
              <textarea
                rows={4}
                required
                placeholder="Detail code structure, database performance, test cases, and suggested architectural refactors..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGradeOpen(false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Recording Grade...
                  </>
                ) : (
                  'Commit Evaluation & Notify Fellow'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
