'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { CreditCard, DollarSign, CheckCircle2, Clock, Settings, FileText, Download } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Config Modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [regFee, setRegFee] = useState('499');
  const [progFee, setProgFee] = useState('4999');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setMetrics(data.metrics || null);
        setSettings(data.settings || null);
        if (data.settings) {
          setRegFee(String(data.settings.registrationFeeINR));
          setProgFee(String(data.settings.programFeeINR));
        }
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

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_FEE_CONFIG',
          registrationFee: regFee,
          programFee: progFee,
        }),
      });
      if (res.ok) {
        setIsConfigOpen(false);
        loadData();
      }
    } catch {
      alert('Error updating fee configuration');
    }
  };

  const handleManualVerify = async (orderId: string) => {
    if (!confirm(`Mark payment order ${orderId} as verified? An official receipt will be generated.`)) return;
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MANUAL_VERIFY', orderId }),
      });
      if (res.ok) {
        alert('Payment verified successfully!');
        loadData();
      }
    } catch {
      alert('Error verifying payment');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Administration & Receipts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Razorpay transaction ledger, fee schedule configuration, and receipt verification.
            </p>
          </div>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="btn-ivr-secondary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-[#6D28D9]" />
            Configure Fee Schedule
          </button>
        </div>

        {/* Financial KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="ivr-card p-5 bg-white border-l-4 border-l-emerald-600">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue Collected</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{metrics.totalCollected.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {metrics.successfulCount} transactions settled
              </span>
            </div>

            <div className="ivr-card p-5 bg-white border-l-4 border-l-amber-500">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Invoices</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{metrics.pendingAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                {metrics.pendingCount} orders awaiting checkout
              </span>
            </div>

            <div className="ivr-card p-5 bg-white border-l-4 border-l-[#4C1D95]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Program Fee</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{settings?.programFeeINR?.toLocaleString('en-IN') || 4999}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Per fellow subsidized</span>
            </div>

            <div className="ivr-card p-5 bg-white border-l-4 border-l-purple-400">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration Fee</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{settings?.registrationFeeINR?.toLocaleString('en-IN') || 499}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Seat confirmation fee</span>
            </div>
          </div>
        )}

        {/* Transactions Ledger Table */}
        <div className="ivr-card bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Transaction & Receipt Ledger</h3>
            <span className="text-xs text-slate-400 font-mono">Gateway: Razorpay API</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{o.orderId}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{o.studentName}</div>
                      <div className="text-[11px] text-slate-400">{o.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded font-bold">
                        {o.feeType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{o.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {o.receiptNumber || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={o.status === 'SUCCESS' ? 'success' : 'warning'}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {o.status === 'PENDING' && (
                        <button
                          onClick={() => handleManualVerify(o.orderId)}
                          className="btn-ivr-primary text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
                        >
                          Manual Verify
                        </button>
                      )}
                      {o.status === 'SUCCESS' && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fee Config Modal */}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Configure Enterprise Fee Schedule">
        <form onSubmit={handleUpdateConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registration Fee (INR)</label>
            <input
              type="number"
              required
              value={regFee}
              onChange={(e) => setRegFee(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Fellowship Fee (INR)</label>
            <input
              type="number"
              required
              value={progFee}
              onChange={(e) => setProgFee(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="btn-ivr-primary text-xs font-bold px-5 py-2 rounded-lg">
              Update Fee Schedule
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
