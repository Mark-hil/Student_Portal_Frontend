import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Phone,
  Building2,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  Smartphone,
  Info,
  ChevronRight,
  Send,
  Lock,
} from 'lucide-react';
import { financialsApi } from '../../api/services';
import type { StudentStatement, PaymentRecord } from '../../types';

interface StudentFinancialsProps {
  user: any;
}

export const StudentFinancials: React.FC<StudentFinancialsProps> = ({ user }) => {
  const [statement, setStatement] = useState<StudentStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTab, setPayTab] = useState<'momo' | 'bank_advice' | 'bank_slip'>('momo');

  // MoMo Form
  const [momoProvider, setMomoProvider] = useState<'MTN MoMo' | 'Telecel Cash' | 'AT Money'>('MTN MoMo');
  const [momoPhone, setMomoPhone] = useState(user?.phone || '024');
  const [momoAmount, setMomoAmount] = useState<string>('');
  const [momoSubmitting, setMomoSubmitting] = useState(false);
  const [ussdStep, setUssdStep] = useState<'idle' | 'prompt_sent' | 'success'>('idle');
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);

  // Manual Slip Form
  const [slipBank, setSlipBank] = useState('GCB Bank');
  const [slipRef, setSlipRef] = useState('');
  const [slipAmount, setSlipAmount] = useState('');
  const [slipDate, setSlipDate] = useState(new Date().toISOString().split('T')[0]);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipSubmitting, setSlipSubmitting] = useState(false);
  const [slipSuccess, setSlipSuccess] = useState(false);

  // Bank Advice Simulator
  const [simBank, setSimBank] = useState('GCB Bank');
  const [simAmount, setSimAmount] = useState('2300.00');
  const [simulatingDeposit, setSimulatingDeposit] = useState(false);

  // Receipt download loading
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financialsApi.getMyStatement();
      setStatement(res.data);
      if (res.data && Number(res.data.balance) > 0) {
        setMomoAmount(String(res.data.balance));
        setSimAmount(String(res.data.balance));
        setSlipAmount(String(res.data.balance));
      }
    } catch (err: any) {
      console.error('Failed to load statement', err);
      setError(err?.response?.data?.detail || 'Unable to load student financial statement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleDownloadReceipt = async (paymentId: number, receiptNum: string) => {
    try {
      setDownloadingReceiptId(paymentId);
      const response = await financialsApi.getReceiptPdfBlob(paymentId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receiptNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download error', err);
      alert('Could not download receipt. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  // Submit Mobile Money payment
  const handleMoMoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoPhone || !momoAmount || Number(momoAmount) <= 0) {
      alert('Please provide a valid phone number and payment amount.');
      return;
    }

    try {
      setMomoSubmitting(true);
      setUssdStep('prompt_sent');

      setTimeout(async () => {
        try {
          const res = await financialsApi.payMoMo({
            provider: momoProvider,
            phone: momoPhone,
            amount: momoAmount,
          });
          setLastPayment(res.data);
          setUssdStep('success');
          fetchStatement();
        } catch (err: any) {
          alert(err?.response?.data?.detail || 'Payment authorization failed.');
          setUssdStep('idle');
        } finally {
          setMomoSubmitting(false);
        }
      }, 2200);
    } catch (err: any) {
      setMomoSubmitting(false);
      setUssdStep('idle');
      alert(err?.response?.data?.detail || 'Error initiating payment');
    }
  };

  // Submit Manual Slip
  const handleSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipRef || !slipAmount || Number(slipAmount) <= 0) {
      alert('Please provide the teller reference and valid deposit amount.');
      return;
    }

    try {
      setSlipSubmitting(true);
      const formData = new FormData();
      formData.append('bank_name', slipBank);
      formData.append('teller_slip_reference', slipRef);
      formData.append('amount', slipAmount);
      formData.append('deposit_date', slipDate);
      if (slipFile) {
        formData.append('slip_image', slipFile);
      }

      await financialsApi.submitBankSlip(formData);
      setSlipSuccess(true);
      fetchStatement();
      setTimeout(() => {
        setSlipSuccess(false);
        setIsPayModalOpen(false);
        setSlipRef('');
      }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit bank deposit slip.');
    } finally {
      setSlipSubmitting(false);
    }
  };

  // Simulate Instant Partner Bank Deposit (GCB / Ecobank Bank Collect)
  const handleSimulateBankDeposit = async () => {
    if (!statement) return;
    try {
      setSimulatingDeposit(true);
      const indexNum = statement.student_index || user.email;
      const bankRef = `BANK-${simBank.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      await financialsApi.bankNotify({
        student_id: indexNum,
        amount: simAmount,
        bank_name: simBank,
        branch: 'University Campus Branch',
        teller_id: 'TELLER-09',
        teller_ref: bankRef,
        bank_reference: bankRef,
        notes: 'Simulated direct over-the-counter automated bank collection',
      });

      alert(`Bank deposit of GH₵ ${Number(simAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} recorded successfully via ${simBank}!`);
      setIsPayModalOpen(false);
      fetchStatement();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to simulate bank deposit.');
    } finally {
      setSimulatingDeposit(false);
    }
  };

  if (loading && !statement) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" color="#4f46e5" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 14 }}>Loading financial statements and fee billing...</p>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div style={{ padding: 24, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, textAlign: 'center' }}>
        <AlertTriangle size={36} color="#e11d48" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#9f1239' }}>Financial Records Unavailable</h3>
        <p style={{ fontSize: 13, color: '#e11d48', marginBottom: 16 }}>{error}</p>
        <button onClick={fetchStatement} className="fin-btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const balanceNum = Number(statement?.balance || 0);
  const totalBilledNum = Number(statement?.total_billed || 0);
  const totalPaidNum = Number(statement?.total_paid || 0);
  const isPaidInFull = statement?.status === 'paid' || balanceNum <= 0;
  const hasHold = Boolean(statement?.has_active_hold);

  return (
    <div className="fin-container">
      {/* ── Top Atmospheric Hero Banner ─────────────────────────────────── */}
      <div className="fin-hero">
        <div className="fin-hero-glow-1" />
        <div className="fin-hero-glow-2" />

        <div className="fin-hero-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="fin-hero-badge">
                {statement?.semester || 'Academic Year 2024/2025'}
              </span>
              <span className="fin-hero-badge" style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#bae6fd', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                Level {statement?.academic_level || '100'}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                Index Number: <strong style={{ color: '#fff' }}>{statement?.student_index}</strong>
              </span>
            </div>
            <h1 className="fin-hero-title">Fees &amp; Financial Ledger</h1>
            <p className="fin-hero-subtitle">
              Settle semester flat fees instantly via Ghanaian Mobile Money (MTN MoMo, Telecel Cash, AT Money) or direct bank branch deposit.
            </p>
          </div>

          <div className="fin-hero-actions">
            <button
              onClick={async () => {
                try {
                  setExportingCsv(true);
                  await financialsApi.exportMyStatementCsv(`statement_${statement?.student_index || 'me'}.csv`);
                } catch (err) {
                  alert('Failed to export statement CSV');
                } finally {
                  setExportingCsv(false);
                }
              }}
              disabled={exportingCsv}
              className="fin-btn-outline"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: 13 }}
            >
              <Download size={16} />
              {exportingCsv ? 'Exporting...' : 'Export Statement (CSV)'}
            </button>
            <button
              onClick={() => {
                setUssdStep('idle');
                setIsPayModalOpen(true);
              }}
              className="fin-btn-gold"
            >
              <CreditCard size={18} />
              Pay Semester Fees (GH₵)
            </button>
            <button
              onClick={fetchStatement}
              title="Refresh Statement"
              className="fin-btn-outline"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Registration Hold Banner ── */}
        {hasHold ? (
          <div className="fin-alert-banner fin-alert-hold">
            <ShieldAlert size={22} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fee2e2' }}>
                Course Registration Hold Active
              </div>
              <div style={{ fontSize: 13, color: '#fca5a5', marginTop: 3, lineHeight: 1.4 }}>
                {statement?.active_hold_reason || 'You have outstanding semester fee arrears exceeding GH₵ 500.00. Course registration is blocked until fees are settled below GH₵ 500.00.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="fin-alert-banner fin-alert-clear">
            <ShieldCheck size={20} color="#34d399" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d1fae5' }}>
              Clear Financial Standing &mdash; Approved for Semester Course Registration.
            </div>
          </div>
        )}
      </div>

      {/* ── Key Financial Stat Cards (GH₵) ────────────────────────────── */}
      <div className="fin-stats-grid">
        {/* Outstanding Balance */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">OUTSTANDING BALANCE</span>
            <span className={`fin-stat-badge ${isPaidInFull ? 'fin-stat-badge-paid' : 'fin-stat-badge-arrears'}`}>
              {isPaidInFull ? 'Paid in Full' : 'Arrears Due'}
            </span>
          </div>
          <div className={`fin-stat-val ${isPaidInFull ? 'emerald' : 'amber'}`}>
            GH₵ {balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="fin-stat-sub">
            {statement?.due_date ? `Due Date: ${new Date(statement.due_date).toLocaleDateString()}` : 'Flat Semester Billing'}
          </div>
        </div>

        {/* Total Billed */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">TOTAL BILLED (LEVEL {statement?.academic_level || '100'})</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>Dynamic Schedule</span>
          </div>
          <div className="fin-stat-val indigo">
            GH₵ {totalBilledNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="fin-stat-sub">
            {statement?.bursary_aid && Number(statement.bursary_aid) > 0 ? (
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>Includes GH₵ {Number(statement.bursary_aid).toFixed(2)} Bursary</span>
            ) : (
              'University Consolidated Rate'
            )}
          </div>
        </div>

        {/* Total Paid */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">TOTAL PAID TO DATE</span>
            <span className="fin-stat-badge fin-stat-badge-paid">Verified</span>
          </div>
          <div className="fin-stat-val emerald">
            GH₵ {totalPaidNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="fin-stat-sub">
            {statement?.payments?.filter(p => p.status === 'completed').length || 0} Successful Transactions
          </div>
        </div>

        {/* Registration Hold Status */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">ACADEMIC CLEARANCE</span>
            <span className={`fin-stat-badge ${hasHold ? 'fin-stat-badge-hold' : 'fin-stat-badge-paid'}`}>
              {hasHold ? 'Blocked' : 'Approved'}
            </span>
          </div>
          <div className={`fin-stat-val ${hasHold ? 'rose' : 'emerald'}`}>
            {hasHold ? 'Hold Active' : 'Eligible'}
          </div>
          <div className="fin-stat-sub">
            {hasHold ? 'Requires balance below GH₵ 500' : 'Permitted to register semester courses'}
          </div>
        </div>
      </div>

      {/* ── Split Section: Fee Breakdown vs Payment Channels ───────────── */}
      <div className="fin-split-grid">
        {/* Left: Itemized Tariff Breakdown */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <h2 className="fin-card-title">
                <Receipt size={20} color="#4f46e5" />
                Level {statement?.academic_level || '100'} Fee Breakdown
              </h2>
              <div className="fin-card-sub">
                Flat university schedule for Level {statement?.academic_level || '100'} approved dynamically by the Finance Directorate
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: '#eef2ff', color: '#4338ca', borderRadius: 8 }}>
              Ghana Cedis (GH₵)
            </span>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="fin-fee-row">
              <div>
                <div className="fin-fee-name">Academic Facility &amp; Tuition User Fee</div>
                <div className="fin-fee-desc">Classroom teaching, department laboratory equipment, instructional resources</div>
              </div>
              <div className="fin-fee-amount">
                GH₵ {Number(statement?.academic_fee || 3850).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="fin-fee-row">
              <div>
                <div className="fin-fee-name">ICT &amp; Digital Library Levy</div>
                <div className="fin-fee-desc">Campus high-speed WiFi, UniPortal cloud hosting, global academic e-journals</div>
              </div>
              <div className="fin-fee-amount">
                GH₵ {Number(statement?.ict_library_fee || 350).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="fin-fee-row">
              <div>
                <div className="fin-fee-name">End-of-Semester Examination Administration</div>
                <div className="fin-fee-desc">Invigilation, examination stationery, scripts grading, external moderation</div>
              </div>
              <div className="fin-fee-amount">
                GH₵ {Number(statement?.examination_fee || 220).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="fin-fee-row">
              <div>
                <div className="fin-fee-name">Students Representative Council (SRC) Dues</div>
                <div className="fin-fee-desc">Student welfare fund, campus activities, representation, and accident insurance</div>
              </div>
              <div className="fin-fee-amount">
                GH₵ {Number(statement?.src_dues || 180).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {Number(statement?.bursary_aid || 0) > 0 && (
              <div className="fin-fee-row" style={{ background: '#f5f3ff', padding: '12px 16px', borderRadius: 10, margin: '8px 0' }}>
                <div>
                  <div className="fin-fee-name" style={{ color: '#6d28d9' }}>Less: Scholarship / Bursary Award</div>
                  <div className="fin-fee-desc" style={{ color: '#8b5cf6' }}>University Council tuition remission</div>
                </div>
                <div className="fin-fee-amount" style={{ color: '#6d28d9' }}>
                  - GH₵ {Number(statement?.bursary_aid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            <div className="fin-fee-total-row">
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Total Semester Fees Payable</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#4f46e5' }}>
                GH₵ {totalBilledNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Payment Channels Guide */}
        <div className="fin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-title">
                  <Smartphone size={18} color="#f59e0b" />
                  How to Pay Your Fees
                </h3>
                <div className="fin-card-sub">Instant clearance &amp; receipts</div>
              </div>
            </div>

            <div className="fin-channel-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                1. Mobile Money (MoMo)
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                Instant authorization via <strong>MTN MoMo, Telecel Cash, or AT Money</strong>. Enters ledger immediately.
              </p>
            </div>

            <div className="fin-channel-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                2. Partner Bank Direct Collect
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                Pay over-the-counter at <strong>GCB Bank, Ecobank, Zenith Bank, CalBank</strong> quoting your Index Number.
              </p>
            </div>

            <div className="fin-channel-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                3. Manual Bank Slip (Fallback)
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                Upload paper teller slip reference if paid at remote branches for Bursary verification.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setUssdStep('idle');
              setIsPayModalOpen(true);
            }}
            className="fin-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          >
            Open Payment Terminal →
          </button>
        </div>
      </div>

      {/* ── Payment Records & PDF Receipts Table ────────────────────────── */}
      <div className="fin-card">
        <div className="fin-card-header">
          <div>
            <h2 className="fin-card-title">
              <Receipt size={20} color="#059669" />
              Verified Payment History &amp; Official Receipts
            </h2>
            <div className="fin-card-sub">
              Official digital receipts certified with University Cashier stamp and verification codes
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={async () => {
                try {
                  setExportingCsv(true);
                  await financialsApi.exportMyStatementCsv(`statement_${statement?.student_index || 'me'}.csv`);
                } catch (err) {
                  alert('Failed to export statement CSV');
                } finally {
                  setExportingCsv(false);
                }
              }}
              disabled={exportingCsv}
              className="fin-btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px', gap: 6 }}
            >
              <Download size={14} />
              {exportingCsv ? 'Exporting...' : 'Export Statement (CSV)'}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {statement?.payments?.length || 0} transaction(s) recorded
            </span>
          </div>
        </div>

        {(!statement?.payments || statement.payments.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
            <Receipt size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No fee payments on record yet</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Click &quot;Pay Semester Fees&quot; above to make a payment and download your certified receipt.
            </div>
          </div>
        ) : (
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Date</th>
                  <th>Payment Channel</th>
                  <th>Reference / Slip No.</th>
                  <th style={{ textAlign: 'right' }}>Amount (GH₵)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Official PDF</th>
                </tr>
              </thead>
              <tbody>
                {statement.payments.map((p) => {
                  const isCompleted = p.status === 'completed';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                        {p.receipt_number}
                      </td>
                      <td style={{ color: '#475569', fontSize: 12 }}>
                        {new Date(p.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          {p.channel === 'momo' ? (
                            <Smartphone size={16} color="#d97706" />
                          ) : (
                            <Building2 size={16} color="#2563eb" />
                          )}
                          <span>{p.provider}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                        {p.reference_number || '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        GH₵ {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isCompleted ? '#ecfdf5' : '#fffbeb',
                            color: isCompleted ? '#059669' : '#d97706',
                            border: `1px solid ${isCompleted ? '#a7f3d0' : '#fde68a'}`,
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {isCompleted ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isCompleted ? (
                          <button
                            onClick={() => handleDownloadReceipt(p.id, p.receipt_number)}
                            disabled={downloadingReceiptId === p.id}
                            className="fin-btn-receipt"
                          >
                            <Download size={13} />
                            PDF Receipt
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Pending Review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Make Payment Modal (Rich Interactive UI) ─────────────────────── */}
      {isPayModalOpen && (
        <div className="fin-modal-overlay">
          <div className="fin-modal-card">
            <div className="fin-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={20} color="#4f46e5" />
                  Settle Semester Fees
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Student: <strong>{statement?.student_name}</strong> &bull; Index: <strong>{statement?.student_index}</strong>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPayModalOpen(false);
                  setUssdStep('idle');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab switch */}
            <div className="fin-modal-tabs">
              <button
                onClick={() => setPayTab('momo')}
                className={`fin-tab-btn ${payTab === 'momo' ? 'active' : ''}`}
              >
                <Smartphone size={16} />
                Mobile Money (MoMo)
              </button>
              <button
                onClick={() => setPayTab('bank_advice')}
                className={`fin-tab-btn ${payTab === 'bank_advice' ? 'active' : ''}`}
              >
                <Building2 size={16} />
                Bank Direct (Branch Collect)
              </button>
              <button
                onClick={() => setPayTab('bank_slip')}
                className={`fin-tab-btn ${payTab === 'bank_slip' ? 'active' : ''}`}
              >
                <FileText size={16} />
                Submit Deposit Slip
              </button>
            </div>

            <div className="fin-modal-body">
              {/* TAB 1: Mobile Money */}
              {payTab === 'momo' && (
                <div>
                  {ussdStep === 'idle' && (
                    <form onSubmit={handleMoMoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                          Select Mobile Network
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {[
                            { name: 'MTN MoMo', bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
                            { name: 'Telecel Cash', bg: '#fef2f2', border: '#ef4444', color: '#991b1b' },
                            { name: 'AT Money', bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
                          ].map((prov) => (
                            <button
                              key={prov.name}
                              type="button"
                              onClick={() => setMomoProvider(prov.name as any)}
                              style={{
                                padding: '12px 8px',
                                borderRadius: 12,
                                border: `2px solid ${momoProvider === prov.name ? prov.border : '#e2e8f0'}`,
                                background: momoProvider === prov.name ? prov.bg : '#ffffff',
                                color: momoProvider === prov.name ? prov.color : '#475569',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {prov.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Mobile Money Phone Number
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                          <input
                            type="tel"
                            required
                            placeholder="024XXXXXXX"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 14px 10px 36px',
                              borderRadius: 10,
                              border: '1px solid #cbd5e1',
                              fontSize: 14,
                              fontWeight: 600,
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                          An approval prompt will be sent directly to your phone screen.
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Amount to Pay (Ghana Cedis GH₵)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: 11, fontWeight: 800, color: '#64748b' }}>GH₵</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            placeholder="0.00"
                            value={momoAmount}
                            onChange={(e) => setMomoAmount(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 14px 10px 52px',
                              borderRadius: 10,
                              border: '1px solid #cbd5e1',
                              fontSize: 16,
                              fontWeight: 900,
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Quick chips */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setMomoAmount(String(balanceNum))}
                            style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Full Balance: GH₵ {balanceNum.toFixed(2)}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMomoAmount((balanceNum / 2).toFixed(2))}
                            style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            50% Part Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => setMomoAmount('1000.00')}
                            style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            GH₵ 1,000.00
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={momoSubmitting}
                        className="fin-btn-gold"
                        style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', marginTop: 8 }}
                      >
                        <Smartphone size={18} />
                        Authorize MoMo Payment of GH₵ {Number(momoAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </button>
                    </form>
                  )}

                  {/* USSD Prompt Simulation */}
                  {ussdStep === 'prompt_sent' && (
                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: '#fffbeb',
                          border: '2px solid #f59e0b',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}
                      >
                        <Smartphone size={32} className="animate-bounce" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                        USSD Approval Prompt Sent
                      </h4>
                      <p style={{ margin: '8px auto', fontSize: 13, color: '#64748b', maxWidth: 360 }}>
                        Please enter your <strong>{momoProvider}</strong> PIN on your phone (<strong>{momoPhone}</strong>) to authorize the payment of{' '}
                        <strong>GH₵ {Number(momoAmount).toFixed(2)}</strong>.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#4f46e5', fontSize: 12, fontWeight: 700, marginTop: 16 }}>
                        <RefreshCw size={16} className="animate-spin" />
                        Listening for Telco Webhook confirmation...
                      </div>
                    </div>
                  )}

                  {/* Success Screen */}
                  {ussdStep === 'success' && lastPayment && (
                    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: '#ecfdf5',
                          border: '2px solid #10b981',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}
                      >
                        <CheckCircle2 size={36} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                        Payment Verified Successfully!
                      </h4>
                      <p style={{ margin: '6px 0', fontSize: 13, color: '#64748b' }}>
                        Receipt Number: <strong style={{ color: '#4f46e5', fontFamily: 'monospace' }}>{lastPayment.receipt_number}</strong>
                      </p>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#059669', marginBottom: 20 }}>
                        GH₵ {Number(lastPayment.amount).toFixed(2)} Credited to Student Ledger
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleDownloadReceipt(lastPayment.id, lastPayment.receipt_number)}
                          className="fin-btn-primary"
                        >
                          <Download size={16} />
                          Download Official PDF Receipt
                        </button>
                        <button
                          onClick={() => {
                            setIsPayModalOpen(false);
                            setUssdStep('idle');
                          }}
                          className="fin-btn-outline"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Bank Direct Branch Collect */}
              {payTab === 'bank_advice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                      Walk-in Bank Branch Collect
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#1e3a8a', lineHeight: 1.4 }}>
                      Visit any nationwide branch of <strong>GCB Bank, Ecobank Ghana, Zenith Bank, CalBank, or Stanbic Bank</strong>.
                      Present your Student Index Number below to the teller. The bank system queries your balance and posts payments in real time.
                    </p>
                  </div>

                  {/* Voucher Card */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 14, padding: 16, background: '#f8fafc', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>BANK ADVICE VOUCHER</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5' }}>{statement?.semester}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div>
                        <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>STUDENT INDEX NUMBER</span>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>{statement?.student_index}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>STUDENT NAME</span>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{statement?.student_name}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>DEGREE PROGRAM</span>
                        <span style={{ color: '#334155' }}>Undergraduate Degree</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>CURRENT BALANCE</span>
                        <strong style={{ color: '#059669', fontSize: 13 }}>
                          GH₵ {balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Simulator for demo */}
                  <div style={{ padding: 14, background: '#f1f5f9', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
                        ⚡ Simulate Instant Partner Bank Deposit
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#cbd5e1', borderRadius: 4 }}>
                        Instant Test
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11, color: '#64748b' }}>
                      Test the exact webhook a partner bank teller triggers when receiving cash at their counter:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          BANK PARTNER
                        </label>
                        <select
                          value={simBank}
                          onChange={(e) => setSimBank(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                        >
                          <option value="GCB Bank">GCB Bank</option>
                          <option value="Ecobank Ghana">Ecobank Ghana</option>
                          <option value="Zenith Bank">Zenith Bank</option>
                          <option value="CalBank">CalBank</option>
                          <option value="Stanbic Bank">Stanbic Bank</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          AMOUNT (GH₵)
                        </label>
                        <input
                          type="number"
                          value={simAmount}
                          onChange={(e) => setSimAmount(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800 }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={simulatingDeposit}
                      onClick={handleSimulateBankDeposit}
                      className="fin-btn-primary"
                      style={{ width: '100%', justifyContent: 'center', background: '#2563eb' }}
                    >
                      <Building2 size={16} />
                      {simulatingDeposit ? 'Triggering Bank Webhook...' : `Simulate ${simBank} Cash Deposit`}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Manual Bank Slip Fallback */}
              {payTab === 'bank_slip' && (
                <div>
                  {slipSuccess ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                      <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                        Deposit Slip Submitted!
                      </h4>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0' }}>
                        The University Bursar will verify the teller reference and update your statement within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSlipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e' }}>
                        Use this form if you paid using a physical paper deposit slip at a branch without live network connectivity.
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            Bank Name
                          </label>
                          <select
                            value={slipBank}
                            onChange={(e) => setSlipBank(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                          >
                            <option value="GCB Bank">GCB Bank</option>
                            <option value="Ecobank Ghana">Ecobank Ghana</option>
                            <option value="Zenith Bank">Zenith Bank</option>
                            <option value="CalBank">CalBank</option>
                            <option value="Stanbic Bank">Stanbic Bank</option>
                            <option value="Absa Ghana">Absa Ghana</option>
                            <option value="Fidelity Bank">Fidelity Bank</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            Deposit Date
                          </label>
                          <input
                            type="date"
                            value={slipDate}
                            onChange={(e) => setSlipDate(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            Teller Slip Ref Number
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. GCB-SLIP-99214"
                            value={slipRef}
                            onChange={(e) => setSlipRef(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontFamily: 'monospace' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            Amount (GH₵)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={slipAmount}
                            onChange={(e) => setSlipAmount(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Deposit Slip Image / Scan (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                          style={{ width: '100%', padding: '6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={slipSubmitting}
                        className="fin-btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                      >
                        {slipSubmitting ? 'Submitting Slip...' : 'Submit Deposit Slip for Bursar Review'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
