'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Globe,
  FileText,
  UploadCloud,
  Send,
  Star,
  MessageSquare,
  Award,
} from 'lucide-react';

interface Submission {
  id: string;
  repoUrl: string;
  liveUrl?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  score?: number | null;
  mentorFeedback?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
}

interface Project {
  id: string;
  title: string;
  domain: string;
  description: string;
  requirements?: string | null;
  deadline: string;
  maxScore: number;
  isOverdue: boolean;
  submission: Submission | null;
}

export default function StudentProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openSubmitModal = (project: Project) => {
    setActiveProject(project);
    setErrorMsg('');
    setSuccessMsg('');
    if (project.submission) {
      setRepoUrl(project.submission.repoUrl || '');
      setLiveUrl(project.submission.liveUrl || '');
      setFileUrl(project.submission.fileUrl || '');
      setNotes(project.submission.notes || '');
    } else {
      setRepoUrl('');
      setLiveUrl('');
      setFileUrl('');
      setNotes('');
    }
    setIsSubmitModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    if (!repoUrl.trim()) {
      setErrorMsg('GitHub repository URL is mandatory');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/student/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          repoUrl,
          liveUrl,
          fileUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit project');
      }

      setSuccessMsg('Your project milestone was submitted successfully to your mentor!');
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        fetchProjects();
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalProjects = projects.length;
  const approvedCount = projects.filter((p) => p.submission?.status === 'APPROVED').length;
  const submittedCount = projects.filter(
    (p) => p.submission && p.submission.status !== 'APPROVED'
  ).length;
  const pendingCount = totalProjects - approvedCount - submittedCount;

  const totalScoreEarned = projects.reduce(
    (acc, p) => acc + (p.submission?.score || 0),
    0
  );
  const maxPossibleScore = projects.reduce((acc, p) => acc + p.maxScore, 0);

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Milestone Projects & Deliverables
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit production-grade code, track mentor reviews, and earn verification credentials.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-[#5B21B6] border border-purple-200">
              Pass Criteria: 100% Milestone Approval
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Milestones"
            value={totalProjects}
            subtext="Assigned by Academic Council"
            icon={<FolderGit2 className="w-5 h-5 text-purple-600" />}
          />
          <StatCard
            label="Approved & Scored"
            value={approvedCount}
            subtext={`${Math.round((approvedCount / (totalProjects || 1)) * 100)}% milestone progress`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            label="In Mentor Review"
            value={submittedCount}
            subtext="Awaiting rubric grading"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            label="Cumulative Score"
            value={`${totalScoreEarned} / ${maxPossibleScore}`}
            subtext="Performance weighted points"
            icon={<Star className="w-5 h-5 text-indigo-600" />}
          />
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Loading assigned projects and submissions...
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Projects Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your batch mentor will release industry milestone projects according to the curriculum schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const submission = project.submission;
              const isApproved = submission?.status === 'APPROVED';
              const isRevision = submission?.status === 'REVISION_REQUESTED';
              const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'UNDER_REVIEW';

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-purple-200 transition-all shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Project Header Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                          {project.domain}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Deadline: {new Date(project.deadline).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700">
                          Weight: {project.maxScore} pts
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {project.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {project.description}
                      </p>

                      {project.requirements && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#6D28D9]" />
                            Specification & Deliverable Requirements:
                          </div>
                          <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                            {project.requirements}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status & Action */}
                    <div className="lg:w-72 shrink-0 flex flex-col justify-between items-start lg:items-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div>
                        {isApproved ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved ({submission?.score}/{project.maxScore} pts)
                          </div>
                        ) : isRevision ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Revision Requested
                          </div>
                        ) : isSubmitted ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Under Mentor Review
                          </div>
                        ) : project.isOverdue ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Overdue - Not Submitted
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            Pending Submission
                          </div>
                        )}
                      </div>

                      <Button
                        variant={isApproved ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => openSubmitModal(project)}
                        disabled={isApproved}
                        className="w-full lg:w-auto text-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                        {isApproved
                          ? 'Milestone Completed'
                          : submission
                          ? 'Update Deliverables'
                          : 'Submit Project Work'}
                      </Button>
                    </div>
                  </div>

                  {/* Submission Details & Feedback Accordion */}
                  {submission && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Student Submitted Links */}
                      <div className="space-y-2 bg-purple-50/30 rounded-xl p-3 border border-purple-100/60">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>Your Active Submission</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#6D28D9] hover:underline font-semibold"
                          >
                            <GitBranch className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{submission.repoUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </a>

                          {submission.liveUrl && (
                            <a
                              href={submission.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-emerald-600 hover:underline font-semibold"
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{submission.liveUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                            </a>
                          )}

                          {submission.notes && (
                            <p className="text-slate-600 italic text-[11px] pt-1">
                              "{submission.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Mentor Rubric Evaluation */}
                      <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#6D28D9]" />
                            Faculty Mentor Feedback
                          </span>
                          {submission.score !== null && submission.score !== undefined && (
                            <span className="font-black text-[#5B21B6] bg-purple-100 px-2 py-0.5 rounded-md text-[11px]">
                              Score: {submission.score} / {project.maxScore}
                            </span>
                          )}
                        </div>

                        {submission.mentorFeedback ? (
                          <div className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200">
                            {submission.mentorFeedback}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            Evaluation in progress by faculty mentor. Check back shortly.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Deliverables Modal */}
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={`Submit Deliverable: ${activeProject?.title || ''}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-800" />
                GitHub / GitLab Repository URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/project-repo"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
              />
              <span className="text-[10px] text-slate-400">
                Must include clean commits, README.md architecture diagram, and test coverage.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-800" />
                Live Cloud Deployment URL (Optional)
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://project.vercel.app or AWS CloudFront URL"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-800" />
                Technical Report / Architecture PDF Link (Optional)
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Google Drive / Dropbox / S3 public link"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Submission Notes & Implementation Highlights
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe key design patterns, API integrations, and edge cases handled..."
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit for Evaluation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
