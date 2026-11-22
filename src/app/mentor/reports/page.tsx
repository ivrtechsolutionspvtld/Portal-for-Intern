'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  Download,
  Users,
  CalendarCheck,
  Award,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function MentorReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEligibility, setFilterEligibility] = useState<'ALL' | 'ELIGIBLE' | 'AT_RISK'>('ALL');

  // Certificate Recommendation Modal
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [performanceRating, setPerformanceRating] = useState('EXCELLENT');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [submittingRec, setSubmittingRec] = useState(false);
  const [recSuccessMessage, setRecSuccessMessage] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/reports');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openRecModal = (student: any) => {
    setSelectedCandidate(student);
    setPerformanceRating('EXCELLENT');
    setFeedbackRemarks(
      `Strong technical competency demonstrated throughout the ${student.domain} track. All assignments and capstone requirements verified.`
    );
    setIsRecModalOpen(true);
    setRecSuccessMessage(null);
  };

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !feedbackRemarks.trim()) return;
    setSubmittingRec(true);
    try {
      const res = await fetch('/api/mentor/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedCandidate.id,
          performanceRating,
          feedback: feedbackRemarks.trim(),
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setRecSuccessMessage('Recommendation submitted for Administrator approval!');
        setTimeout(() => {
          setIsRecModalOpen(false);
          setSelectedCandidate(null);
          loadReports();
        }, 1500);
      } else {
        alert(resJson.error || 'Failed to submit recommendation.');
      }
    } catch {
      alert('Error submitting recommendation.');
    } finally {
      setSubmittingRec(false);
    }
  };

  const exportToCSV = () => {
    if (!data?.reports) return;
    const headers = [
      'Student Name',
      'Student ID',
      'Email',
      'Domain',
      'Attendance %',
      'Attendance Status',
      'Approved Projects',
      'Quizzes Passed',
      'Eligibility',
      'Certificate Status',
    ];
    const rows = data.reports.map((s: any) => [
      `"${s.name}"`,
      s.studentId || 'N/A',
      s.email,
      s.domain,
      s.attendance.percentage,
      s.attendance.status,
      s.projects.approved,
      s.quizzes.passed,
      s.isEligible ? 'ELIGIBLE' : 'AT_RISK',
      s.certificate.hasCertificate ? 'ISSUED' : s.certificate.recommendationStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IVR_Mentor_Cohort_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = (data?.reports || []).filter((s: any) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q);

    if (filterEligibility === 'ELIGIBLE') return matchesSearch && s.isEligible;
    if (filterEligibility === 'AT_RISK') return matchesSearch && !s.isEligible;
    return matchesSearch;
  });

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cohort Performance &amp; Certificate Recommendations
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Academic Audit
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Review assigned fellows across attendance compliance, project deliverables, and quiz scores. Submit certificate recommendations to Administration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="btn-ivr-secondary text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={loadReports}
              className="p-2 text-slate-600 hover:text-[#5B21B6] bg-white border border-slate-200 rounded-lg"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ivr-card p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Fellows</span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {data?.summary?.totalStudents || 0}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Capacity: {data?.summary?.maxCapacity || 30} fellows ({data?.summary?.workloadPercentage || 0}%)
            </span>
          </div>

          <div className="ivr-card p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Average Attendance</span>
            <p className="text-xl font-black text-[#5B21B6] mt-1">
              {data?.summary?.averageCohortAttendance || 100}%
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Benchmark: &gt;= 75% for credentials
            </span>
          </div>

          <div className="ivr-card p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Approved Projects</span>
            <p className="text-xl font-black text-emerald-700 mt-1">
              {data?.summary?.totalApprovedSubmissions || 0}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Evaluated and signed off
            </span>
          </div>

          <div className="ivr-card p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Certificate Eligible</span>
            <p className="text-xl font-black text-purple-900 mt-1">
              {data?.summary?.eligibleStudentsCount || 0}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Ready for mentor sign-off
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search fellow name, email, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterEligibility}
              onChange={(e) => setFilterEligibility(e.target.value as any)}
              className="text-xs p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">All Fellows</option>
              <option value="ELIGIBLE">Eligible for Certification</option>
              <option value="AT_RISK">At Risk (&lt;75% Attendance / Incomplete)</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fellow Details</th>
                  <th className="py-3 px-4">Domain &amp; Cohort</th>
                  <th className="py-3 px-4">Attendance Compliance</th>
                  <th className="py-3 px-4">Project Submissions</th>
                  <th className="py-3 px-4">Quizzes Passed</th>
                  <th className="py-3 px-4">Credential Status</th>
                  <th className="py-3 px-4 text-right">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Compiling academic records...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No fellows match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((s: any) => (
                    <tr key={s.id} className="hover:bg-purple-50/20">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.studentId || 'Pending'}</div>
                        <div className="text-[11px] text-slate-500">{s.college}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{s.domain}</span>
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                          {s.batchName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 font-mono">
                            {s.attendance.percentage}%
                          </span>
                          <Badge variant={s.attendance.status === 'ELIGIBLE' ? 'success' : 'danger'}>
                            {s.attendance.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {s.attendance.presentDays}/{s.attendance.totalDays} sessions
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">
                          {s.projects.approved} / {s.projects.total} Approved
                        </span>
                        {s.projects.averageScore && (
                          <span className="text-[10px] text-purple-700 font-bold">
                            Avg Score: {s.projects.averageScore}/100
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {s.quizzes.passed} passed
                      </td>

                      <td className="py-3 px-4">
                        {s.certificate.hasCertificate ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Issued ({s.certificate.certificateNumber})
                          </span>
                        ) : s.certificate.recommendationStatus === 'PENDING' ? (
                          <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" /> Under Admin Review
                          </span>
                        ) : s.certificate.recommendationStatus === 'APPROVED' ? (
                          <span className="text-emerald-700 font-bold">Approved by Admin</span>
                        ) : s.isEligible ? (
                          <span className="text-[#5B21B6] font-bold">Ready to Recommend</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Incomplete Milestones</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {s.certificate.hasCertificate ? (
                          <span className="text-[11px] font-bold text-emerald-700">Completed</span>
                        ) : s.certificate.recommendationStatus === 'PENDING' ? (
                          <span className="text-[11px] font-semibold text-slate-400">Submitted</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRecModal(s)}
                            disabled={!s.isEligible}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-2xs ${
                              s.isEligible
                                ? 'btn-ivr-primary'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            Recommend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recommend Candidate Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={isRecModalOpen}
          onClose={() => setIsRecModalOpen(false)}
          title={`Recommend for Certificate: ${selectedCandidate.name}`}
        >
          <form onSubmit={handleRecommendSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1 text-purple-900">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                Institutional Certificate Endorsement
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                As assigned faculty mentor, you are endorsing that <strong>{selectedCandidate.name}</strong> has successfully completed technical requirements in <strong>{selectedCandidate.domain}</strong> with <strong>{selectedCandidate.attendance?.percentage}%</strong> attendance.
              </p>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Performance Rating *</label>
              <select
                value={performanceRating}
                onChange={(e) => setPerformanceRating(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED] bg-white font-semibold"
              >
                <option value="EXCELLENT">EXCELLENT (Outstanding Technical Excellence)</option>
                <option value="VERY_GOOD">VERY GOOD (Consistently Exceeds Expectations)</option>
                <option value="GOOD">GOOD (Meets All Required Competencies)</option>
                <option value="SATISFACTORY">SATISFACTORY (Basic Requirements Fulfilled)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Faculty Remarks &amp; Feedback *</label>
              <textarea
                required
                rows={3}
                placeholder="Detail technical strengths, capstone evaluation remarks, and reason for certification..."
                value={feedbackRemarks}
                onChange={(e) => setFeedbackRemarks(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            {recSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {recSuccessMessage}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRecModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRec || !feedbackRemarks.trim()}
                className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingRec ? 'Submitting...' : 'Submit to Administration'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
