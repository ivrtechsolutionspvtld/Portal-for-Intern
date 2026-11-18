'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { triggerPortalSync, usePortalSync } from '@/lib/sync';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  domain: string;
  courseId: string | null;
  duration: string;
  level: string;
  techStack: string | null;
  projects: string | null;
  stipend: string | null;
  mode: string;
  status: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    code: string | null;
    domain: string;
  } | null;
}

interface CourseOption {
  id: string;
  title: string;
  domain: string;
  code: string | null;
  department: string | null;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form State
  const initialForm = {
    title: '',
    description: '',
    courseId: '',
    domain: '',
    duration: '8 Weeks',
    level: 'Intermediate',
    techStack: '',
    projects: '',
    stipend: 'Performance Based',
    mode: 'Virtual / Remote',
    status: 'ACTIVE',
  };
  const [form, setForm] = useState(initialForm);

  const loadData = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter !== 'ALL') query.set('status', statusFilter);

      const [progRes, crsRes] = await Promise.all([
        fetch(`/api/admin/programs?${query.toString()}`, { cache: 'no-store' }),
        fetch('/api/public/domains', { cache: 'no-store' }),
      ]);

      if (progRes.ok) {
        const pData = await progRes.json();
        setPrograms(pData.programs || []);
      }
      if (crsRes.ok) {
        const cData = await crsRes.json();
        setCourses(cData.courses || []);
      }
    } catch (err) {
      console.error('Failed to load programs', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  usePortalSync(loadData, 5000);

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setForm({
      ...initialForm,
      courseId: courses[0]?.id || '',
      domain: courses[0]?.domain || courses[0]?.title || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prog: Program) => {
    setEditingProgram(prog);
    setForm({
      title: prog.title,
      description: prog.description,
      courseId: prog.courseId || '',
      domain: prog.domain,
      duration: prog.duration,
      level: prog.level,
      techStack: prog.techStack || '',
      projects: prog.projects || '',
      stipend: prog.stipend || 'Performance Based',
      mode: prog.mode || 'Virtual / Remote',
      status: prog.status,
    });
    setIsModalOpen(true);
  };

  const handleCourseChange = (selectedCourseId: string) => {
    const selected = courses.find((c) => c.id === selectedCourseId);
    setForm((prev) => ({
      ...prev,
      courseId: selectedCourseId,
      domain: selected?.domain || selected?.title || prev.domain,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      alert('Please fill out the program title and description.');
      return;
    }

    try {
      const url = editingProgram
        ? `/api/admin/programs/${editingProgram.id}`
        : '/api/admin/programs';
      const method = editingProgram ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProgram(null);
        await loadData();
        triggerPortalSync('PROGRAM_UPDATED');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save internship program');
      }
    } catch {
      alert('Error saving internship program');
    }
  };

  const handleToggleStatus = async (prog: Program) => {
    const nextStatus = prog.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/programs/${prog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadData();
        triggerPortalSync('PROGRAM_STATUS_TOGGLED');
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (prog: Program) => {
    if (!confirm(`Are you sure you want to permanently delete internship program "${prog.title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/programs/${prog.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadData();
        triggerPortalSync('PROGRAM_DELETED');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete program');
      }
    } catch {
      alert('Error deleting program');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-purple-50 text-[#6D28D9]">
                <Briefcase className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Internship Program Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Admin-exclusive authority to create, edit, activate, and manage official internship programs. Linked directly to Database Courses and Domain Tracks.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn-ivr-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Program
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs, domains, tech stack..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#6D28D9]"
            >
              <option value="ALL">All Statuses ({programs.length})</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Program Cards / List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6D28D9] border-t-transparent rounded-full mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading internship programs from database...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Internship Programs Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {search || statusFilter !== 'ALL'
                ? 'No programs matched your search filters.'
                : 'All default sample programs have been removed. Click below to create your genuine IVR Tech Solutions internship programs.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="btn-ivr-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Create First Program
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-purple-50 text-[#5B21B6] border border-purple-200">
                          {prog.duration}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {prog.level}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prog.mode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                        {prog.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(prog)}
                      className="shrink-0 cursor-pointer"
                      title="Click to toggle status"
                    >
                      <Badge variant={prog.status === 'ACTIVE' ? 'success' : 'default'}>
                        {prog.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {prog.description}
                  </p>

                  {/* Linked Course / Domain */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <BookOpen className="w-3.5 h-3.5 text-[#6D28D9]" />
                        Domain Track:
                      </span>
                      <strong className="text-slate-800">{prog.domain}</strong>
                    </div>
                    {prog.course && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Linked Course:</span>
                        <span className="text-slate-700 font-mono">
                          {prog.course.code ? `[${prog.course.code}] ` : ''}
                          {prog.course.title}
                        </span>
                      </div>
                    )}
                    {prog.stipend && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Stipend:</span>
                        <span className="text-emerald-700 font-semibold">{prog.stipend}</span>
                      </div>
                    )}
                  </div>

                  {/* Tech Stack */}
                  {prog.techStack && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Tech Stack
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prog.techStack.split(/[,;\n]/).map(
                          (t, i) =>
                            t.trim() && (
                              <span
                                key={i}
                                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-50/70 text-[#4C1D95] border border-purple-100"
                              >
                                {t.trim()}
                              </span>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Capstone Projects */}
                  {prog.projects && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Capstone Deliverables
                      </span>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {prog.projects.split(/[,;\n]/).map(
                          (p, i) =>
                            p.trim() && (
                              <div key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{p.trim()}</span>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Added {new Date(prog.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(prog)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                        prog.status === 'ACTIVE'
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {prog.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(prog)}
                      className="p-1.5 text-slate-600 hover:text-[#6D28D9] hover:bg-purple-50 rounded-md transition-colors"
                      title="Edit Program"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prog)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProgram ? 'Edit Internship Program' : 'Create New Internship Program'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Program Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Full-Stack Web Development Internship"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Linked Course (Database)
                </label>
                <select
                  value={form.courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9] focus:bg-white"
                >
                  <option value="">-- None / Standalone Program --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `[${c.code}] ` : ''}
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Domain Track Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="e.g. VLSI Design or Web Architecture"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 8 Weeks or 60 Days"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Level
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Intermediate - Advanced">Intermediate - Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
                >
                  <option value="Virtual / Remote">Virtual / Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-Premise">On-Premise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Program Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Comprehensive overview of competencies, industry skills, and expectations..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Core Technologies & Tools (Comma-separated)
              </label>
              <input
                type="text"
                value={form.techStack}
                onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                placeholder="e.g. Verilog HDL, ModelSim, FPGA, EDA Playground, Testbenches"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Capstone Projects / Deliverables (Comma-separated)
              </label>
              <input
                type="text"
                value={form.projects}
                onChange={(e) => setForm({ ...form, projects: e.target.value })}
                placeholder="e.g. 8-Bit ALU Design, FIFO Buffer Verification, UART Controller"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stipend Policy
                </label>
                <input
                  type="text"
                  value={form.stipend}
                  onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                  placeholder="e.g. Performance Based or Stipend Provided"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#6D28D9]"
                >
                  <option value="ACTIVE">ACTIVE (Visible to Students & Public)</option>
                  <option value="INACTIVE">INACTIVE (Hidden from Public)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ivr-primary px-5 py-2 rounded-lg text-xs font-bold"
              >
                {editingProgram ? 'Save Changes' : 'Create Program'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
