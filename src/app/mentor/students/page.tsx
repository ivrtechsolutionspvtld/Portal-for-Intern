'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Users,
  Search,
  Award,
  CheckCircle2,
  FileText,
  ExternalLink,
  Calendar,
  Clock,
  BookOpen,
  FolderGit2,
  HelpCircle,
  Lock,
  MessageSquare,
  Send,
  Plus,
  AlertCircle,
  Eye,
  ShieldAlert,
  Building,
  GraduationCap,
} from 'lucide-react';

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Student & 9-Tab Detail Drawer State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'attendance'
    | 'learning'
    | 'assignments'
    | 'quizzes'
    | 'projects'
    | 'notes'
    | 'chat'
  >('overview');

  // Private Note Form State
  const [newNoteText, setNewNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('ACADEMIC');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Chat Form State
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openStudentDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setDetailLoading(true);
    setDetailError(null);
    setActiveTab('overview');
    try {
      const res = await fetch(`/api/mentor/students/${studentId}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Failed to load student details');
        setStudentDetail(null);
      } else {
        setStudentDetail(data.student);
      }
    } catch (err: any) {
      setDetailError(err.message || 'Network error fetching student data');
      setStudentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedStudentId) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/mentor/students/${selectedStudentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNoteText.trim(),
          category: noteCategory,
          isPrivate: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNoteSuccess(true);
        setNewNoteText('');
        // Refresh details to show new note
        const refreshRes = await fetch(`/api/mentor/students/${selectedStudentId}`);
        if (refreshRes.ok) {
          const refData = await refreshRes.json();
          setStudentDetail(refData.student);
        }
        setTimeout(() => setNoteSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save note');
      }
    } catch {
      alert('Error saving note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !studentDetail) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: studentDetail.userId,
          content: chatMessage.trim(),
        }),
      });
      if (res.ok) {
        setChatMessage('');
        // Refresh detail conversation
        const refreshRes = await fetch(`/api/mentor/students/${selectedStudentId}`);
        if (refreshRes.ok) {
          const refData = await refreshRes.json();
          setStudentDetail(refData.student);
        }
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to send message');
      }
    } catch {
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.college.toLowerCase().includes(search.toLowerCase()) ||
      s.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Fellows</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Authorized Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Only students assigned to your faculty profile are displayed. Click any fellow to open their 360° progress drawer.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Assigned Fellows Count: <strong className="text-[#5B21B6]">{students.length}</strong>
          </div>
        </div>

        {/* Search */}
        <div className="ivr-card p-4 bg-white max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, college, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              Loading authorized student records...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              No assigned students found matching your search.
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => openStudentDetail(s.id)}
                className="ivr-card p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-[#5B21B6] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                      {s.batchName || s.domain}
                    </span>
                    <Badge variant={s.attendancePercent >= 75 ? 'success' : 'warning'}>
                      {s.attendancePercent}% Attendance
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#5B21B6] transition-colors">
                      {s.name}
                    </h3>
                    <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-2">{s.email}</p>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="truncate font-medium">{s.college}</p>
                    <p className="text-slate-500">
                      {s.department} • Grad {s.graduationYear}
                    </p>
                    {s.cgpa && <p className="text-[#5B21B6] font-semibold">CGPA: {s.cgpa}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Milestone Tasks:</span>
                    <span className="font-bold text-slate-800">
                      {s.approvedProjects} / {s.totalProjects || 1} Approved
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Credential Status:</span>
                    {s.hasCertificate ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Issued ({s.certificateNumber})
                      </span>
                    ) : s.attendancePercent >= 75 && s.approvedProjects >= 1 ? (
                      <span className="text-purple-700 font-bold">Eligible for Certification</span>
                    ) : (
                      <span className="text-amber-600 font-medium">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 9-Tab Student Detail Modal */}
      <Modal
        isOpen={!!selectedStudentId}
        onClose={() => {
          setSelectedStudentId(null);
          setStudentDetail(null);
          setDetailError(null);
        }}
        title={
          studentDetail
            ? `${studentDetail.name} — Comprehensive Fellow Profile`
            : 'Fellow Profile & Progress'
        }
        maxWidth="4xl"
      >
        {detailLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading authorized 360° student record...</span>
          </div>
        ) : detailError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-600 mx-auto" />
            <h4 className="text-sm font-bold text-red-800">Access Denied (IDOR Protection)</h4>
            <p className="text-xs text-red-600 max-w-md mx-auto">{detailError}</p>
          </div>
        ) : studentDetail ? (
          <div className="space-y-4">
            {/* Quick Hero Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{studentDetail.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-purple-100">
                    {studentDetail.studentId || 'IVR-FELLOW'}
                  </span>
                </div>
                <p className="text-xs text-purple-200 font-mono mt-0.5">{studentDetail.email}</p>
                <p className="text-xs text-purple-300 mt-1">
                  Track: <strong>{studentDetail.course?.title || studentDetail.domain}</strong> • Cohort:{' '}
                  <strong>{studentDetail.batch?.name || 'Assigned'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
                    Attendance
                  </div>
                  <div className="text-sm font-black text-white">
                    {studentDetail.attendance?.percentage || 0}%
                  </div>
                </div>
                <Badge
                  variant={studentDetail.attendance?.status === 'ELIGIBLE' ? 'success' : 'warning'}
                >
                  {studentDetail.attendance?.status === 'ELIGIBLE' ? 'Eligible' : 'At Risk'}
                </Badge>
              </div>
            </div>

            {/* 9 Tab Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none text-xs">
              {[
                { id: 'overview', label: '1. Overview' },
                { id: 'personal', label: '2. Personal Details' },
                { id: 'attendance', label: '3. Attendance' },
                { id: 'learning', label: '4. Learning' },
                { id: 'assignments', label: '5. Assignments' },
                { id: 'quizzes', label: '6. Quizzes' },
                { id: 'projects', label: '7. Projects' },
                { id: 'notes', label: '8. Notes & Feedback' },
                { id: 'chat', label: '9. Quick Chat' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 font-bold whitespace-nowrap rounded-lg transition-colors ${
                    activeTab === t.id
                      ? 'bg-purple-100 text-[#5B21B6] border-b-2 border-[#5B21B6]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Domain Track</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">{studentDetail.domain}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Duration</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">{studentDetail.duration || '8 Weeks'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Academic CGPA</span>
                    <p className="text-xs font-bold text-[#5B21B6] mt-1">{studentDetail.cgpa || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Enrollment Date</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {new Date(studentDetail.enrollmentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Institutional Profile Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">College:</span>{' '}
                      <span className="font-semibold text-slate-800">{studentDetail.personalDetails?.college}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Department:</span>{' '}
                      <span className="font-semibold text-slate-800">{studentDetail.personalDetails?.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Graduation Year:</span>{' '}
                      <span className="font-semibold text-slate-800">{studentDetail.personalDetails?.graduationYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Phone:</span>{' '}
                      <span className="font-semibold text-slate-800">{studentDetail.personalDetails?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  {studentDetail.resumeUrl && (
                    <div className="pt-2">
                      <a
                        href={studentDetail.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#6D28D9] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Student Resume / Curriculum Vitae
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PERSONAL DETAILS (READ-ONLY FOR MENTOR) */}
            {activeTab === 'personal' && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#5B21B6]" />
                    <span className="text-xs font-bold text-[#5B21B6]">
                      Protected Institutional Record (Strictly Read-Only)
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600">Admin-Managed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{studentDetail.personalDetails?.name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                    <p className="font-mono text-slate-800 mt-0.5">{studentDetail.personalDetails?.email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <p className="font-mono text-slate-800 mt-0.5">{studentDetail.personalDetails?.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Registration / Roll No</span>
                    <p className="font-mono text-slate-800 mt-0.5">{studentDetail.personalDetails?.regNumber || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">College / Institution</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{studentDetail.personalDetails?.college}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Department / Major</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{studentDetail.personalDetails?.department}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Degree Program</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{studentDetail.personalDetails?.degree || 'B.Tech'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Graduation Year</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{studentDetail.personalDetails?.graduationYear}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Days Present</span>
                    <p className="text-base font-black text-emerald-800 mt-0.5">
                      {studentDetail.attendance?.presentDays || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-red-700">Days Absent</span>
                    <p className="text-base font-black text-red-800 mt-0.5">
                      {studentDetail.attendance?.absentDays || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                    <span className="text-[10px] uppercase font-bold text-[#5B21B6]">Compliance</span>
                    <p className="text-base font-black text-[#5B21B6] mt-0.5">
                      {studentDetail.attendance?.percentage || 0}%
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Marked By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentDetail.attendance?.records?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            No attendance records recorded yet.
                          </td>
                        </tr>
                      ) : (
                        studentDetail.attendance?.records?.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-2.5 font-mono">
                              {new Date(r.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-2.5">
                              <Badge
                                variant={
                                  r.status === 'PRESENT'
                                    ? 'success'
                                    : r.status === 'LATE'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-slate-500">{r.method}</td>
                            <td className="p-2.5 text-slate-400">{r.markedBy || 'System / Auto'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: LEARNING PROGRESS */}
            {activeTab === 'learning' && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5B21B6]">Curriculum Completion Progress</span>
                  <span className="text-xs font-black text-[#5B21B6]">
                    {studentDetail.learningProgress?.completedModules || 0} /{' '}
                    {studentDetail.learningProgress?.totalModules || 0} Modules Completed (
                    {studentDetail.learningProgress?.percentage || 0}%)
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {studentDetail.learningProgress?.modules?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No learning module progress recorded yet.
                    </div>
                  ) : (
                    studentDetail.learningProgress?.modules?.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-semibold text-slate-800">{m.module.title}</span>
                        </div>
                        <div className="text-slate-400">
                          {m.completedAt ? (
                            <span className="text-emerald-700 font-bold">
                              Completed on {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Pending</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: ASSIGNMENTS */}
            {activeTab === 'assignments' && (
              <div className="space-y-3 py-2">
                {studentDetail.assignments?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No assignment submissions submitted yet.
                  </div>
                ) : (
                  studentDetail.assignments?.map((sub: any) => (
                    <div key={sub.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{sub.project?.title}</h4>
                        <Badge
                          variant={
                            sub.status === 'APPROVED'
                              ? 'success'
                              : sub.status === 'REVISION_REQUESTED'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-slate-500">{sub.project?.description}</p>
                      <div className="flex items-center gap-4 text-slate-600 pt-1">
                        {sub.repoUrl && (
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#6D28D9] font-bold underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Repository Link
                          </a>
                        )}
                        {sub.score !== null && (
                          <span className="font-bold text-[#5B21B6]">Score: {sub.score} / 100</span>
                        )}
                      </div>
                      {sub.mentorFeedback && (
                        <div className="p-2.5 bg-purple-50 rounded-lg text-purple-900 text-xs">
                          <strong>Your Feedback:</strong> {sub.mentorFeedback}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: QUIZZES */}
            {activeTab === 'quizzes' && (
              <div className="space-y-3 py-2">
                {studentDetail.quizResults?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No quizzes attempted by this student yet.
                  </div>
                ) : (
                  studentDetail.quizResults?.map((q: any) => (
                    <div
                      key={q.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <h5 className="font-bold text-slate-800">{q.quiz?.title || 'Technical Assessment'}</h5>
                        <p className="text-slate-400 text-[10px]">
                          Submitted on {new Date(q.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800">
                          {q.score} / {q.maxScore}
                        </span>
                        <Badge variant={q.passed ? 'success' : 'danger'}>
                          {q.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 7: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-3 py-2">
                {studentDetail.projects?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No capstone projects assigned to this batch or domain.
                  </div>
                ) : (
                  studentDetail.projects?.map((p: any) => (
                    <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{p.title}</h4>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          Max Score: {p.maxScore}
                        </span>
                      </div>
                      <p className="text-slate-600">{p.description}</p>
                      <div className="text-slate-400 text-[10px]">
                        Deadline: {new Date(p.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 8: MENTOR NOTES & FEEDBACK */}
            {activeTab === 'notes' && (
              <div className="space-y-4 py-2">
                {/* Note submission form */}
                <form onSubmit={handleAddNote} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Add Confidential Mentor Note</span>
                    <span className="text-[10px] text-slate-400">Visible only to Mentors and Admin</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {['ACADEMIC', 'PERFORMANCE', 'BEHAVIORAL', 'GENERAL'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNoteCategory(cat)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                          noteCategory === cat
                            ? 'bg-[#5B21B6] text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Enter confidential observation, performance feedback, or milestone notes..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />

                  <div className="flex items-center justify-between">
                    {noteSuccess && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Note saved!
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={submittingNote || !newNoteText.trim()}
                      className="btn-ivr-primary ml-auto text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {submittingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </form>

                {/* Existing Notes List */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {studentDetail.mentorNotes?.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No confidential notes recorded yet.
                    </div>
                  ) : (
                    studentDetail.mentorNotes?.map((n: any) => (
                      <div key={n.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded">
                            {n.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} by {n.mentor?.user?.name || 'Mentor'}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 9: QUICK CHAT / DIRECT COMMUNICATION */}
            {activeTab === 'chat' && (
              <div className="space-y-3 py-2">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-64 overflow-y-auto space-y-2 text-xs">
                  {studentDetail.conversation?.messages?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No message history with this student yet. Start the conversation below.
                    </div>
                  ) : (
                    studentDetail.conversation?.messages?.map((msg: any) => {
                      const isMentor = msg.sender?.role === 'MENTOR';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMentor ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-2.5 rounded-xl max-w-sm text-xs leading-relaxed ${
                              isMentor
                                ? 'bg-[#5B21B6] text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Type a direct message to ${studentDetail.name}...`}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !chatMessage.trim()}
                    className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
