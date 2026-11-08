'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import {
  BookOpen,
  Plus,
  Video,
  FileText,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    domain: DOMAINS[0].name,
    description: '',
    department: 'Software Engineering',
    durationWeeks: '8',
    level: 'Advanced',
    status: 'ACTIVE',
    syllabus: '',
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
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (selectedDept !== 'ALL') query.set('department', selectedDept);
      if (selectedStatus !== 'ALL') query.set('status', selectedStatus);

      const res = await fetch(`/api/admin/courses?${query.toString()}`);
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
  }, [search, selectedDept, selectedStatus]);

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
        setCourseForm({
          code: '',
          title: '',
          domain: DOMAINS[0].name,
          description: '',
          department: 'Software Engineering',
          durationWeeks: '8',
          level: 'Advanced',
          status: 'ACTIVE',
          syllabus: '',
        });
        loadCourses();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create course');
      }
    } catch {
      alert('Error creating course');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedCourse(null);
        loadCourses();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update course');
      }
    } catch {
      alert('Error updating course');
    }
  };

  const handleToggleStatus = async (course: any) => {
    const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadCourses();
      }
    } catch {
      alert('Error toggling course status');
    }
  };

  const handleDeleteCourse = async (course: any) => {
    if (!confirm(`Are you sure you want to permanently delete course "${course.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadCourses();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete course');
      }
    } catch {
      alert('Error deleting course');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_MODULE', courseId: selectedCourse.id, ...moduleForm }),
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

  const openEditModal = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      code: course.code || '',
      title: course.title,
      domain: course.domain,
      description: course.description,
      department: course.department || 'Software Engineering',
      durationWeeks: String(course.durationWeeks),
      level: course.level,
      status: course.status || 'ACTIVE',
      syllabus: course.syllabus || '',
    });
    setIsEditModalOpen(true);
  };

  const departments = Array.from(new Set(courses.map((c) => c.department || 'General'))).filter(Boolean);

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase tracking-widest">
                Curriculum Governance
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course & Track Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators configure official internship courses, manage syllabi, and set active tracks for student enrollment.
            </p>
          </div>

          <button
            onClick={() => {
              setCourseForm({
                code: `IVR-CRS-${Date.now().toString(36).toUpperCase()}`,
                title: '',
                domain: DOMAINS[0].name,
                description: '',
                department: 'Software Engineering',
                durationWeeks: '8',
                level: 'Advanced',
                status: 'ACTIVE',
                syllabus: '',
              });
              setIsCourseModalOpen(true);
            }}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Internship Course
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search course title, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs w-full border-none focus:outline-none focus:ring-0 text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs p-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs p-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Tracks</option>
              <option value="INACTIVE">Inactive Tracks</option>
            </select>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading course curriculum records...</div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No internship courses match your search criteria.
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="ivr-card p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs hover:border-purple-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {course.code || 'IVR-CRS'}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {course.department || 'Software Development'}
                      </span>
                      <Badge variant={course.status === 'ACTIVE' ? 'success' : 'default'}>
                        {course.status || 'ACTIVE'}
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        {course.durationWeeks} Weeks • {course.level}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">{course.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(course)}
                      title={course.status === 'ACTIVE' ? 'Deactivate course' : 'Activate course'}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        course.status === 'ACTIVE'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => openEditModal(course)}
                      className="p-1.5 text-slate-500 hover:text-[#7C3AED] hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setModuleForm((prev) => ({ ...prev, orderIndex: String((course.modules?.length || 0) + 1) }));
                        setIsModuleModalOpen(true);
                      }}
                      className="btn-ivr-secondary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Module
                    </button>
                  </div>
                </div>

                {/* Metrics & Syllabus */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#7C3AED]" />
                    <span>Enrolled Students: <strong className="text-slate-900">{course._count?.students || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#7C3AED]" />
                    <span>Curriculum Modules: <strong className="text-slate-900">{course.modules?.length || 0}</strong></span>
                  </div>
                  {course.syllabus && (
                    <div className="text-[11px] text-slate-500 italic truncate max-w-md">
                      Syllabus: {course.syllabus.replace(/\n/g, ' • ')}
                    </div>
                  )}
                </div>

                {/* Modules list preview */}
                {course.modules && course.modules.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {course.modules.map((m: any) => (
                        <div key={m.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">
                              {m.orderIndex}. {m.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                              {m.durationMinutes}m
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Create New Internship Course Track">
        <form onSubmit={handleCreateCourse} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={courseForm.department}
                onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Stack Web Development"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value, domain: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              required
              placeholder="Comprehensive curriculum objectives and outcomes..."
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={courseForm.durationWeeks}
                onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
              <select
                value={courseForm.level}
                onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Track Status</label>
              <select
                value={courseForm.status}
                onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Syllabus Overview / Topics</label>
            <textarea
              rows={3}
              placeholder="Module 1: ...&#10;Module 2: ..."
              value={courseForm.syllabus}
              onChange={(e) => setCourseForm({ ...courseForm, syllabus: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg"
            >
              Save Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Course: ${selectedCourse?.title}`}>
        <form onSubmit={handleUpdateCourse} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={courseForm.department}
                onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value, domain: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              required
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={courseForm.durationWeeks}
                onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
              <select
                value={courseForm.level}
                onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Track Status</label>
              <select
                value={courseForm.status}
                onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Syllabus Overview / Topics</label>
            <textarea
              rows={3}
              value={courseForm.syllabus}
              onChange={(e) => setCourseForm({ ...courseForm, syllabus: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg"
            >
              Update Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Module Modal */}
      <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title={`Add Module: ${selectedCourse?.title}`}>
        <form onSubmit={handleAddModule} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Module Title *</label>
              <input
                type="text"
                required
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={moduleForm.durationMinutes}
                onChange={(e) => setModuleForm({ ...moduleForm, durationMinutes: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Module Description *</label>
            <textarea
              rows={2}
              required
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Video Resource URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={moduleForm.videoUrl}
                onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PDF Notes / Slides URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={moduleForm.pdfUrl}
                onChange={(e) => setModuleForm({ ...moduleForm, pdfUrl: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModuleModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ivr-primary text-xs font-bold px-4 py-2 rounded-lg"
            >
              Save Module
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
