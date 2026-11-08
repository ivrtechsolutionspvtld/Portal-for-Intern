'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  UserCheck,
  Users,
  Search,
  Filter,
  ArrowRightLeft,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  RefreshCw,
  Clock,
  BookOpen,
} from 'lucide-react';

export default function AdminMentorAllocationPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState('ALL');

  // Reassignment Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [targetMentorId, setTargetMentorId] = useState('');
  const [targetCourseId, setTargetCourseId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/allocation');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setMentors(data.mentors || []);
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: selectedStudent.id,
          newMentorId: targetMentorId || undefined,
          newCourseId: targetCourseId || undefined,
          reason: reassignReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Failed to reassign');
      } else {
        showNotification('success', data.message || 'Mentor successfully reassigned!');
        setIsReassignOpen(false);
        setSelectedStudent(null);
        setTargetMentorId('');
        setTargetCourseId('');
        setReassignReason('');
        loadAllocations();
      }
    } catch {
      showNotification('error', 'Network error while executing reassignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReassignModal = (student: any) => {
    setSelectedStudent(student);
    setTargetMentorId(student.mentorId || '');
    setTargetCourseId(student.courseId || '');
    setReassignReason('');
    setIsReassignOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch = s.user?.name?.toLowerCase().includes(q);
    const emailMatch = s.user?.email?.toLowerCase().includes(q);
    const idMatch = s.studentId?.toLowerCase().includes(q);
    const mentorMatch = s.mentor?.user?.name?.toLowerCase().includes(q);
    const courseMatch = s.course?.title?.toLowerCase().includes(q) || s.domain?.toLowerCase().includes(q);

    const matchesSearch = !search || nameMatch || emailMatch || idMatch || mentorMatch || courseMatch;
    const matchesCourse = selectedCourseFilter === 'ALL' || s.courseId === selectedCourseFilter;
    const matchesMentor = selectedMentorFilter === 'ALL' || s.mentorId === selectedMentorFilter;

    return matchesSearch && matchesCourse && matchesMentor;
  });

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase tracking-widest">
                Faculty Governance
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Allocation Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators maintain complete authority over student course enrollment and mentor workload balancing.
            </p>
          </div>

          <button
            onClick={loadAllocations}
            className="p-2 text-slate-600 hover:text-[#7C3AED] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh allocations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7C3AED]' : ''}`} />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Mentor Workload Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mentors.slice(0, 4).map((m) => {
            const studentCount = m._count?.assignedStudents || 0;
            const maxStudents = m.maxStudents || 30;
            const pct = Math.min(Math.round((studentCount / maxStudents) * 100), 100);
            return (
              <div key={m.id} className="ivr-card p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{m.user?.name}</span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    {studentCount}/{maxStudents}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{m.designation} • {m.department}</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${pct > 80 ? 'bg-amber-500' : 'bg-[#7C3AED]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email, ID, course, or mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs w-full border-none focus:outline-none focus:ring-0 text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="text-xs p-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <select
              value={selectedMentorFilter}
              onChange={(e) => setSelectedMentorFilter(e.target.value)}
              className="text-xs p-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="ALL">All Mentors</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.user?.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Assigned Course Track</th>
                  <th className="p-3.5">Assigned Mentor</th>
                  <th className="p-3.5">Duration / Period</th>
                  <th className="p-3.5">Allocated By</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Loading allocation roster...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No student allocations match criteria.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {s.user?.name}
                              {s.user?.isDemo && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-purple-700">{s.studentId || 'Pending'}</div>
                            <div className="text-[11px] text-slate-400">{s.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {s.course?.title || s.domain || 'Unassigned'}
                        </span>
                        {s.course?.code && (
                          <span className="text-[10px] font-mono text-slate-400">{s.course.code}</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {s.mentor ? (
                          <div>
                            <span className="font-bold text-[#5B21B6] block">{s.mentor.user?.name}</span>
                            <span className="text-[11px] text-slate-500">{s.mentor.designation}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            Awaiting Allocation
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-600">
                        <div>{s.duration || '60 Days'}</div>
                        {s.startDate && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(s.startDate).toLocaleDateString()} - {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-500">
                        {s.allocatedBy ? (
                          <div>
                            <div className="font-medium text-slate-700 truncate max-w-[120px]">{s.allocatedBy}</div>
                            {s.allocatedAt && (
                              <div className="text-[10px] text-slate-400">{new Date(s.allocatedAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">System Provisioned</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openReassignModal(s)}
                          className="btn-ivr-secondary text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-2xs hover:border-[#7C3AED]"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-[#7C3AED]" />
                          Reassign
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

      {/* Reassignment Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          title={`Administrative Reallocation: ${selectedStudent.user?.name}`}
        >
          <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 leading-relaxed">
              <span className="font-bold">Audit Policy:</span> Any modification to a student&apos;s allocated course track or assigned mentor is permanently logged in the enterprise audit trail and immediately updates student access permissions.
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Student ID</span>
                <span className="font-mono text-slate-900 font-bold">{selectedStudent.studentId}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Current Course</span>
                <span className="text-slate-900 font-semibold">{selectedStudent.course?.title || selectedStudent.domain}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Current Mentor</span>
                <span className="text-purple-700 font-bold">{selectedStudent.mentor?.user?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Internship Period</span>
                <span className="text-slate-700">{selectedStudent.duration || '60 Days'}</span>
              </div>
            </div>

            {/* Target Mentor Selection */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Assign / Reassign Faculty Mentor *
              </label>
              <select
                required
                value={targetMentorId}
                onChange={(e) => setTargetMentorId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
              >
                <option value="">-- Choose New Faculty Mentor --</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user?.name} ({m.designation} • {m._count?.assignedStudents || 0}/{m.maxStudents || 30} Students)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Course Selection */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Change Internship Course Track (Optional)
              </label>
              <select
                value={targetCourseId}
                onChange={(e) => setTargetCourseId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
              >
                <option value="">-- Keep Current Course Track --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code} • {c.durationWeeks} Weeks)
                  </option>
                ))}
              </select>
            </div>

            {/* Reassignment Reason */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">Administrative Reason / Remarks *</label>
              <textarea
                required
                rows={2}
                placeholder="Reason for mentor transfer or cohort re-balancing..."
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !targetMentorId || !reassignReason.trim()}
                className="btn-ivr-primary px-5 py-2 rounded-lg font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

