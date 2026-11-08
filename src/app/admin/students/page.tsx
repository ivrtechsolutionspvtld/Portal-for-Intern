'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Loader2,
  ExternalLink,
  Eye,
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Add Form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    graduationYear: '2026',
    domain: DOMAINS[0].name,
    batchId: '',
    mentorId: '',
  });

  // Excel Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (selectedDomain) query.set('domain', selectedDomain);
      if (selectedBatch) query.set('batchId', selectedBatch);
      if (selectedStatus) query.set('status', selectedStatus);

      const res = await fetch(`/api/admin/students?${query.toString()}`);
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

  const fetchBatchesAndMentors = async () => {
    try {
      const [bRes, mRes] = await Promise.all([
        fetch('/api/admin/batches'),
        fetch('/api/admin/mentors'),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBatches(bData.batches || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMentors(mData.mentors || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatchesAndMentors();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedDomain, selectedBatch, selectedStatus]);

  // Handle Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setNewStudent({
          name: '',
          email: '',
          phone: '',
          college: '',
          department: '',
          graduationYear: '2026',
          domain: DOMAINS[0].name,
          batchId: '',
          mentorId: '',
        });
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create student');
      }
    } catch {
      alert('Error creating student');
    }
  };

  // Handle Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStudent.name,
          phone: selectedStudent.phone,
          status: selectedStudent.status,
          college: selectedStudent.college,
          department: selectedStudent.department,
          domain: selectedStudent.domain,
          batchId: selectedStudent.batch?.id || null,
          mentorId: selectedStudent.mentor?.id || null,
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        fetchStudents();
      } else {
        alert('Failed to update student profile');
      }
    } catch {
      alert('Error updating student');
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (student: any) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete student account ${student.name} (${student.email})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete student');
      }
    } catch {
      alert('Error deleting student');
    }
  };

  // Handle Toggle Status (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (student: any) => {
    const nextStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchStudents();
      } else {
        alert('Failed to update student status');
      }
    } catch {
      alert('Error updating status');
    }
  };


  // Handle Excel Upload Preview
  const handleExcelPreview = async (file: File) => {
    setImportFile(file);
    setImportLoading(true);
    setImportPreview(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'preview');

    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportPreview(data.preview);
      } else {
        alert(data.error || 'Failed to parse Excel file');
      }
    } catch {
      alert('Network error parsing Excel');
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Excel Commit
  const handleExcelCommit = async () => {
    if (!importPreview?.allValidRows) return;
    setImportLoading(true);

    const formData = new FormData();
    formData.append('action', 'commit');
    formData.append('rows', JSON.stringify(importPreview.allValidRows));

    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportSuccess(data);
        setImportPreview(null);
        fetchStudents();
      } else {
        alert(data.error || 'Failed to commit import');
      }
    } catch {
      alert('Network error committing import');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory & Admissions</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student cohorts, Excel bulk onboarding, mentor assignments, and credential status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/students/export"
              download
              className="btn-ivr-secondary text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Roster (Excel)
            </a>

            <button
              onClick={() => {
                setImportFile(null);
                setImportPreview(null);
                setImportSuccess(null);
                setIsImportOpen(true);
              }}
              className="btn-ivr-secondary text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel Bulk Import
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, student ID, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Students Table */}
        <div className="ivr-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">College & Dept</th>
                  <th className="py-3 px-4">Domain & Batch</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-1">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No students added yet.</p>
                        <p className="text-slate-400 text-[11px]">
                          Use &ldquo;Add Student&rdquo; or &ldquo;Excel Bulk Import&rdquo; above to provision student accounts.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5B21B6] font-bold text-xs flex items-center justify-center shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              {s.isDemo && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>{s.studentId || 'IVR-STU-DEMO'}</span>
                              <span>•</span>
                              <span>{s.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-xs">{s.college}</div>
                        <div className="text-[11px] text-slate-400">{s.department} • Grad {s.graduationYear}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{s.domain}</div>
                        <div className="text-[11px] text-[#6D28D9] font-medium">
                          {s.batch ? s.batch.name : <span className="text-slate-400">Unassigned Batch</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.mentor ? (
                          <span className="font-medium text-slate-800">{s.mentor.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">No Mentor Assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            s.attendancePercent >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {s.attendancePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setIsViewOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                              s.status === 'ACTIVE'
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title="Toggle Account Status"
                          >
                            {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Provision New Student Account">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College</label>
              <input
                type="text"
                required
                value={newStudent.college}
                onChange={(e) => setNewStudent({ ...newStudent, college: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domain Track</label>
              <select
                value={newStudent.domain}
                onChange={(e) => setNewStudent({ ...newStudent, domain: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Batch</label>
              <select
                value={newStudent.batchId}
                onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Unassigned</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
              Create Student Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      {selectedStudent && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile & Assignments">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={selectedStudent.name}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={selectedStudent.status}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, status: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Assignment</label>
                <select
                  value={selectedStudent.batch?.id || ''}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      batch: batches.find((b) => b.id === e.target.value) || null,
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">No Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Mentor</label>
              <select
                value={selectedStudent.mentor?.id || ''}
                onChange={(e) =>
                  setSelectedStudent({
                    ...selectedStudent,
                    mentor: mentors.find((m) => m.id === e.target.value) || null,
                  })
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">No Mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Excel Bulk Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Bulk Student Import via Excel"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#4C1D95] block">Download Standard Excel Template</span>
              <span className="text-[11px] text-slate-500">
                Includes required headers: Full Name, Email, Phone, College, Department, Graduation Year, Domain, Batch Name
              </span>
            </div>
            <a
              href="/api/admin/students/template"
              download
              className="btn-ivr-secondary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-white shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </a>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Populated Excel File (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleExcelPreview(e.target.files[0]);
                }
              }}
              className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-[#5B21B6] hover:file:bg-purple-200 cursor-pointer border border-slate-200 p-2 rounded-lg"
            />
          </div>

          {importLoading && (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#6D28D9]" />
              Validating columns, checking duplicates against database...
            </div>
          )}

          {/* Validation Errors & Preview */}
          {importPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold p-3 bg-slate-50 rounded-lg">
                <span>Total Rows Read: {importPreview.totalRows}</span>
                <span className="text-emerald-700 font-bold">Valid Rows: {importPreview.validCount}</span>
                {importPreview.errorCount > 0 && (
                  <span className="text-rose-600 font-bold">Errors: {importPreview.errorCount}</span>
                )}
              </div>

              {/* Duplicates / Errors alert */}
              {importPreview.errors?.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg max-h-36 overflow-y-auto space-y-1">
                  <div className="text-[11px] font-bold text-rose-800">Validation & Duplicate Warnings:</div>
                  {importPreview.errors.map((err: any, i: number) => (
                    <div key={i} className="text-[11px] text-rose-700">
                      Row {err.row}: {err.field} - {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">College</th>
                      <th className="p-2">Domain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.sampleValidRows?.map((row: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 font-medium">{row.fullName}</td>
                        <td className="p-2 font-mono text-slate-500">{row.email}</td>
                        <td className="p-2">{row.college}</td>
                        <td className="p-2 text-[#5B21B6]">{row.domain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExcelCommit}
                  disabled={importPreview.validCount === 0}
                  className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg shadow-sm disabled:opacity-50"
                >
                  Confirm & Import {importPreview.validCount} Students
                </button>
              </div>
            </div>
          )}

          {/* Import Success Summary */}
          {importSuccess && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">{importSuccess.message}</h3>
              <p className="text-xs text-slate-600">
                Provisioned {importSuccess.importedCount} student accounts. Welcome notifications and login credentials have been dispatched.
              </p>
              <button
                onClick={() => setIsImportOpen(false)}
                className="btn-ivr-primary text-xs font-bold px-6 py-2 rounded-lg mt-2"
              >
                Close & View Roster
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* View Student Details Modal */}
      {selectedStudent && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Student Profile & Performance Record">
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-[#5B21B6] font-bold text-base flex items-center justify-center">
                {selectedStudent.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedStudent.name}</h3>
                <span className="font-mono text-slate-400 text-[11px]">{selectedStudent.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Identifier</span>
                <span className="font-mono font-bold text-[#5B21B6]">{selectedStudent.studentId || 'IVR-STU-PENDING'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Status</span>
                <Badge variant={selectedStudent.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {selectedStudent.status}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                <span className="text-slate-800">{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration / Roll No</span>
                <span className="text-slate-800">{selectedStudent.regNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">College</span>
                <span className="text-slate-800 font-medium">{selectedStudent.college}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                <span className="text-slate-800 font-medium">{selectedStudent.department}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Degree & Academic Year</span>
                <span className="text-slate-800">{selectedStudent.degree || 'B.Tech'} ({selectedStudent.academicYear || 'Final Year'})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Graduation Year</span>
                <span className="text-slate-800">{selectedStudent.graduationYear}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                <span className="font-bold text-[#6D28D9]">{selectedStudent.attendancePercent}%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved Deliverables</span>
                <span className="font-bold text-emerald-700">{selectedStudent.completedProjects} Milestones</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Specialization Track</span>
                <span className="font-bold text-[#5B21B6]">{selectedStudent.domain}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Batch</span>
                <span className="font-medium text-slate-800">{selectedStudent.batch?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Faculty Mentor</span>
              <span className="font-medium text-slate-800">
                {selectedStudent.mentor ? `${selectedStudent.mentor.name} (${selectedStudent.mentor.designation})` : 'No Mentor Assigned'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="btn-ivr-primary text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

