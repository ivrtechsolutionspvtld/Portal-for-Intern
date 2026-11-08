'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Users,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarCheck,
  Building2,
  Award,
  Download,
} from 'lucide-react';

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);

  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Principal Solutions Architect',
    department: 'Software Architecture & Cloud Platforms',
    expertise: 'Distributed Systems, Next.js, Node.js, AWS',
    bio: '',
    maxStudents: '30',
    password: '',
  });

  const loadMentors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mentors');
      if (res.ok) {
        const data = await res.json();
        setMentors(data.mentors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setAddForm({
          name: '',
          email: '',
          phone: '',
          designation: 'Principal Solutions Architect',
          department: 'Software Architecture & Cloud Platforms',
          expertise: 'Distributed Systems, Next.js, Node.js, AWS',
          bio: '',
          maxStudents: '30',
          password: '',
        });
        loadMentors();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create mentor');
      }
    } catch {
      alert('Error creating mentor');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      const res = await fetch(`/api/admin/mentors/${selectedMentor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedMentor.name,
          phone: selectedMentor.phone,
          designation: selectedMentor.designation,
          department: selectedMentor.department,
          expertise: selectedMentor.expertise,
          bio: selectedMentor.bio,
          maxStudents: selectedMentor.maxStudents,
          status: selectedMentor.status,
        }),
      });

      if (res.ok) {
        setIsEditOpen(false);
        loadMentors();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update mentor');
      }
    } catch {
      alert('Error updating mentor');
    }
  };

  const handleToggleStatus = async (mentor: any) => {
    const nextStatus = mentor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadMentors();
      } else {
        alert('Failed to update status');
      }
    } catch {
      alert('Error updating status');
    }
  };

  const handleDeleteMentor = async (mentor: any) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove mentor ${mentor.name}? Any assigned students will be unlinked.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadMentors();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete mentor');
      }
    } catch {
      alert('Error deleting mentor');
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const matchSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase()) ||
      m.designation?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Faculty & Allocations</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision, manage, review, and evaluate academic faculty mentors and fellowship capacities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/mentors/export"
              download
              className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Mentors (Excel)
            </a>
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn-ivr-primary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Provision Faculty Mentor
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mentors by name, email, department, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400">Loading mentor records...</div>
          ) : filteredMentors.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold">No mentors available.</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Click &ldquo;Provision Faculty Mentor&rdquo; above to add academic mentors to the portal.
              </p>
            </div>
          ) : (
            filteredMentors.map((m) => {
              const workloadPercent = Math.min(100, Math.round(((m.activeStudentsCount || 0) / (m.maxStudents || 30)) * 100));
              return (
                <div key={m.id} className="ivr-card p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between hover:border-purple-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {m.name?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">{m.name}</h3>
                            {m.isDemo && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#6D28D9] font-medium block truncate max-w-[170px]">{m.designation}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{m.mentorId || 'IVR-MEN-DEMO'}</span>
                        </div>
                      </div>
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'default'}>{m.status}</Badge>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{m.department}</span>
                      </div>
                      {m.expertise && (
                        <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                          &ldquo;{m.expertise}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Allocated Students</span>
                        <span className="font-bold text-slate-800">
                          {m.activeStudentsCount || 0} / {m.maxStudents || 30} ({workloadPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            workloadPercent >= 90
                              ? 'bg-rose-500'
                              : workloadPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-[#6D28D9]'
                          }`}
                          style={{ width: `${workloadPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedMentor(m);
                          setIsViewOpen(true);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-[#6D28D9] flex items-center gap-1"
                        title="View Full Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                            m.status === 'ACTIVE'
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title="Toggle Status"
                        >
                          {m.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMentor(m);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMentor(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Mentor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Provision Mentor Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Provision Faculty Mentor">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Fellow Capacity</label>
              <input
                type="number"
                value={addForm.maxStudents}
                onChange={(e) => setAddForm({ ...addForm, maxStudents: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={addForm.designation}
                onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Expertise</label>
            <input
              type="text"
              value={addForm.expertise}
              onChange={(e) => setAddForm({ ...addForm, expertise: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
            <textarea
              rows={2}
              value={addForm.bio}
              onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
              Create Mentor Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Mentor Modal */}
      {selectedMentor && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Mentor Profile">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={selectedMentor.name}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={selectedMentor.phone || ''}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={selectedMentor.designation}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, designation: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={selectedMentor.department}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, department: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={selectedMentor.maxStudents}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, maxStudents: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={selectedMentor.status}
                  onChange={(e) => setSelectedMentor({ ...selectedMentor, status: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Technical Expertise</label>
              <input
                type="text"
                value={selectedMentor.expertise || ''}
                onChange={(e) => setSelectedMentor({ ...selectedMentor, expertise: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
              <textarea
                rows={2}
                value={selectedMentor.bio || ''}
                onChange={(e) => setSelectedMentor({ ...selectedMentor, bio: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
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

      {/* View Mentor Modal */}
      {selectedMentor && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Faculty Mentor Details">
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3B0764] to-[#6D28D9] text-white font-bold flex items-center justify-center text-base">
                {selectedMentor.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedMentor.name}</h3>
                <span className="text-[#6D28D9] font-medium">{selectedMentor.designation}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mentor Identifier</span>
                <span className="font-mono font-bold text-[#5B21B6]">{selectedMentor.mentorId || 'IVR-MEN-PENDING'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee ID</span>
                <span className="font-mono text-slate-800">{selectedMentor.employeeId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                <span className="font-mono text-slate-800">{selectedMentor.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                <span className="text-slate-800">{selectedMentor.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                <span className="text-slate-800">{selectedMentor.department}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                <span className="text-slate-800">{selectedMentor.experience || '3 Years'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Program Track</span>
                <span className="font-bold text-[#6D28D9]">{selectedMentor.assignedProgram || 'General Track'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <Badge variant={selectedMentor.status === 'ACTIVE' ? 'success' : 'default'}>{selectedMentor.status}</Badge>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expertise</span>
              <p className="text-slate-700 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 leading-relaxed">
                {selectedMentor.expertise || 'No expertise specified'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Fellows</span>
              {selectedMentor.assignedStudents?.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-white">
                  {selectedMentor.assignedStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-1 border-b border-slate-50 text-[11px]">
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className="font-mono text-slate-400">{s.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No fellows currently assigned.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
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
