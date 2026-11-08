'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  User,
  Clock,
  RefreshCw,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';

export default function AdminManagementPage() {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    notes: '',
  });

  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAdministrators = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/administrators');
      if (res.ok) {
        const data = await res.json();
        setAdministrators(data.administrators || []);
        setCurrentAdminId(data.currentAdminId || '');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to fetch administrator roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdministrators();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      showNotification('error', 'Passwords do not match. Please re-enter.');
      return;
    }
    if (createForm.password.length < 8) {
      showNotification('error', 'Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/administrators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'New Full Administrator created successfully.');
        setIsCreateOpen(false);
        setCreateForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          notes: '',
        });
        loadAdministrators();
      } else {
        showNotification('error', data.error || 'Failed to create administrator');
      }
    } catch {
      showNotification('error', 'Network error during administrator creation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/administrators/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Administrator details updated.');
        setIsEditOpen(false);
        setSelectedAdmin(null);
        loadAdministrators();
      } else {
        showNotification('error', data.error || 'Failed to update administrator.');
      }
    } catch {
      showNotification('error', 'Network error updating administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: any) => {
    const newStatus = admin.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to set administrator "${admin.name}" to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/admin/administrators/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || `Administrator set to ${newStatus}.`);
        loadAdministrators();
      } else {
        showNotification('error', data.error || 'Failed to toggle administrator status.');
      }
    } catch {
      showNotification('error', 'Error updating status.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (resetPassword !== confirmResetPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }
    if (resetPassword.length < 8) {
      showNotification('error', 'Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/administrators/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Password successfully reset for ${selectedAdmin.name}.`);
        setIsResetOpen(false);
        setSelectedAdmin(null);
        setResetPassword('');
        setConfirmResetPassword('');
      } else {
        showNotification('error', data.error || 'Failed to reset password.');
      }
    } catch {
      showNotification('error', 'Network error resetting password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: any) => {
    if (!confirm(`CAUTION: Permanently delete administrator "${admin.name}" (${admin.email})? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/administrators/${admin.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Administrator account permanently deleted.');
        loadAdministrators();
      } else {
        showNotification('error', data.error || 'Failed to delete administrator account.');
      }
    } catch {
      showNotification('error', 'Network error deleting administrator.');
    }
  };

  const currentAdmin = administrators.find((a) => a.id === currentAdminId) || administrators[0];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 uppercase tracking-widest">
                Security Governance
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {administrators.filter((a) => a.status === 'ACTIVE').length} Active Full Administrator(s)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized administrators can provision peer administrators with full functional access across all platform modules.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAdministrators}
              className="p-2 text-slate-600 hover:text-[#7C3AED] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh administrator list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7C3AED]' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Create Administrator
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Current Administrator Identity Card (as required) */}
        {currentAdmin && (
          <div className="ivr-card p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-purple-200 font-bold shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-[#C4B5FD]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">
                    Your Active Administrator Identity
                  </span>
                  <h3 className="text-lg font-black">{currentAdmin.name}</h3>
                  <span className="text-xs text-purple-200 font-mono">{currentAdmin.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {currentAdmin.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                  Role: Full Administrator
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-purple-300 font-medium uppercase text-[10px] block">Administrator ID</span>
                <span className="font-mono font-bold text-white text-sm">{currentAdmin.adminId || 'IVR-ADM-001'}</span>
              </div>
              <div>
                <span className="text-purple-300 font-medium uppercase text-[10px] block">Telephone</span>
                <span className="text-white font-medium">{currentAdmin.phone || '+91 8143177907'}</span>
              </div>
              <div>
                <span className="text-purple-300 font-medium uppercase text-[10px] block">Account Created</span>
                <span className="text-white font-medium">{new Date(currentAdmin.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-purple-300 font-medium uppercase text-[10px] block">Last Login Time</span>
                <span className="text-white font-mono text-[11px]">
                  {currentAdmin.lastLogin ? new Date(currentAdmin.lastLogin).toLocaleString() : 'Active Current Session'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Administrators Roster Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7C3AED]" />
              Enterprise Administrators Registry
            </h3>
            <span className="text-xs text-slate-500">
              Total Provisioned: <strong>{administrators.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Administrator</th>
                  <th className="p-3.5">Admin ID</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Operational Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">Loading administrators...</td>
                  </tr>
                ) : administrators.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No administrators found.</td>
                  </tr>
                ) : (
                  administrators.map((admin) => (
                    <tr key={admin.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {admin.name}
                          {admin.id === currentAdminId && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-extrabold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {admin.adminId || 'IVR-ADM'}
                        </span>
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-600">
                        <div>{admin.phone || 'N/A'}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                          Full Administrator
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {admin.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-500 font-mono">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-500 font-mono">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending Session'}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setEditForm({ name: admin.name, phone: admin.phone || '', notes: admin.approvalNotes || '' });
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#7C3AED] hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors"
                            title="Edit Administrator"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setResetPassword('');
                              setConfirmResetPassword('');
                              setIsResetOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(admin)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              admin.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            }`}
                            title={admin.status === 'ACTIVE' ? 'Deactivate Administrator' : 'Activate Administrator'}
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          {admin.id !== currentAdminId && (
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                              title="Delete Administrator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Create Administrator Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Peer Full Administrator"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 leading-relaxed">
            <span className="font-bold">Full Operational Access:</span> The new administrator will receive complete equal authority across all 19 administrative portal sections, including course management, mentor allocation, attendance controls, student approvals, and system settings.
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Administrator Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Venkatesh"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Official Email Address *</label>
            <input
              type="email"
              required
              placeholder="priya.admin@ivrtechsolution.in"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Contact Phone Number</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Initial Password (Min 8 Chars) *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Administrative Role / Notes</label>
            <input
              type="text"
              placeholder="e.g. Lead Technical Operations Administrator"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-ivr-primary px-5 py-2 rounded-lg font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {submitting ? 'Provisioning...' : 'Provision Administrator'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Administrator Modal */}
      {selectedAdmin && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Administrator: ${selectedAdmin.name}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Administrator Name *</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Contact Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Administrative Remarks</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-ivr-primary px-5 py-2 rounded-lg font-bold"
              >
                {submitting ? 'Saving...' : 'Update Administrator'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {selectedAdmin && (
        <Modal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          title={`Reset Password: ${selectedAdmin.name}`}
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
            <p className="text-slate-600">
              Set a new secure password for administrator <strong>{selectedAdmin.name}</strong> ({selectedAdmin.email}).
            </p>

            <div>
              <label className="block text-slate-800 font-bold mb-1">New Password (Min 8 Chars) *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmResetPassword}
                onChange={(e) => setConfirmResetPassword(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !resetPassword}
                className="btn-ivr-primary px-5 py-2 rounded-lg font-bold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {submitting ? 'Resetting...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

