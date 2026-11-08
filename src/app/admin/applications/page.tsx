'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { DOMAINS } from '@/lib/constants';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          status,
          notes: reviewNotes,
        }),
      });
      if (res.ok) {
        setIsViewOpen(false);
        setReviewNotes('');
        loadApplications();
      } else {
        alert('Failed to update application');
      }
    } catch {
      alert('Error updating application');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.refNumber?.toLowerCase().includes(q) ||
      a.college?.toLowerCase().includes(q);
    const matchDomain = !domainFilter || a.domain === domainFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchDomain && matchStatus;
  });

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admissions Pipeline</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Application Review
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Review and triage incoming collegiate internship submissions and verify eligibility.
            </p>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="btn-ivr-secondary text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Filter bar */}
        <div className="ivr-card p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, email, ref #, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Internship Tracks</option>
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Application Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D28D9]" />
            Loading admissions pipeline...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No internship applications currently match your filters.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Applicant Candidate</th>
                    <th className="py-3.5 px-4">Track & Reference #</th>
                    <th className="py-3.5 px-4">College & Department</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{app.fullName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {app.email}
                          </span>
                          {app.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {app.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{app.domain}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{app.refNumber}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">{app.college}</div>
                        <div className="text-slate-500 text-[11px]">
                          {app.department} (Class of {app.graduationYear})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : app.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : app.status === 'UNDER_REVIEW'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewNotes(app.notes || '');
                            setIsViewOpen(true);
                          }}
                          className="btn-ivr-secondary text-xs px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Application
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Application Review Modal */}
        {selectedApp && (
          <Modal
            isOpen={isViewOpen}
            onClose={() => setIsViewOpen(false)}
            title={`Application Dossier: ${selectedApp.fullName}`}
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference Identifier</span>
                  <span className="font-mono font-bold text-slate-900">{selectedApp.refNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Track Applied</span>
                  <span className="font-bold text-[#5B21B6]">{selectedApp.domain}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Email</span>
                  <span className="text-slate-800">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="text-slate-800">{selectedApp.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">College / University</span>
                  <span className="font-medium text-slate-800">{selectedApp.college}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-medium text-slate-800">{selectedApp.department} ({selectedApp.graduationYear})</span>
                </div>
              </div>

              {selectedApp.statement && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Statement of Purpose</span>
                  <p className="text-slate-700 leading-relaxed">{selectedApp.statement}</p>
                </div>
              )}

              {selectedApp.resumeUrl && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Resume / Credential Submission</span>
                  <a
                    href={selectedApp.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ivr-primary text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Resume
                  </a>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Review Notes & Decision Rationale</label>
                <textarea
                  rows={2}
                  placeholder="Record assessment notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Current Status: <strong>{selectedApp.status}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedApp.id, 'UNDER_REVIEW')}
                    className="px-3 py-1.5 rounded-lg font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    Mark Under Review
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedApp.id, 'APPROVED')}
                    className="btn-ivr-primary px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Candidate
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

