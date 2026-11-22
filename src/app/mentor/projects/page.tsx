'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  FolderGit2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Eye,
  Plus,
  Clock,
  Search,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  Calendar,
  Award,
} from 'lucide-react';

export default function MentorProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'assignments' | 'capstone'>('all');
  const [search, setSearch] = useState('');

  // Create / Edit Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'ASSIGNMENT' | 'CAPSTONE_PROJECT' | 'MILESTONE_PROJECT'>('ASSIGNMENT');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskRequirements, setTaskRequirements] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskMaxScore, setTaskMaxScore] = useState(100);
  const [taskPassScore, setTaskPassScore] = useState(60);
  const [taskBatchId, setTaskBatchId] = useState('');
  const [taskInstructionsUrl, setTaskInstructionsUrl] = useState('');
  const [taskStatus, setTaskStatus] = useState('PUBLISHED');
  const [savingTask, setSavingTask] = useState(false);

  // Grading Modal
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [score, setScore] = useState('85');
  const [evalStatus, setEvalStatus] = useState('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/projects');
      if (res.ok) {
        const json = await res.json();
        setProjects(json.projects || []);
        setBatches(json.batches || []);
      }
    } catch (err) {
      console.error('Failed to load mentor projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim() || !taskDeadline) return;
    setSavingTask(true);
    try {
      const res = await fetch('/api/mentor/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          type: taskType,
          description: taskDesc.trim(),
          requirements: taskRequirements.trim(),
          deadline: taskDeadline,
          maxScore: taskMaxScore,
          passingScore: taskPassScore,
          batchId: taskBatchId || null,
          instructionsUrl: taskInstructionsUrl ? taskInstructionsUrl.trim() : null,
          status: taskStatus,
        }),
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskRequirements('');
        setTaskDeadline('');
        setTaskInstructionsUrl('');
        await loadProjects();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create task');
      }
    } catch {
      alert('Error creating task');
    } finally {
      setSavingTask(false);
    }
  };

  const openGradingModal = (sub: any, projectTitle: string) => {
    setActiveSubmission({ ...sub, projectTitle });
    setScore(sub.score ? String(sub.score) : '85');
    setEvalStatus(sub.status === 'SUBMITTED' || sub.status === 'RESUBMITTED' ? 'APPROVED' : sub.status);
    setFeedback(sub.mentorFeedback || '');
    setIsGradeOpen(true);
  };

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
          status: evalStatus,
          mentorFeedback: feedback,
        }),
      });
      if (res.ok) {
        setIsGradeOpen(false);
        setActiveSubmission(null);
        await loadProjects();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save evaluation.');
      }
    } catch {
      alert('Error saving evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten submissions across projects for review queue
  const allSubmissions = projects.flatMap((p) =>
    p.submissions.map((s: any) => ({
      ...s,
      projectTitle: p.title,
      projectType: p.type,
      maxScore: p.maxScore,
    }))
  );

  const pendingSubmissions = allSubmissions.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW' || s.status === 'RESUBMITTED'
  );

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'assignments') return matchSearch && p.type === 'ASSIGNMENT';
    if (activeTab === 'capstone') return matchSearch && p.type !== 'ASSIGNMENT';
    return matchSearch;
  });

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Assignments &amp; Project Reviews
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Evaluation Center
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Create practical milestone assignments, inspect code repository deliverables, provide structured feedback, and award marks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Assignment / Task
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="ivr-card p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Tasks Created</span>
            <p className="text-xl font-black text-slate-900 mt-1">{projects.length}</p>
          </div>
          <div className="ivr-card p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-amber-700">Pending Evaluation</span>
            <p className="text-xl font-black text-amber-900 mt-1">{pendingSubmissions.length}</p>
          </div>
          <div className="ivr-card p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Approved Submissions</span>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {allSubmissions.filter((s) => s.status === 'APPROVED').length}
            </p>
          </div>
          <div className="ivr-card p-4 bg-purple-50/50 border border-purple-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-[#5B21B6]">Revisions Requested</span>
            <p className="text-xl font-black text-[#5B21B6] mt-1">
              {allSubmissions.filter((s) => s.status === 'REVISION_REQUIRED' || s.status === 'REVISION_REQUESTED').length}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-[#5B21B6] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Tasks ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Review Queue</span>
            {pendingSubmissions.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'pending' ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingSubmissions.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'assignments'
                ? 'bg-[#5B21B6] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Milestone Assignments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capstone')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'capstone'
                ? 'bg-[#5B21B6] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Capstone Projects
          </button>
        </div>

        {/* TAB: REVIEW QUEUE (PENDING SUBMISSIONS) */}
        {activeTab === 'pending' ? (
          <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Deliverables Awaiting Your Review</h3>
              <span className="text-xs text-slate-400 font-semibold">{pendingSubmissions.length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fellow</th>
                    <th className="py-3 px-4">Task Deliverable</th>
                    <th className="py-3 px-4">Submitted Links</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No deliverables pending review. Great job!
                      </td>
                    </tr>
                  ) : (
                    pendingSubmissions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-purple-50/20">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{sub.studentEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{sub.projectTitle}</span>
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                            {sub.projectType}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {sub.repoUrl && (
                            <a
                              href={sub.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#6D28D9] font-bold hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              GitHub Repo
                            </a>
                          )}
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Live Preview
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={sub.status === 'RESUBMITTED' ? 'warning' : 'info'}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openGradingModal(sub, sub.projectTitle)}
                            className="btn-ivr-primary text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB: TASKS LIST */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading tasks...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400">
                  No tasks found matching criteria.
                </div>
              ) : (
                filteredProjects.map((p) => (
                  <div key={p.id} className="ivr-card p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase">
                        {p.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === 'PUBLISHED' ? 'success' : 'default'}>
                          {p.status}
                        </Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">{p.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-700">Deliverable Requirements:</div>
                      <p className="text-slate-600 line-clamp-2">{p.requirements}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-500 font-semibold">
                        Submissions: <strong className="text-slate-900">{p.totalSubmissions}</strong> (
                        <span className="text-amber-600 font-bold">{p.pendingCount} pending</span>,{' '}
                        <span className="text-emerald-600 font-bold">{p.approvedCount} approved</span>)
                      </div>

                      <div className="font-mono text-purple-700 font-bold">
                        Max Score: {p.maxScore}
                      </div>
                    </div>

                    {/* Submissions drawer inside card */}
                    {p.submissions?.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-700">Fellow Submissions:</div>
                        {p.submissions.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{sub.studentName}</span>
                              <span className="text-slate-400 text-[10px] ml-2">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  sub.status === 'APPROVED'
                                    ? 'success'
                                    : sub.status === 'REVISION_REQUIRED'
                                    ? 'warning'
                                    : 'info'
                                }
                              >
                                {sub.status} {sub.score !== null ? `(${sub.score}/${p.maxScore})` : ''}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => openGradingModal(sub, p.title)}
                                className="text-[#5B21B6] hover:underline font-bold text-[11px]"
                              >
                                Grade
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Milestone Assignment or Project"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-800 font-bold mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Milestone 2: Microservices Authentication & Session Security"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Task Type *</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED] bg-white"
              >
                <option value="ASSIGNMENT">Milestone Assignment</option>
                <option value="CAPSTONE_PROJECT">Capstone Project</option>
                <option value="MILESTONE_PROJECT">Practical Lab Deliverable</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Target Cohort / Batch</label>
              <select
                value={taskBatchId}
                onChange={(e) => setTaskBatchId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED] bg-white"
              >
                <option value="">All Fellows in My Domain Track</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.domain})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Description &amp; Objectives *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide context and explain the scenario or problem statement..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Deliverable Requirements *</label>
            <textarea
              required
              rows={2}
              placeholder="List required deliverables (e.g. GitHub Repository with CI pipeline, Live Demo URL, Architecture diagram)..."
              value={taskRequirements}
              onChange={(e) => setTaskRequirements(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Submission Deadline *</label>
              <input
                type="date"
                required
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Max Score</label>
              <input
                type="number"
                min={10}
                max={100}
                value={taskMaxScore}
                onChange={(e) => setTaskMaxScore(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Passing Score</label>
              <input
                type="number"
                min={10}
                max={100}
                value={taskPassScore}
                onChange={(e) => setTaskPassScore(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTask || !taskTitle.trim() || !taskDeadline}
              className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savingTask ? 'Publishing...' : 'Publish Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Evaluation / Grading Modal */}
      {activeSubmission && (
        <Modal
          isOpen={isGradeOpen}
          onClose={() => setIsGradeOpen(false)}
          title={`Evaluate Deliverable: ${activeSubmission.studentName}`}
        >
          <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900">{activeSubmission.projectTitle}</div>
              <div className="flex items-center gap-4 text-slate-600 pt-1">
                {activeSubmission.repoUrl && (
                  <a
                    href={activeSubmission.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6D28D9] font-bold underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Inspect GitHub Repo
                  </a>
                )}
                {activeSubmission.liveUrl && (
                  <a
                    href={activeSubmission.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-bold underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Live Deployment
                  </a>
                )}
              </div>
              {activeSubmission.notes && (
                <div className="text-slate-500 mt-1">
                  <strong>Student Notes:</strong> {activeSubmission.notes}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Score (out of {activeSubmission.maxScore || 100})</label>
                <input
                  type="number"
                  min={0}
                  max={activeSubmission.maxScore || 100}
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Evaluation Status</label>
                <select
                  value={evalStatus}
                  onChange={(e) => setEvalStatus(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED] bg-white font-semibold"
                >
                  <option value="APPROVED">APPROVED (Satisfactory)</option>
                  <option value="REVISION_REQUIRED">REVISION REQUIRED (Corrections Needed)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (In Progress)</option>
                  <option value="REJECTED">REJECTED (Does Not Meet Standard)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Faculty Feedback &amp; Rubric Remarks *</label>
              <textarea
                required
                rows={3}
                placeholder="Detail technical strengths, code quality assessment, and areas for improvement..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGradeOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Saving...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
