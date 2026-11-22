'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  BookOpen,
  Plus,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Sparkles,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function MentorLearningHubPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assignedStudentsCount, setAssignedStudentsCount] = useState(0);

  // Module Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewModule, setPreviewModule] = useState<any | null>(null);

  const loadLearningData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/learning/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setAssignedStudentsCount(data.assignedStudentsCount || 0);
        if (data.courses?.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load learning hub courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const openCreateModal = () => {
    setEditingModuleId(null);
    setTitle('');
    setDescription('');
    setOrderIndex((selectedCourse?.modules?.length || 0) + 1);
    setDurationMinutes(45);
    setVideoUrl('');
    setPdfUrl('');
    setNotes('');
    setStatus('PUBLISHED');
    setIsModalOpen(true);
  };

  const openEditModal = (mod: any) => {
    setEditingModuleId(mod.id);
    setTitle(mod.title);
    setDescription(mod.description);
    setOrderIndex(mod.orderIndex);
    setDurationMinutes(mod.durationMinutes || 45);
    setVideoUrl(mod.videoUrl || '');
    setPdfUrl(mod.pdfUrl || '');
    setNotes(mod.notes || '');
    setStatus(mod.status || 'PUBLISHED');
    setIsModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        courseId: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        orderIndex,
        durationMinutes,
        videoUrl: videoUrl.trim() || null,
        pdfUrl: pdfUrl.trim() || null,
        notes: notes.trim() || null,
        status,
      };

      let res;
      if (editingModuleId) {
        res = await fetch(`/api/mentor/learning/modules/${editingModuleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/mentor/learning/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        await loadLearningData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save module');
      }
    } catch {
      alert('Error saving learning module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete module "${name}"?`)) return;
    try {
      const res = await fetch(`/api/mentor/learning/modules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadLearningData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete module');
      }
    } catch {
      alert('Error deleting module');
    }
  };

  const handleToggleStatus = async (mod: any) => {
    const newStatus = mod.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/mentor/learning/modules/${mod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadLearningData();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning Hub</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Curriculum Authoring
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage assigned technical tracks, author lessons, upload video lectures &amp; PDF resources, and publish curriculum to fellows.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Learning Module
          </button>
        </div>

        {/* Course Track Selector Tabs */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading authorized curriculum courses...</div>
        ) : courses.length === 0 ? (
          <div className="ivr-card p-8 bg-white text-center text-xs text-slate-400">
            No courses assigned to your faculty profile yet.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedCourse?.id === c.id
                      ? 'bg-[#5B21B6] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{c.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCourse?.id === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.modules?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Course Summary Banner */}
            {selectedCourse && (
              <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-purple-200 uppercase tracking-wider">
                      {selectedCourse.domain}
                    </span>
                    <span className="text-xs text-purple-300">
                      {selectedCourse.durationWeeks} Weeks • {selectedCourse.level} Level
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                  <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-purple-300 uppercase font-bold">Total Lessons</div>
                    <div className="text-lg font-black">{selectedCourse.modules?.length || 0} Modules</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-right">
                    <div className="text-[10px] text-purple-300 uppercase font-bold">Fellows Enrolled</div>
                    <div className="text-lg font-black">{selectedCourse._count?.students || assignedStudentsCount} Fellows</div>
                  </div>
                </div>
              </div>
            )}

            {/* Modules List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Curriculum Modules &amp; Lessons ({selectedCourse?.modules?.length || 0})
                </h3>
                <span className="text-xs text-slate-400">
                  Drag or use order index to organize the learning journey
                </span>
              </div>

              {selectedCourse?.modules?.length === 0 ? (
                <div className="ivr-card p-12 bg-white text-center space-y-3">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">No lessons created in this course yet.</p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Module
                  </button>
                </div>
              ) : (
                selectedCourse?.modules?.map((m: any, idx: number) => (
                  <div
                    key={m.id}
                    className="ivr-card p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5B21B6] font-mono font-black text-xs flex items-center justify-center shrink-0 border border-purple-100">
                        {m.orderIndex || idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{m.title}</h4>
                          <Badge variant={m.status === 'PUBLISHED' ? 'success' : 'default'}>
                            {m.status || 'PUBLISHED'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.description}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {m.durationMinutes || 45} mins
                          </span>
                          {m.videoUrl && (
                            <span className="flex items-center gap-1 text-purple-700 font-semibold">
                              <Video className="w-3 h-3" />
                              Video Lecture Attached
                            </span>
                          )}
                          {m.pdfUrl && (
                            <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                              <FileText className="w-3 h-3" />
                              PDF Resource
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                          m.status === 'PUBLISHED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {m.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewModule(m)}
                        className="p-1.5 text-slate-600 hover:text-[#5B21B6] hover:bg-purple-50 rounded-lg border border-slate-200"
                        title="Preview Lesson"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-slate-600 hover:text-[#5B21B6] hover:bg-purple-50 rounded-lg border border-slate-200"
                        title="Edit Module"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteModule(m.id, m.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Module Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModuleId ? 'Edit Curriculum Module' : 'Create New Learning Module'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-800 font-bold mb-1">Module / Lesson Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Masterclass: Advanced State Management & Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Module Description &amp; Objectives *</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the concepts covered, learning goals, and key deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Order Sequence *</label>
              <input
                type="number"
                min={1}
                required
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Video Lecture URL (YouTube / Embed)</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">PDF / Slide Resource URL</label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or /docs/module.pdf"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Learning Notes / Code Snippets (Optional)</label>
            <textarea
              rows={2}
              placeholder="Important notes, reference links, repository URLs, or tips for fellows..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Publication Status</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="text-[#5B21B6] focus:ring-[#7C3AED]"
                />
                <span className="font-semibold text-slate-800">Publish Immediately (Visible to Fellows)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="text-[#5B21B6] focus:ring-[#7C3AED]"
                />
                <span className="font-semibold text-slate-600">Save as Draft (Private)</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {submitting ? 'Saving...' : editingModuleId ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewModule && (
        <Modal
          isOpen={!!previewModule}
          onClose={() => setPreviewModule(null)}
          title={`Fellow View: ${previewModule.title}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={previewModule.status === 'PUBLISHED' ? 'success' : 'default'}>
                  {previewModule.status}
                </Badge>
                <span className="text-slate-500 font-semibold">{previewModule.durationMinutes} mins estimated</span>
              </div>
              <p className="text-slate-700 leading-relaxed mt-1">{previewModule.description}</p>
            </div>

            {previewModule.videoUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <Video className="w-4 h-4 text-[#5B21B6]" />
                  <span>Video Lecture</span>
                </div>
                <a
                  href={previewModule.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ivr-primary text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Video Lecture
                </a>
              </div>
            )}

            {previewModule.pdfUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <FileText className="w-4 h-4 text-indigo-700" />
                  <span>Curriculum Documentation / Slides</span>
                </div>
                <a
                  href={previewModule.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ivr-secondary text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View PDF Resource
                </a>
              </div>
            )}

            {previewModule.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-800">Faculty Notes &amp; Key References:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{previewModule.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

