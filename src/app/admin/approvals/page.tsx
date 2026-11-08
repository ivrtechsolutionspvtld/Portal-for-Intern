'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  UserCheck,
  UserX,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pendingStudents' | 'pendingMentors' | 'approved' | 'rejected' | 'deactivated'>('pendingStudents');
  const [data, setData] = useState<any>(null);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Modals
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);

  // Allocation Form states
  const [actionNotes, setActionNotes] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [allocationStartDate, setAllocationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocationEndDate, setAllocationEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [allocationDuration, setAllocationDuration] = useState('8 Weeks (2 Months)');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, mentorRes, courseRes, batchRes] = await Promise.all([
        fetch('/api/admin/approvals'),
        fetch('/api/admin/mentors'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/batches'),
      ]);

      if (appRes.ok) {
        const appJson = await appRes.json();
        setData(appJson);
      }
      if (mentorRes.ok) {
        const mentorJson = await mentorRes.json();
        setMentorsList(mentorJson.mentors || []);
      }
      if (courseRes.ok) {
        const courseJson = await courseRes.json();
        setCoursesList(courseJson.courses || []);
      }
      if (batchRes.ok) {
        const batchJson = await batchRes.json();
        setBatchesList(batchJson.batches || []);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to load approvals queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'DEACTIVATE' | 'ACTIVATE') => {
    if (!selectedUser) return;

    if (action === 'APPROVE' && selectedUser.role === 'STUDENT') {
      if (!selectedCourseId) {
        showNotification('error', 'Internship Course selection is mandatory before activating student.');
        return;
      }
      if (!selectedMentorId) {
        showNotification('error', 'Mentor assignment is mandatory before activating student.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action,
          notes: actionNotes,
          courseId: selectedCourseId || undefined,
          mentorId: selectedMentorId || undefined,
          startDate: allocationStartDate,
          endDate: allocationEndDate,
          duration: allocationDuration,
          batchId: selectedBatchId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showNotification('error', resData.error || 'Action failed');
      } else {
        showNotification('success', resData.message || 'Workflow executed successfully');
        setIsApproveOpen(false);
        setIsRejectOpen(false);
        setIsRequestInfoOpen(false);
        setIsViewOpen(false);
        setActionNotes('');
        setSelectedCourseId('');
        setSelectedMentorId('');
        setSelectedBatchId('');
        loadData();
      }
    } catch {
      showNotification('error', 'Network error during approval action.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get current tab list
  const getTabList = () => {
    if (!data) return [];
    switch (activeTab) {
      case 'pendingStudents':
        return data.pendingStudents || [];
      case 'pendingMentors':
        return data.pendingMentors || [];
      case 'approved':
        return data.approvedAccounts || [];
      case 'rejected':
        return data.rejectedAccounts || [];
      case 'deactivated':
        return data.deactivatedAccounts || [];
      default:
        return [];
    }
  };

  const filteredList = getTabList().filter((item: any) => {
    const q = search.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(q);
    const emailMatch = item.email?.toLowerCase().includes(q);
    const phoneMatch = item.phone?.toLowerCase().includes(q);
    const idMatch =
      item.studentProfile?.studentId?.toLowerCase().includes(q) ||
      item.mentorProfile?.mentorId?.toLowerCase().includes(q);
    const domainMatch =
      item.studentProfile?.domain?.toLowerCase().includes(q) ||
      item.mentorProfile?.assignedProgram?.toLowerCase().includes(q);
    return !search || nameMatch || emailMatch || phoneMatch || idMatch || domainMatch;
  });

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Toast Alert */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Approval Management</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Gatekeeper System
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Strict access approval workflow. No student or mentor gains portal access until formally verified.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ivr-secondary text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* 5-Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pendingStudents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'pendingStudents'
                ? 'bg-[#4C1D95] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Pending Students</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pendingStudents' ? 'bg-white text-[#4C1D95]' : 'bg-purple-100 text-[#5B21B6]'
              }`}
            >
              {data?.counts?.pendingStudents ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pendingMentors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'pendingMentors'
                ? 'bg-[#4C1D95] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pending Mentors</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pendingMentors' ? 'bg-white text-[#4C1D95]' : 'bg-purple-100 text-[#5B21B6]'
              }`}
            >
              {data?.counts?.pendingMentors ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'approved'
                ? 'bg-[#4C1D95] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approved Accounts</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'approved' ? 'bg-white text-[#4C1D95]' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {data?.counts?.approvedAccounts ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'rejected'
                ? 'bg-[#4C1D95] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Rejected Applications</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'rejected' ? 'bg-white text-[#4C1D95]' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {data?.counts?.rejectedAccounts ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deactivated')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'deactivated'
                ? 'bg-[#4C1D95] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Deactivated Accounts</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'deactivated' ? 'bg-white text-[#4C1D95]' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {data?.counts?.deactivatedAccounts ?? 0}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, ID, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredList.length}</strong> record(s)
          </div>
        </div>

        {/* Records Table / Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D28D9]" />
            Loading approval queue from database...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#6D28D9] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no registrations in this category matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Applicant / Account</th>
                    <th className="py-3.5 px-4">Account Type & Identifier</th>
                    <th className="py-3.5 px-4">College / Dept / Track</th>
                    <th className="py-3.5 px-4">Registration Date</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((user: any) => {
                    const isStudent = user.role === 'STUDENT';
                    const identifier = isStudent
                      ? user.studentProfile?.studentId || 'IVR-STU-PENDING'
                      : user.mentorProfile?.mentorId || 'IVR-MEN-PENDING';
                    const detailTrack = isStudent
                      ? user.studentProfile?.domain || 'General Cohort'
                      : user.mentorProfile?.assignedProgram || user.mentorProfile?.designation;

                    return (
                      <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-[#5B21B6] font-bold flex items-center justify-center shrink-0 border border-purple-200 text-xs">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.isDemo && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                    DEMO
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-0.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                              isStudent
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-50 text-[#5B21B6] border border-purple-200'
                            }`}
                          >
                            {user.role}
                          </span>
                          <div className="font-mono text-slate-600 text-[11px]">{identifier}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-semibold text-slate-800">{detailTrack}</div>
                          <div className="text-slate-500 text-[11px]">
                            {isStudent
                              ? `${user.studentProfile?.college || 'University'} • ${user.studentProfile?.department || ''}`
                              : `${user.mentorProfile?.department || 'Faculty'} • ${user.mentorProfile?.designation || ''}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : user.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : user.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : user.status === 'INFO_REQUESTED'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : user.status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500'
                                  : user.status === 'REJECTED'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsViewOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Full Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {user.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsApproveOpen(true);
                                  }}
                                  className="btn-ivr-primary text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Approve
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsRequestInfoOpen(true);
                                  }}
                                  className="text-[11px] font-semibold px-2 py-1 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                >
                                  Request Info
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsRejectOpen(true);
                                  }}
                                  className="text-[11px] font-semibold px-2 py-1 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {user.status === 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  handleAction('DEACTIVATE');
                                }}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}

                            {user.status === 'DEACTIVATED' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  handleAction('ACTIVATE');
                                }}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedUser && (
          <Modal
            isOpen={isViewOpen}
            onClose={() => setIsViewOpen(false)}
            title={`Application Details - ${selectedUser.name}`}
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{selectedUser.name}</h4>
                  <p className="text-slate-500 text-[11px]">{selectedUser.email} • {selectedUser.phone || 'No phone'}</p>
                </div>
                <span className="font-bold px-2 py-0.5 rounded bg-white text-[#5B21B6] border border-purple-200 text-[10px]">
                  {selectedUser.role}
                </span>
              </div>

              {selectedUser.role === 'STUDENT' && selectedUser.studentProfile && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Student ID</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.studentProfile.studentId || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Internship Program</span>
                    <span className="font-bold text-[#5B21B6]">{selectedUser.studentProfile.domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">College / University</span>
                    <span className="font-semibold text-slate-800">{selectedUser.studentProfile.college}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
                    <span className="font-semibold text-slate-800">{selectedUser.studentProfile.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Degree / Academic Year</span>
                    <span className="text-slate-800">{selectedUser.studentProfile.degree || 'B.Tech'} ({selectedUser.studentProfile.academicYear || 'Final Year'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Graduation Year</span>
                    <span className="text-slate-800">{selectedUser.studentProfile.graduationYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Registration / Roll No</span>
                    <span className="text-slate-800">{selectedUser.studentProfile.regNumber || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Batch</span>
                    <span className="text-slate-800">{selectedUser.studentProfile.batch?.name || 'Unassigned'}</span>
                  </div>
                  {selectedUser.studentProfile.resumeUrl && (
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <a
                        href={selectedUser.studentProfile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6D28D9] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Uploaded Resume / Portfolio
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedUser.role === 'MENTOR' && selectedUser.mentorProfile && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Mentor ID</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.mentorProfile.mentorId || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Employee ID</span>
                    <span className="font-mono text-slate-800">{selectedUser.mentorProfile.employeeId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Designation</span>
                    <span className="font-semibold text-slate-800">{selectedUser.mentorProfile.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
                    <span className="font-semibold text-slate-800">{selectedUser.mentorProfile.department}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Area of Expertise</span>
                    <span className="text-slate-800">{selectedUser.mentorProfile.expertise}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Experience</span>
                    <span className="text-slate-800">{selectedUser.mentorProfile.experience || '3 Years'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Program</span>
                    <span className="font-bold text-[#5B21B6]">{selectedUser.mentorProfile.assignedProgram || 'General Track'}</span>
                  </div>
                </div>
              )}

              {selectedUser.approvalNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                  <span className="font-bold block mb-0.5 text-[11px]">Approval Audit Notes:</span>
                  <p>{selectedUser.approvalNotes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Approve Modal */}
        {selectedUser && (
          <Modal
            isOpen={isApproveOpen}
            onClose={() => setIsApproveOpen(false)}
            title={`Approve & Activate Account: ${selectedUser.name}`}
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 leading-relaxed">
                <span className="font-bold">Enterprise Activation Workflow:</span> Approving this account will set status to <strong>ACTIVE</strong>, dispatch official activation credentials to <strong>{selectedUser.email}</strong>, and unlock portal access.
              </div>

              {selectedUser.role === 'STUDENT' && (
                <div className="space-y-3.5 border-t border-b border-slate-200 py-3">
                  {/* 1. Student Information Summary */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase block text-[9px]">Student ID</span>
                      <strong className="font-mono text-slate-900">{selectedUser.studentProfile?.studentId || 'Pending'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase block text-[9px]">College / University</span>
                      <span className="text-slate-800 font-medium truncate block">{selectedUser.studentProfile?.college}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase block text-[9px]">Department / Degree</span>
                      <span className="text-slate-800 font-medium">{selectedUser.studentProfile?.department} ({selectedUser.studentProfile?.degree || 'B.Tech'})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase block text-[9px]">Academic / Grad Year</span>
                      <span className="text-slate-800 font-medium">{selectedUser.studentProfile?.academicYear || 'Final Year'} • {selectedUser.studentProfile?.graduationYear}</span>
                    </div>
                  </div>

                  {/* 2. Internship Course Selection (Mandatory) */}
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      2. Internship Course Selection * <span className="text-rose-600 font-semibold">(Mandatory)</span>
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setSelectedCourseId(cid);
                        const c = coursesList.find((x) => x.id === cid);
                        if (c) {
                          setAllocationDuration(`${c.durationWeeks} Weeks`);
                          const end = new Date(Date.now() + c.durationWeeks * 7 * 24 * 60 * 60 * 1000);
                          setAllocationEndDate(end.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
                    >
                      <option value="">-- Select Required Internship Course Track --</option>
                      {coursesList.filter((c) => c.status === 'ACTIVE').map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.title} ({c.durationWeeks} Weeks - {c.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Mentor Assignment (Mandatory) */}
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      3. Mentor Assignment * <span className="text-rose-600 font-semibold">(Mandatory)</span>
                    </label>
                    <select
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
                    >
                      <option value="">-- Assign Available Faculty Mentor --</option>
                      {mentorsList.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.designation || 'Technical Mentor'} • {m.expertise || m.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4 & 5. Internship Start Date & End Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">4. Start Date *</label>
                      <input
                        type="date"
                        value={allocationStartDate}
                        onChange={(e) => setAllocationStartDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">5. End Date *</label>
                      <input
                        type="date"
                        value={allocationEndDate}
                        onChange={(e) => setAllocationEndDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* 6 & 7. Internship Duration & Batch Assignment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">6. Internship Duration</label>
                      <select
                        value={allocationDuration}
                        onChange={(e) => setAllocationDuration(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
                      >
                        <option value="4 Weeks (1 Month)">4 Weeks (1 Month)</option>
                        <option value="8 Weeks (2 Months)">8 Weeks (2 Months)</option>
                        <option value="12 Weeks (3 Months)">12 Weeks (3 Months)</option>
                        <option value="24 Weeks (6 Months)">24 Weeks (6 Months)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">7. Batch Assignment (Optional)</label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED] bg-white"
                      >
                        <option value="">-- Optional Cohort Batch --</option>
                        {batchesList.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.domain})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Validation notice */}
                  {(!selectedCourseId || !selectedMentorId) && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Course track selection and Mentor assignment are mandatory before activating this student account.</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Approval Notes / Internal Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Verified academic credentials and assigned curriculum track..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsApproveOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || (selectedUser.role === 'STUDENT' && (!selectedCourseId || !selectedMentorId))}
                  onClick={() => handleAction('APPROVE')}
                  className={`px-5 py-2 rounded-lg font-bold flex items-center gap-1.5 ${
                    selectedUser.role === 'STUDENT' && (!selectedCourseId || !selectedMentorId)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'btn-ivr-primary'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submitting ? 'Approving & Allocating...' : 'Approve & Activate Account'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reject Modal */}
        {selectedUser && (
          <Modal
            isOpen={isRejectOpen}
            onClose={() => setIsRejectOpen(false)}
            title={`Reject Registration: ${selectedUser.name}`}
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Rejecting this application will prevent access to the portal and send an official status update notice to{' '}
                <strong>{selectedUser.email}</strong>.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rejection Reason (Required)</label>
                <textarea
                  rows={3}
                  placeholder="Specify why the registration could not be approved..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || !actionNotes.trim()}
                  onClick={() => handleAction('REJECT')}
                  className="px-5 py-2 rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Request Info Modal */}
        {selectedUser && (
          <Modal
            isOpen={isRequestInfoOpen}
            onClose={() => setIsRequestInfoOpen(false)}
            title={`Request Additional Info: ${selectedUser.name}`}
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Specify what additional documents, identification, or corrections are required from the applicant.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Information Requested</label>
                <textarea
                  rows={3}
                  placeholder="Please provide an updated university ID card or revised resume link..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsRequestInfoOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || !actionNotes.trim()}
                  onClick={() => handleAction('REQUEST_INFO')}
                  className="px-5 py-2 rounded-lg font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send Information Request'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

