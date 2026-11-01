'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Award, ShieldCheck, CheckCircle2, AlertTriangle, Eye, QrCode, Plus, ExternalLink } from 'lucide-react';

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [eligibleCandidates, setEligibleCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Revoke Modal
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certificates');
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
        setEligibleCandidates(data.eligibleCandidates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCertificate = async (studentProfileId: string) => {
    if (!confirm('Are you sure you want to issue an official IVR Enterprise Certificate for this student?')) return;
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ISSUE', studentProfileId }),
      });
      if (res.ok) {
        alert('Certificate issued successfully with cryptographic QR code!');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to issue certificate');
      }
    } catch {
      alert('Error issuing certificate');
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE',
          certificateNumber: selectedCert.certificateNumber,
          notes: revokeReason,
        }),
      });
      if (res.ok) {
        setIsRevokeOpen(false);
        setRevokeReason('');
        loadData();
      } else {
        alert('Failed to revoke certificate');
      }
    } catch {
      alert('Error revoking certificate');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Certificate Governance & QR Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review candidate eligibility, approve tamper-proof credentials, and manage public verification seals.
            </p>
          </div>
        </div>

        {/* Section 1: Eligible Candidates Awaiting Approval */}
        <div className="ivr-card p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Fellows Eligible for Certificate Issuance ({eligibleCandidates.filter((c) => c.isEligible).length})
              </h3>
              <p className="text-xs text-slate-400">
                Meets configured benchmarks: ≥ 80% dynamic QR attendance & all milestone projects approved.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3 text-center">Attendance %</th>
                  <th className="py-2.5 px-3 text-center">Approved Projects</th>
                  <th className="py-2.5 px-3 text-right">Issuance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      No candidates currently pending approval.
                    </td>
                  </tr>
                ) : (
                  eligibleCandidates.map((c) => (
                    <tr key={c.studentProfileId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 text-[#5B21B6] font-medium">{c.domain}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.batchName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                        {c.attendanceRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {c.approvedProjects} Approved
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleIssueCertificate(c.studentProfileId)}
                          disabled={!c.isEligible}
                          className="btn-ivr-primary text-xs font-bold px-3 py-1.5 rounded-md disabled:opacity-40"
                        >
                          Approve & Generate QR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Issued Certificates Registry */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6D28D9]" />
              Official Issued Credentials Registry ({certificates.length})
            </h3>
            <p className="text-xs text-slate-400">
              Immutable certificate records verified through <code>/verify/[certificate-id]</code>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Verification & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#4C1D95]">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cert.student.user.name}</div>
                      <div className="text-[11px] text-slate-400">{cert.student.user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{cert.domain}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={cert.status === 'VALID' ? 'success' : 'danger'}>
                        {cert.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/verify/${cert.certificateNumber}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6D28D9] hover:underline"
                      >
                        Public Verify <ExternalLink className="w-3 h-3" />
                      </Link>

                      {cert.status === 'VALID' && (
                        <button
                          onClick={() => {
                            setSelectedCert(cert);
                            setIsRevokeOpen(true);
                          }}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revocation Modal */}
      {selectedCert && (
        <Modal
          isOpen={isRevokeOpen}
          onClose={() => setIsRevokeOpen(false)}
          title={`Revoke Certificate: ${selectedCert.certificateNumber}`}
        >
          <form onSubmit={handleRevokeSubmit} className="space-y-4">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
              <strong>Warning:</strong> Revoking this certificate will invalidate the public QR verification record at <code>/verify/{selectedCert.certificateNumber}</code>.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Revocation</label>
              <textarea
                rows={3}
                required
                placeholder="Specify reason (e.g. Academic dishonesty, enrollment fraud)..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRevokeOpen(false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button type="submit" className="bg-rose-600 text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-rose-700">
                Confirm Revocation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
