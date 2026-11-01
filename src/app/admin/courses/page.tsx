'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import { BookOpen, Plus, Video, FileText, Clock, ExternalLink } from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [courseForm, setCourseForm] = useState({
    title: '',
    domain: DOMAINS[0].name,
    description: '',
    durationWeeks: '8',
    level: 'Advanced',
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    orderIndex: '1',
    durationMinutes: '60',
    videoUrl: '',
    pdfUrl: '',
    notes: '',
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_COURSE', ...courseForm }),
      });
      if (res.ok) {
        setIsCourseModalOpen(false);
        loadCourses();
      }
    } catch {
      alert('Error creating course');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_MODULE', courseId: selectedCourseId, ...moduleForm }),
      });
      if (res.ok) {
        setIsModuleModalOpen(false);
        setModuleForm({
          title: '',
          description: '',
          orderIndex: '1',
          durationMinutes: '60',
          videoUrl: '',
          pdfUrl: '',
          notes: '',
        });
        loadCourses();
      }
    } catch {
      alert('Error adding module');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum & Course LMS</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize syllabus modules, attach reference PDFs, video lectures, and track completion telemetry.
            </p>
          </div>

          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Track Curriculum
          </button>
        </div>

        {/* Courses & Modules Accordion / List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading course catalog...</div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No courses defined yet.</div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#5B21B6] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                        {course.domain}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {course.durationWeeks} Weeks • {course.level}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{course.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setModuleForm((prev) => ({ ...prev, orderIndex: String(course.modules.length + 1) }));
                      setIsModuleModalOpen(true);
                    }}
                    className="btn-ivr-secondary text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 self-start sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Module
                  </button>
                </div>

                {/* Modules list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Modules & Learning Assets ({course.modules.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.modules.map((m: any) => (
                      <div key={m.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">{m.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {m.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>

                        <div className="flex items-center gap-3 pt-2 text-[11px]">
                          {m.videoUrl && (
                            <span className="text-[#6D28D9] font-medium flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video Lecture
                            </span>
                          )}
                          {m.pdfUrl && (
                            <span className="text-[#6D28D9] font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              PDF Notes
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Create New Course Track">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Domain</label>
            <select
              value={courseForm.domain}
              onChange={(e) => setCourseForm({ ...courseForm, domain: e.target.value })}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
              Save Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Module Modal */}
      <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title="Add Module to Course">
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Module Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Module 5: Distributed Caching & Redis Pipelines"
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Module Summary</label>
            <textarea
              rows={2}
              required
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Index</label>
              <input
                type="number"
                value={moduleForm.orderIndex}
                onChange={(e) => setModuleForm({ ...moduleForm, orderIndex: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={moduleForm.durationMinutes}
                onChange={(e) => setModuleForm({ ...moduleForm, durationMinutes: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Video Lecture Embed / Stream URL</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/embed/... or cloudfront url"
              value={moduleForm.videoUrl}
              onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PDF Syllabus / Resource Document URL</label>
            <input
              type="url"
              placeholder="https://storage.ivrenterprise.com/curriculum/..."
              value={moduleForm.pdfUrl}
              onChange={(e) => setModuleForm({ ...moduleForm, pdfUrl: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModuleModalOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
              Add Module
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
