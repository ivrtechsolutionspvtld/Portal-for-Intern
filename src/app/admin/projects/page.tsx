'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import { FolderGit2, Plus, Clock, ExternalLink, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    domain: DOMAINS[0].name,
    description: '',
    requirements: '',
    deadline: '',
    maxScore: '100',
    batchId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/batches'),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: '',
          domain: DOMAINS[0].name,
          description: '',
          requirements: '',
          deadline: '',
          maxScore: '100',
          batchId: '',
        });
        loadData();
      } else {
        alert('Failed to create project');
      }
    } catch {
      alert('Error creating project');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Milestones & Capstones</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define production deliverables, track submission compliance, and review mentor evaluations.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Milestone Project
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading project deliverables...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No projects created yet.</div>
          ) : (
            projects.map((proj) => (
              <div key={proj.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {proj.domain}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Cohort: {proj.batch?.name || 'All Batches'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{proj.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Deadline: {new Date(proj.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                {proj.requirements && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Milestone Requirements:</span>
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 text-[11px] leading-relaxed">
                      {proj.requirements}
                    </pre>
                  </div>
                )}

                {/* Submissions Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Submissions ({proj.submissions.length})
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-600 font-semibold">{proj.approvedCount} Approved</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-600 font-semibold">{proj.pendingReviewCount} In Review</span>
                    </div>
                  </div>

                  {proj.submissions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 italic">No submissions logged yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {proj.submissions.map((sub: any) => (
                        <div key={sub.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400">{sub.studentEmail}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <a
                              href={sub.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-[#6D28D9] hover:underline flex items-center gap-1"
                            >
                              GitHub Repo <ExternalLink className="w-3 h-3" />
                            </a>

                            <Badge
                              variant={
                                sub.status === 'APPROVED'
                                  ? 'success'
                                  : sub.status === 'REVISION_REQUESTED'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {sub.status} {sub.score !== null && `(${sub.score}/100)`}
                            </Badge>

                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="p-1 text-slate-400 hover:text-slate-800"
                              title="View Mentor Feedback"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Milestone Deliverable">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Milestone Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Capstone 2: Distributed Message Queue & WebSockets"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domain Track</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cohort Batch</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">All Batches in Domain</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Rubric Score</label>
              <input
                type="number"
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Overview & Objectives</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Technical Requirements</label>
            <textarea
              rows={3}
              placeholder="1. Modular architecture\n2. 80%+ test coverage\n3. Docker containerization..."
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
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
              Publish Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Submission Feedback Inspection Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={`Submission: ${selectedSubmission.studentName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="font-bold text-slate-900 block">Repository Link:</span>
              <a
                href={selectedSubmission.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#6D28D9] hover:underline break-all"
              >
                {selectedSubmission.repoUrl}
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block font-semibold">Evaluation Status:</span>
                <span className="font-bold text-slate-800">{selectedSubmission.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Rubric Score:</span>
                <span className="font-bold text-slate-800">{selectedSubmission.score || 'Not Graded'}/100</span>
              </div>
            </div>

            {selectedSubmission.mentorFeedback && (
              <div>
                <span className="text-slate-400 block font-semibold mb-1">Mentor Feedback Notes:</span>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-100">
                  "{selectedSubmission.mentorFeedback}"
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
