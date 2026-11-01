'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import IVRLogo from '@/components/IVRLogo';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Receipt,
  ShieldCheck,
  Smartphone,
  Building,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';

interface Transaction {
  id: string;
  paymentId: string;
  method: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  feeType: 'REGISTRATION' | 'PROGRAM_FEE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  razorpayPaymentId?: string | null;
  receiptNumber?: string | null;
  createdAt: string;
  transactions: Transaction[];
}

interface PaymentData {
  orders: PaymentOrder[];
  feeConfig: {
    registrationFee: number;
    programFee: number;
    currency: string;
    razorpayKeyId: string;
  };
  statusSummary: {
    isRegistrationFeePaid: boolean;
    isProgramFeePaid: boolean;
    allSettled: boolean;
  };
}

export default function StudentPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutFeeType, setCheckoutFeeType] = useState<'REGISTRATION' | 'PROGRAM_FEE' | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'NETBANKING' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState('fellow@okaxis');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<PaymentOrder | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/payments');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openCheckout = (type: 'REGISTRATION' | 'PROGRAM_FEE') => {
    setCheckoutFeeType(type);
    setErrorMsg('');
    setIsCheckoutOpen(true);
  };

  const handleSimulatePayment = async () => {
    if (!checkoutFeeType) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      // 1. Create order
      const orderRes = await fetch('/api/student/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeType: checkoutFeeType }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderJson.error || 'Failed to initialize order');

      // 2. Simulate Razorpay verification
      const verifyRes = await fetch('/api/student/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderJson.order.orderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'test_sig_verified_enterprise',
          method: selectedMethod,
        }),
      });

      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson.error || 'Payment verification failed');

      setIsCheckoutOpen(false);
      await fetchPayments();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Payment could not be processed');
      }
    } finally {
      setProcessing(false);
    }
  };

  const isRegPaid = data?.statusSummary.isRegistrationFeePaid || false;
  const isProgPaid = data?.statusSummary.isProgramFeePaid || false;
  const regFee = data?.feeConfig.registrationFee || 499;
  const progFee = data?.feeConfig.programFee || 4999;

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Internship Fees & Official Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Secure GST-compliant transactions via Razorpay. Download official enterprise tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                data?.statusSummary.allSettled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {data?.statusSummary.allSettled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Financial Clearance Granted
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending Fee Clearance
                </>
              )}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Registration Fee"
            value={`₹${regFee.toLocaleString()}`}
            subtext={isRegPaid ? 'Settled on Application' : 'Payment Pending'}
            icon={<CheckCircle2 className={`w-5 h-5 ${isRegPaid ? 'text-emerald-600' : 'text-amber-600'}`} />}
          />
          <StatCard
            label="Program Fellowship Fee"
            value={`₹${progFee.toLocaleString()}`}
            subtext={isProgPaid ? 'Full Clearance Approved' : 'Required before Certificate Release'}
            icon={<CreditCard className={`w-5 h-5 ${isProgPaid ? 'text-emerald-600' : 'text-purple-600'}`} />}
          />
          <StatCard
            label="Total Settled"
            value={`₹${((isRegPaid ? regFee : 0) + (isProgPaid ? progFee : 0)).toLocaleString()}`}
            subtext="GST Inclusive (18% HSN 999293)"
            icon={<Receipt className="w-5 h-5 text-indigo-600" />}
          />
        </div>

        {/* Action Banners if dues pending */}
        {!isProgPaid && (
          <div className="bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#6D28D9] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Final Settlement Required
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                Program Fellowship Fee: ₹{progFee.toLocaleString()}
              </h3>
              <p className="text-xs text-purple-200 max-w-xl">
                Settling your program fee unlocks full eligibility for the digitally signed IVR TECH SOLUTIONS Certificate, accredited letter of recommendation, and alumni placement council.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => openCheckout('PROGRAM_FEE')}
              className="bg-white text-[#4C1D95] hover:bg-purple-50 font-bold shrink-0 text-xs px-6 py-3 shadow-lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ₹{progFee.toLocaleString()} via Razorpay
            </Button>
          </div>
        )}

        {/* Transaction History & Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Invoices & Receipts</h3>
              <p className="text-xs text-slate-500">Record of settled program dues and downloadable receipts</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit TLS Encrypted</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Fee Item</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Receipt No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading payment invoices...
                    </td>
                  </tr>
                ) : data?.orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No invoices recorded.
                    </td>
                  </tr>
                ) : (
                  data?.orders.map((order) => {
                    const isSuccess = order.status === 'SUCCESS';
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {order.orderId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {order.feeType === 'REGISTRATION' ? 'Application Registration' : 'Fellowship Program Fee'}
                          </span>
                          <span className="text-[10px] text-slate-400">HSN 999293 (Vocational Training)</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{order.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isSuccess && <Check className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {order.receiptNumber || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSuccess ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReceiptOrder(order)}
                              className="text-xs"
                            >
                              <Receipt className="w-3.5 h-3.5 mr-1 text-[#6D28D9]" />
                              View Invoice
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openCheckout(order.feeType)}
                              className="text-xs"
                            >
                              Retry Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Razorpay Checkout Modal */}
        <Modal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          title={`Razorpay Checkout - ${checkoutFeeType === 'REGISTRATION' ? 'Registration' : 'Fellowship'} Fee`}
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fee Item:</span>
                <span className="font-semibold text-slate-800">
                  {checkoutFeeType === 'REGISTRATION' ? 'Application & Portal Access' : 'Fellowship Tuition & Certification'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Amount:</span>
                <span>
                  ₹{Math.round((checkoutFeeType === 'REGISTRATION' ? regFee : progFee) / 1.18).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% IGST):</span>
                <span>
                  ₹{(
                    (checkoutFeeType === 'REGISTRATION' ? regFee : progFee) -
                    Math.round((checkoutFeeType === 'REGISTRATION' ? regFee : progFee) / 1.18)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount Payable:</span>
                <span className="text-[#5B21B6]">
                  ₹{(checkoutFeeType === 'REGISTRATION' ? regFee : progFee).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Payment Instrument:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'UPI'
                      ? 'border-[#7C3AED] bg-purple-50 text-[#5B21B6] font-bold ring-2 ring-[#7C3AED]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mb-1" />
                  <span className="text-xs block">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('NETBANKING')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'NETBANKING'
                      ? 'border-[#7C3AED] bg-purple-50 text-[#5B21B6] font-bold ring-2 ring-[#7C3AED]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building className="w-4 h-4 mb-1" />
                  <span className="text-xs block">Netbanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'CARD'
                      ? 'border-[#7C3AED] bg-purple-50 text-[#5B21B6] font-bold ring-2 ring-[#7C3AED]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span className="text-xs block">Debit / Card</span>
                </button>
              </div>
            </div>

            {selectedMethod === 'UPI' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okaxis or mobile@upi"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Razorpay Sandbox Simulation active. Instant verification and receipt generation.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSimulatePayment}
                disabled={processing}
              >
                {processing ? 'Authorizing Payment...' : `Authorize & Settle ₹${(checkoutFeeType === 'REGISTRATION' ? regFee : progFee).toLocaleString()}`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Official Tax Invoice / Receipt Modal */}
        <Modal
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          title="Official Tax Invoice & Receipt"
        >
          {receiptOrder && (
            <div className="space-y-5 text-xs text-slate-700 print:text-black">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <IVRLogo size="sm" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    IVR TECH SOLUTIONS PRIVATE LIMITED
                    <br />
                    Remote-First Corporate Operations, India
                    <br />
                    GSTIN: 27AABCI9821K1ZZ | PAN: AABCI9821K
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    TAX INVOICE - PAID
                  </span>
                  <p className="text-[11px] font-bold text-slate-800 mt-2">
                    Receipt: {receiptOrder.receiptNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Date: {new Date(receiptOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Order Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Billed To Fellow:</span>
                  <span className="font-bold text-slate-800">Authorized Internship Fellow</span>
                  <span className="text-[11px] text-slate-500 block">Order Ref: {receiptOrder.orderId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Gateway:</span>
                  <span className="font-bold text-slate-800">Razorpay Mumbai Node</span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    ID: {receiptOrder.razorpayPaymentId || 'pay_live_settled'}
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">HSN Code</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-800">
                      {receiptOrder.feeType === 'REGISTRATION'
                        ? 'IVR Internship Entrance & Registration Fee'
                        : 'IVR Fellowship Program Fee & Industrial Certification'}
                    </td>
                    <td className="p-2.5 font-mono text-slate-500">999293</td>
                    <td className="p-2.5 text-right font-mono">
                      ₹{Math.round(receiptOrder.amount / 1.18).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      ₹{receiptOrder.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Signatory */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                <div className="text-[10px] text-slate-400">
                  This is a computer-generated tax invoice verified under the IT Act 2000.
                </div>
                <div className="text-right">
                  <div className="font-serif italic font-bold text-slate-800 text-sm">
                    Accounts Directorate
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    Finance Directorate, IVR TECH SOLUTIONS PVT LTD
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print / Save PDF
                </Button>
                <Button variant="primary" size="sm" onClick={() => setReceiptOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
