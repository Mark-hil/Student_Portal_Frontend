import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building2,
  Smartphone,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Award,
  Settings,
  Receipt,
  Download,
  Filter,
  Users,
  ShieldAlert,
  Code2,
  Copy,
  ExternalLink,
  Terminal,
  BookOpen,
  Send,
  Lock,
  Layers,
  X,
  Eye,
  FileText,
  RotateCcw,
  Calculator,
  Play,
  ArrowRight,
  HelpCircle,
  Check,
  CheckSquare,
} from 'lucide-react';
import { financialsApi } from '../../api/services';
import type { BursarOverview, PaymentRecord, SemesterFeeStructure, RefundRecord } from '../../types';

export interface BursarManagementProps {
  initialTab?: 'overview' | 'tariffs' | 'slips' | 'refunds' | 'bank_api' | 'bursary';
}

export const BursarManagement: React.FC<BursarManagementProps> = ({ initialTab = 'overview' }) => {
  const [data, setData] = useState<BursarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tariffs' | 'slips' | 'refunds' | 'bank_api' | 'bursary'>(initialTab);
  const [exportingStatements, setExportingStatements] = useState(false);
  const [exportingPayments, setExportingPayments] = useState(false);

  // Bank Teller Simulator State
  const [tellerSearchId, setTellerSearchId] = useState('');
  const [tellerSearching, setTellerSearching] = useState(false);
  const [tellerStudent, setTellerStudent] = useState<any | null>(null);
  const [tellerBank, setTellerBank] = useState('GCB Bank');
  const [tellerAmount, setTellerAmount] = useState('');
  const [tellerPosting, setTellerPosting] = useState(false);
  const [tellerSuccessMsg, setTellerSuccessMsg] = useState<string | null>(null);

  // Bursary Award State
  const [bursaryStudentId, setBursaryStudentId] = useState('');
  const [bursaryAmount, setBursaryAmount] = useState('');
  const [bursaryReason, setBursaryReason] = useState('Vice-Chancellor Merit Scholarship');
  const [bursarySubmitting, setBursarySubmitting] = useState(false);
  const [bursaryMsg, setBursaryMsg] = useState<string | null>(null);

  // Dynamic Level Tariff Editor State
  const [selectedLevel, setSelectedLevel] = useState<string>('100');
  const [levelSemester, setLevelSemester] = useState<string>('First Semester 2024/2025');
  const [levelTitle, setLevelTitle] = useState<string>('Level 100 (Freshmen)');
  const [levelAcademicFee, setLevelAcademicFee] = useState<string>('4200.00');
  const [levelIctFee, setLevelIctFee] = useState<string>('450.00');
  const [levelSrcDues, setLevelSrcDues] = useState<string>('250.00');
  const [levelExamFee, setLevelExamFee] = useState<string>('300.00');
  const [recalculateStudents, setRecalculateStudents] = useState<boolean>(true);
  const [savingTariff, setSavingTariff] = useState<boolean>(false);
  const [tariffSuccessMsg, setTariffSuccessMsg] = useState<string | null>(null);
  const [allFeeStructures, setAllFeeStructures] = useState<SemesterFeeStructure[]>([]);

  // Slip action state
  const [verifyingSlipId, setVerifyingSlipId] = useState<number | null>(null);
  const [rejectModalSlip, setRejectModalSlip] = useState<PaymentRecord | null>(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>('Reference not found on official bank statement');
  const [rejectCustomNote, setRejectCustomNote] = useState<string>('');
  const [previewSlip, setPreviewSlip] = useState<PaymentRecord | null>(null);

  // Receipt download
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Synchronize initialTab if prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Bulk Billing Cycle State
  const [billingSemester, setBillingSemester] = useState('First Semester 2024/2025');
  const [billingLevel, setBillingLevel] = useState('all');
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  // Student Refunds Management State
  const [refundsList, setRefundsList] = useState<RefundRecord[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all');
  const [actionRefundModal, setActionRefundModal] = useState<{ item: RefundRecord; action: 'disburse' | 'reject' } | null>(null);
  const [refundActionNotes, setRefundActionNotes] = useState('');
  const [refundActionRef, setRefundActionRef] = useState('');
  const [submittingRefundAction, setSubmittingRefundAction] = useState(false);

  const selectLevel = useCallback((level: string, structures?: SemesterFeeStructure[]) => {
    setSelectedLevel(level);
    setTariffSuccessMsg(null);
    const list = structures || allFeeStructures;
    const match = list.find(s => (s.academic_level || '100') === level);
    if (match) {
      setLevelTitle(match.level_title || `Level ${level}`);
      setLevelSemester(match.semester || 'First Semester 2024/2025');
      setLevelAcademicFee(String(match.academic_fee));
      setLevelIctFee(String(match.ict_library_fee));
      setLevelSrcDues(String(match.src_dues));
      setLevelExamFee(String(match.examination_fee));
    }
  }, [allFeeStructures]);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financialsApi.getAdminOverview();
      setData(res.data);
      if (res.data.fee_structures && res.data.fee_structures.length > 0) {
        setAllFeeStructures(res.data.fee_structures);
        const currentMatch = res.data.fee_structures.find(s => s.academic_level === selectedLevel) || res.data.fee_structures[0];
        if (currentMatch) {
          setLevelTitle(currentMatch.level_title || `Level ${currentMatch.academic_level}`);
          setLevelAcademicFee(String(currentMatch.academic_fee));
          setLevelIctFee(String(currentMatch.ict_library_fee));
          setLevelSrcDues(String(currentMatch.src_dues));
          setLevelExamFee(String(currentMatch.examination_fee));
          setLevelSemester(currentMatch.semester);
        }
      }
    } catch (err: any) {
      console.error('Failed to load bursar overview', err);
      setError(err?.response?.data?.detail || 'Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  }, [selectedLevel]);

  const handleSaveTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTariff(true);
      setTariffSuccessMsg(null);
      const res = await financialsApi.updateFeeStructure({
        academic_level: selectedLevel,
        level_title: levelTitle,
        semester: levelSemester,
        academic_fee: levelAcademicFee,
        ict_library_fee: levelIctFee,
        src_dues: levelSrcDues,
        examination_fee: levelExamFee,
        recalculate_students: recalculateStudents,
      });

      setTariffSuccessMsg(
        `Updated ${res.data.fee_structure?.level_title || selectedLevel}! Consolidated Fee: GH₵ ${Number(res.data.fee_structure?.total_fee).toFixed(2)}`
      );
      if (res.data.all_structures) {
        setAllFeeStructures(res.data.all_structures);
      }
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update level fee tariff.');
    } finally {
      setSavingTariff(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Fetch Refunds List for Admin
  const fetchRefunds = useCallback(async () => {
    try {
      setLoadingRefunds(true);
      const res = await financialsApi.getAdminRefunds();
      setRefundsList(res.data);
    } catch (err) {
      console.error('Failed to load refund records', err);
    } finally {
      setLoadingRefunds(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'refunds') {
      fetchRefunds();
    }
  }, [activeTab, fetchRefunds]);

  // Bulk Billing Handler
  const handleRunBulkBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingSemester.trim()) {
      alert('Please enter a target semester.');
      return;
    }
    const targetLabel = billingLevel === 'all' ? 'All Enrolled Students' : `Level ${billingLevel}`;
    const confirmed = window.confirm(
      `Execute Billing Cycle for "${billingSemester}"?\nTarget: ${targetLabel}\n\nThis will evaluate level fee tariffs, automatically roll over student credit surpluses (overpayments), and apply any prior arrears.`
    );
    if (!confirmed) return;

    try {
      setBillingRunning(true);
      setBillingResult(null);
      const res = await financialsApi.billStudents({
        semester: billingSemester.trim(),
        academic_level: billingLevel === 'all' ? undefined : billingLevel,
      });
      setBillingResult({
        success: true,
        message: res.data.message || 'Billing cycle executed successfully.',
        data: res.data,
      });
      fetchOverview();
    } catch (err: any) {
      setBillingResult({
        success: false,
        message: err?.response?.data?.detail || 'Failed to execute semester billing cycle.',
      });
    } finally {
      setBillingRunning(false);
    }
  };

  // Process Refund Action (Disburse or Reject)
  const handleProcessRefundAction = async () => {
    if (!actionRefundModal) return;
    try {
      setSubmittingRefundAction(true);
      await financialsApi.processRefund(actionRefundModal.item.id, {
        approve: actionRefundModal.action === 'disburse',
        disbursement_ref: refundActionRef.trim() || undefined,
        notes: refundActionNotes.trim() || undefined,
      });
      alert(`Refund request ${actionRefundModal.action === 'disburse' ? 'approved and marked disbursed' : 'rejected'} successfully.`);
      setActionRefundModal(null);
      setRefundActionNotes('');
      setRefundActionRef('');
      fetchRefunds();
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to process refund request.');
    } finally {
      setSubmittingRefundAction(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Bank Lookup Handler
  const handleBankLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tellerSearchId.trim()) return;

    try {
      setTellerSearching(true);
      setTellerSuccessMsg(null);
      setTellerStudent(null);
      const res = await financialsApi.bankLookup(tellerSearchId.trim());
      setTellerStudent(res.data);
      setTellerAmount(String(res.data.balance_due));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'No student found with that ID or Index Number.');
    } finally {
      setTellerSearching(false);
    }
  };

  // Bank Teller Post Deposit Handler
  const handlePostBankDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tellerStudent || !tellerAmount || Number(tellerAmount) <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    try {
      setTellerPosting(true);
      const bankRef = `BNK-${tellerBank.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const res = await financialsApi.bankNotify({
        student_id: tellerStudent.student_id,
        amount: tellerAmount,
        bank_name: tellerBank,
        branch: 'Accra High Street Branch',
        teller_id: 'TELLER-042',
        teller_ref: bankRef,
        bank_reference: bankRef,
        notes: `Over-the-counter automated collection at ${tellerBank}`,
      });

      setTellerSuccessMsg(`Deposit of GH₵ ${Number(tellerAmount).toFixed(2)} recorded! Receipt: ${res.data.receipt_number}`);
      const updatedLookup = await financialsApi.bankLookup(tellerStudent.student_id);
      setTellerStudent(updatedLookup.data);
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to post bank deposit.');
    } finally {
      setTellerPosting(false);
    }
  };

  // Slip Approval & Rejection Handlers
  const handleVerifySlip = async (paymentId: number, approve: boolean, notes?: string) => {
    try {
      setVerifyingSlipId(paymentId);
      await financialsApi.verifySlip(
        paymentId,
        approve,
        notes || (approve ? 'Verified by Bursary' : 'Deposit slip rejected')
      );
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update slip status.');
    } finally {
      setVerifyingSlipId(null);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectModalSlip) return;
    const finalReason =
      rejectReasonPreset === 'Other (Custom audit reason)'
        ? (rejectCustomNote.trim() || 'Declined by Accounts Office')
        : (rejectCustomNote.trim() ? `${rejectReasonPreset}: ${rejectCustomNote.trim()}` : rejectReasonPreset);

    try {
      setVerifyingSlipId(rejectModalSlip.id);
      await financialsApi.verifySlip(rejectModalSlip.id, false, finalReason);
      setRejectModalSlip(null);
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reject deposit slip.');
    } finally {
      setVerifyingSlipId(null);
    }
  };

  // Award Bursary
  const handleAwardBursary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bursaryStudentId || !bursaryAmount || Number(bursaryAmount) <= 0) {
      alert('Please provide student identifier and amount.');
      return;
    }

    try {
      setBursarySubmitting(true);
      setBursaryMsg(null);
      const res = await financialsApi.adjustStatement({
        student_id: bursaryStudentId.trim(),
        amount: bursaryAmount,
        reason: bursaryReason,
      });
      setBursaryMsg(res.data.detail);
      setBursaryAmount('');
      setBursaryStudentId('');
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to credit student bursary.');
    } finally {
      setBursarySubmitting(false);
    }
  };

  // Download Receipt
  const handleDownloadReceipt = async (paymentId: number, receiptNum: string) => {
    try {
      setDownloadingId(paymentId);
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
      alert('Failed to download receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" color="#047857" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 14 }}>Loading Bursar revenue metrics and partner bank interfaces...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_billed: 0,
    total_paid: 0,
    total_arrears: 0,
    momo_total: 0,
    bank_total: 0,
    active_holds_count: 0,
  };

  // Base API origin
  const apiOrigin = window.location.origin.replace(':3000', ':8000');
  const lookupUrl = `${apiOrigin}/api/v1/financials/bank/lookup/?student_id={STUDENT_INDEX_OR_EMAIL}`;
  const notifyUrl = `${apiOrigin}/api/v1/financials/bank/notify/`;

  return (
    <div className="fin-container">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', background: '#ecfdf5', color: '#059669', borderRadius: 99, border: '1px solid #a7f3d0' }}>
              University Cashier &amp; Treasury
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Currency Standard: <strong>Ghana Cedis (GH₵)</strong>
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Bursar Financial &amp; Bank Integration Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Real-time collection reports, partner bank webhook developer portal, deposit slip certification, and bursary aid.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                setExportingStatements(true);
                await financialsApi.exportStatementsCsv(undefined, 'bursar_fee_statements.csv');
              } catch (e) {
                alert('Failed to export fee statements CSV');
              } finally {
                setExportingStatements(false);
              }
            }}
            disabled={exportingStatements}
            className="fin-btn-outline"
          >
            <Download size={14} />
            {exportingStatements ? 'Exporting...' : 'Export Statements (CSV)'}
          </button>
          <button
            onClick={async () => {
              try {
                setExportingPayments(true);
                await financialsApi.exportPaymentsCsv(undefined, 'bursar_payments_ledger.csv');
              } catch (e) {
                alert('Failed to export payments ledger CSV');
              } finally {
                setExportingPayments(false);
              }
            }}
            disabled={exportingPayments}
            className="fin-btn-outline"
          >
            <Download size={14} />
            {exportingPayments ? 'Exporting...' : 'Export Payments (CSV)'}
          </button>
          <button onClick={fetchOverview} className="fin-btn-outline">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`fin-btn-outline ${activeTab === 'overview' ? 'active' : ''}`}
          style={{
            background: activeTab === 'overview' ? '#047857' : '#ffffff',
            color: activeTab === 'overview' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'overview' ? '#047857' : '#cbd5e1',
          }}
        >
          <TrendingUp size={15} />
          Overview &amp; Collections
        </button>

        <button
          onClick={() => setActiveTab('tariffs')}
          className={`fin-btn-outline ${activeTab === 'tariffs' ? 'active' : ''}`}
          style={{
            background: activeTab === 'tariffs' ? '#0284c7' : '#ffffff',
            color: activeTab === 'tariffs' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'tariffs' ? '#0284c7' : '#cbd5e1',
            fontWeight: 800,
          }}
        >
          <Calculator size={15} />
          Student Billing &amp; Tariffs
        </button>

        <button
          onClick={() => setActiveTab('slips')}
          className={`fin-btn-outline ${activeTab === 'slips' ? 'active' : ''}`}
          style={{
            background: activeTab === 'slips' ? '#d97706' : '#ffffff',
            color: activeTab === 'slips' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'slips' ? '#d97706' : '#cbd5e1',
          }}
        >
          <Receipt size={15} />
          Manual Slips Queue ({data?.pending_bank_slips?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`fin-btn-outline ${activeTab === 'refunds' ? 'active' : ''}`}
          style={{
            background: activeTab === 'refunds' ? '#0f766e' : '#ffffff',
            color: activeTab === 'refunds' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'refunds' ? '#0f766e' : '#cbd5e1',
            fontWeight: 700,
          }}
        >
          <RotateCcw size={15} />
          Overpayments &amp; Refunds {(Number(metrics.pending_refunds_count || data?.pending_refunds?.length || 0)) > 0 ? `(${Number(metrics.pending_refunds_count || data?.pending_refunds?.length)})` : ''}
        </button>

        <button
          onClick={() => setActiveTab('bursary')}
          className={`fin-btn-outline ${activeTab === 'bursary' ? 'active' : ''}`}
          style={{
            background: activeTab === 'bursary' ? '#7c3aed' : '#ffffff',
            color: activeTab === 'bursary' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'bursary' ? '#7c3aed' : '#cbd5e1',
          }}
        >
          <Award size={15} />
          Scholarships &amp; Aid
        </button>

        <button
          onClick={() => setActiveTab('bank_api')}
          className={`fin-btn-outline ${activeTab === 'bank_api' ? 'active' : ''}`}
          style={{
            background: activeTab === 'bank_api' ? '#334155' : '#ffffff',
            color: activeTab === 'bank_api' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'bank_api' ? '#334155' : '#cbd5e1',
          }}
        >
          <Code2 size={15} />
          Bank Integration Endpoints
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & COLLECTIONS ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Cards */}
          <div className="fin-stats-grid">
            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">TOTAL COLLECTED</span>
                <span className="fin-stat-badge fin-stat-badge-paid">Verified</span>
              </div>
              <div className="fin-stat-val emerald">
                GH₵ {Number(metrics.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="fin-stat-sub">Across MoMo &amp; Bank Collections</div>
            </div>

            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">STUDENT ARREARS</span>
                <span className="fin-stat-badge fin-stat-badge-arrears">Receivables</span>
              </div>
              <div className="fin-stat-val amber">
                GH₵ {Number(metrics.total_arrears).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="fin-stat-sub">Unpaid semester fee balance</div>
            </div>

            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">CHANNEL SPLIT</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>GH₵</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d97706' }}>
                    <Smartphone size={14} /> MoMo:
                  </span>
                  <span>GH₵ {Number(metrics.momo_total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#047857' }}>
                    <Building2 size={14} /> Banks:
                  </span>
                  <span>GH₵ {Number(metrics.bank_total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">REGISTRATION HOLDS</span>
                <span style={{ fontSize: 11, color: '#e11d48', fontWeight: 800 }}>Restricted</span>
              </div>
              <div className="fin-stat-val" style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={28} />
                {metrics.active_holds_count} Students
              </div>
              <div className="fin-stat-sub">Arrears &gt; GH₵ 500.00</div>
            </div>
          </div>

          {/* Quick Action Banner: Student Billing & Overpayments */}
          <div
            style={{
              background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1.5px solid #7dd3fc',
              borderRadius: 12,
              padding: '16px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: '#0284c7', color: '#fff', borderRadius: 10, padding: 9, display: 'flex' }}>
                <Calculator size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e' }}>
                  Student Tuition Billing &amp; Invoicing Engine
                </div>
                <div style={{ fontSize: 12.5, color: '#0369a1', marginTop: 2 }}>
                  Set up Level 100–400 tariffs and run the bulk billing generator. Prior overpayment credits are automatically rolled over and deducted!
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveTab('tariffs')}
                className="fin-btn-primary"
                style={{ background: '#0284c7', fontSize: 12.5, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Calculator size={15} />
                Run Billing Cycle &rarr;
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('refunds')}
                className="fin-btn-outline"
                style={{ background: '#fff', borderColor: '#0f766e', color: '#0f766e', fontSize: 12.5, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <RotateCcw size={15} />
                Overpayments &amp; Refunds
              </button>
            </div>
          </div>

          {/* Bank Teller Interactive Simulator */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h2 className="fin-card-title">
                  <Building2 size={20} color="#047857" />
                  Partner Bank Teller Terminal Simulator
                </h2>
                <div className="fin-card-sub">
                  Test what bank tellers at GCB, Ecobank, Zenith, or CalBank experience when a student arrives to pay fees
                </div>
              </div>
            </div>

            <form onSubmit={handleBankLookup} style={{ display: 'flex', gap: 10, maxWidth: 640, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="text"
                  required
                  placeholder="Enter Student Index No. or Email (e.g. kofi.mensah@ug.edu.gh)"
                  value={tellerSearchId}
                  onChange={(e) => setTellerSearchId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 36px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button type="submit" disabled={tellerSearching} className="fin-btn-primary">
                {tellerSearching ? 'Querying...' : 'Lookup Student'}
              </button>
            </form>

            {tellerStudent && (
              <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, fontFamily: 'monospace', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>STUDENT RECORD: </span>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>{tellerStudent.student_name}</strong> ({tellerStudent.student_id})
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      background: tellerStudent.has_hold ? '#fff1f2' : '#ecfdf5',
                      color: tellerStudent.has_hold ? '#e11d48' : '#059669',
                    }}
                  >
                    {tellerStudent.has_hold ? 'HOLD: ARREARS' : 'CLEAR TO REGISTER'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>PROGRAM</span>
                    <strong>{tellerStudent.program}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>TOTAL BILLED</span>
                    <strong>GH₵ {Number(tellerStudent.total_billed).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>TOTAL PAID</span>
                    <strong style={{ color: '#059669' }}>GH₵ {Number(tellerStudent.total_paid).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>BALANCE DUE</span>
                    <strong style={{ color: '#e11d48', fontSize: 15 }}>GH₵ {Number(tellerStudent.balance_due).toFixed(2)}</strong>
                  </div>
                </div>

                <form onSubmit={handlePostBankDeposit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                      BANK
                    </label>
                    <select
                      value={tellerBank}
                      onChange={(e) => setTellerBank(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
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
                      DEPOSIT AMOUNT (GH₵)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={tellerAmount}
                      onChange={(e) => setTellerAmount(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, width: 140 }}
                    />
                  </div>

                  <button type="submit" disabled={tellerPosting} className="fin-btn-primary" style={{ background: '#059669', marginTop: 18 }}>
                    {tellerPosting ? 'Posting Deposit...' : `Post ${tellerBank} Deposit`}
                  </button>
                </form>

                {tellerSuccessMsg && (
                  <div style={{ marginTop: 12, padding: 10, background: '#ecfdf5', color: '#065f46', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <CheckCircle2 size={16} />
                    {tellerSuccessMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Payments Table */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h2 className="fin-card-title">
                  <Receipt size={20} color="#047857" />
                  Recent University Cash Collections
                </h2>
                <div className="fin-card-sub">Audit trail of verified incoming student fee payments</div>
              </div>
            </div>

            {(!data?.recent_payments || data.recent_payments.length === 0) ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No recent transactions</p>
            ) : (
              <div className="fin-table-wrap">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Receipt No.</th>
                      <th>Timestamp</th>
                      <th>Student</th>
                      <th>Bank / Channel</th>
                      <th>Reference</th>
                      <th style={{ textAlign: 'right' }}>Amount (GH₵)</th>
                      <th style={{ textAlign: 'right' }}>Receipt PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#047857' }}>{p.receipt_number}</td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>{new Date(p.created_at).toLocaleString()}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.student_name}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{p.student_index}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{p.provider}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{p.reference_number}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#059669' }}>
                          GH₵ {Number(p.amount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDownloadReceipt(p.id, p.receipt_number)}
                            disabled={downloadingId === p.id}
                            className="fin-btn-receipt"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: BANK INTEGRATION DEVELOPER PORTAL (FOR PARTNER BANKS) ── */}
      {activeTab === 'bank_api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Informational Banner */}
          <div style={{ padding: 20, background: 'linear-gradient(135deg, #064e3b, #04130d)', borderRadius: 16, color: '#fff', border: '1px solid rgba(250, 204, 21, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#facc15', textTransform: 'uppercase', marginBottom: 6 }}>
              <BookOpen size={16} />
              Partner Bank Integration Specification (API Docs)
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              What Endpoint Do You Give to the Bank?
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#cbd5e1', maxWidth: 780, lineHeight: 1.5 }}>
              Provide the two endpoints below to IT Integration engineers at partner banks (<strong>GCB Bank, Ecobank, Zenith Bank, CalBank, Stanbic Bank</strong>).
              These allow their teller software or core banking application to look up student arrears and automatically post collections directly into UniPortal.
            </p>
          </div>

          {/* Endpoint 1: Inquiry */}
          <div className="fin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 8px', background: '#ecfdf5', color: '#059669', borderRadius: 6, fontWeight: 900, fontSize: 12, fontFamily: 'monospace' }}>
                    GET
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    1. Student Account Inquiry Endpoint
                  </h3>
                </div>
                <div className="fin-card-sub" style={{ marginTop: 4 }}>
                  Bank tellers query this endpoint with the student&apos;s Index Number or Email to fetch balance due.
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(lookupUrl, 'lookup_url')}
                className="fin-btn-outline"
              >
                <Copy size={14} />
                {copiedKey === 'lookup_url' ? 'Copied!' : 'Copy URL'}
              </button>
            </div>

            <div className="fin-api-code-block" style={{ marginBottom: 14 }}>
              GET {lookupUrl}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Expected JSON Response from UniPortal:
            </div>
            <div className="fin-api-code-block">
{`{
  "student_id": "UG-000001",
  "student_name": "Kofi Mensah",
  "program": "BSc Computer Science",
  "semester": "First Semester 2024/2025",
  "total_billed": "4600.00",
  "total_paid": "0.00",
  "balance_due": "4600.00",
  "currency": "GHS",
  "status": "unpaid",
  "has_hold": true
}`}
            </div>
          </div>

          {/* Endpoint 2: Payment Notification Webhook */}
          <div className="fin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 8px', background: '#f0fdf4', color: '#047857', borderRadius: 6, fontWeight: 900, fontSize: 12, fontFamily: 'monospace' }}>
                    POST
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    2. Bank Collection Webhook (Payment Posting)
                  </h3>
                </div>
                <div className="fin-card-sub" style={{ marginTop: 4 }}>
                  When teller accepts cash, the bank system POSTs the deposit details. UniPortal immediately credits the student ledger.
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(notifyUrl, 'notify_url')}
                className="fin-btn-outline"
              >
                <Copy size={14} />
                {copiedKey === 'notify_url' ? 'Copied!' : 'Copy URL'}
              </button>
            </div>

            <div className="fin-api-code-block" style={{ marginBottom: 14 }}>
              POST {notifyUrl}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Request Body Payload (JSON sent by Bank):
                </div>
                <div className="fin-api-code-block">
{`{
  "student_id": "kofi.mensah@ug.edu.gh",
  "amount": "4600.00",
  "bank_name": "GCB Bank",
  "branch": "Legon Main Branch",
  "teller_id": "TELLER-042",
  "bank_reference": "GCB-COLL-2026-883921",
  "notes": "Tuition fees deposit"
}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  UniPortal Webhook Response (Instant Credit Confirmation):
                </div>
                <div className="fin-api-code-block">
{`{
  "status": "success",
  "message": "Payment of GH₵ 4600.00 credited successfully to Kofi Mensah.",
  "receipt_number": "RCP-GHS-2026-9B38F1",
  "balance_remaining": "0.00",
  "currency": "GHS",
  "payment": {
    "id": 14,
    "receipt_number": "RCP-GHS-2026-9B38F1",
    "status": "completed"
  }
}`}
                </div>
              </div>
            </div>

            {/* Ready cURL Command */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={14} />
                  Ready cURL Command (For Bank Integration Testing)
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST ${notifyUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '{"student_id":"kofi.mensah@ug.edu.gh","amount":"4600.00","bank_name":"GCB Bank","branch":"Legon","teller_id":"TEL-1","bank_reference":"REF-${Date.now()}","notes":"Fee Payment"}'`,
                      'curl'
                    )
                  }
                  className="fin-btn-outline"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                >
                  <Copy size={12} /> {copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}
                </button>
              </div>
              <div className="fin-api-code-block">
{`curl -X POST ${notifyUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "student_id": "kofi.mensah@ug.edu.gh",
    "amount": "4600.00",
    "bank_name": "GCB Bank",
    "branch": "Legon Main Branch",
    "teller_id": "TEL-001",
    "bank_reference": "GCB-${Date.now().toString().slice(-6)}",
    "notes": "Full semester fees"
  }'`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MANUAL DEPOSIT SLIPS VERIFICATION QUEUE ── */}
      {activeTab === 'slips' && (
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <h2 className="fin-card-title">
                <Receipt size={20} color="#d97706" />
                Manual Bank Deposit Slips (Verification Queue)
              </h2>
              <div className="fin-card-sub">
                Students who paid with paper teller deposit slips awaiting Bursary review
              </div>
            </div>
            <span style={{ padding: '4px 10px', background: '#fffbeb', color: '#b45309', borderRadius: 99, fontWeight: 700, fontSize: 12 }}>
              {data?.pending_bank_slips?.length || 0} Pending
            </span>
          </div>

          {(!data?.pending_bank_slips || data.pending_bank_slips.length === 0) ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12 }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Verification Queue Clear</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                All manual deposit slips have been processed and certified.
              </div>
            </div>
          ) : (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Date Submitted</th>
                    <th>Student</th>
                    <th>Bank &amp; Teller Ref</th>
                    <th style={{ textAlign: 'right' }}>Amount (GH₵)</th>
                    <th style={{ textAlign: 'center' }}>Photo Slip</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pending_bank_slips.map((slip) => (
                    <tr key={slip.id}>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{new Date(slip.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{slip.student_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{slip.student_index}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{slip.provider}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{slip.reference_number}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                        GH₵ {Number(slip.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {slip.slip_image ? (
                          <button
                            type="button"
                            onClick={() => setPreviewSlip(slip)}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '5px 12px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <Eye size={13} /> View Slip
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11 }}>No attachment</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleVerifySlip(slip.id, true)}
                            disabled={verifyingSlipId === slip.id}
                            className="fin-btn-primary"
                            style={{ background: '#059669', padding: '6px 12px', fontSize: 11 }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalSlip(slip);
                              setRejectReasonPreset('Reference not found on official bank statement');
                              setRejectCustomNote('');
                            }}
                            disabled={verifyingSlipId === slip.id}
                            className="fin-btn-outline"
                            style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', padding: '6px 12px', fontSize: 11 }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: BURSARY AID & TARIFF RATES ── */}
      {activeTab === 'bursary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Bursary Credit Form */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-title">
                  <Award size={20} color="#7c3aed" />
                  Credit Scholarship / Bursary Award
                </h3>
                <div className="fin-card-sub">Directly credit and reduce student semester fee balance</div>
              </div>
            </div>

            <form onSubmit={handleAwardBursary} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Student Index Number or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kofi.mensah@ug.edu.gh or UG-000001"
                  value={bursaryStudentId}
                  onChange={(e) => setBursaryStudentId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Award Amount (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={bursaryAmount}
                    onChange={(e) => setBursaryAmount(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Sponsorship Scheme
                  </label>
                  <select
                    value={bursaryReason}
                    onChange={(e) => setBursaryReason(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="Vice-Chancellor Merit Scholarship">Vice-Chancellor Merit Scholarship</option>
                    <option value="Ghana National Petroleum Corp (GNPC) Grant">GNPC Scholarship</option>
                    <option value="MTN Ghana Foundation Bursary">MTN Ghana Foundation Bursary</option>
                    <option value="SRC Welfare Emergency Grant">SRC Welfare Emergency Grant</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={bursarySubmitting} className="fin-btn-primary" style={{ background: '#7c3aed', justifyContent: 'center', marginTop: 6 }}>
                {bursarySubmitting ? 'Crediting...' : 'Credit Student Ledger'}
              </button>

              {bursaryMsg && (
                <div style={{ padding: 10, background: '#ecfdf5', color: '#065f46', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                  {bursaryMsg}
                </div>
              )}
            </form>
          </div>

          {/* Bursary Guidance and Directives Card */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-title">
                  <ShieldAlert size={20} color="#7c3aed" />
                  Bursary &amp; Scholarship Regulations
                </h3>
                <div className="fin-card-sub">Institutional policy on external grants &amp; tuition relief</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0 }}>
                Bursary awards instantly post as credits to the student&apos;s active semester statement, reducing total fee arrears.
              </p>
              <div style={{ padding: 14, background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                <strong style={{ color: '#6d28d9', display: 'block', marginBottom: 4 }}>Surplus Handling:</strong>
                If a scholarship award exceeds the student&apos;s semester tuition bill, the remaining funds roll into an active <strong>Credit Balance</strong>. The surplus automatically rolls over to reduce subsequent semester bills or can be refunded.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FEE STRUCTURES & BULK BILLING ── */}
      {activeTab === 'tariffs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Bulk Semester Billing Generator Card */}
          <div className="fin-card" style={{ border: '2px solid #bae6fd', background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)' }}>
            <div className="fin-card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '3px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: 99, marginBottom: 6 }}>
                  <Calculator size={13} />
                  Tuition Invoicing &amp; Billing Engine
                </div>
                <h3 className="fin-card-title" style={{ fontSize: 18, color: '#0f172a' }}>
                  Bulk Semester Billing Cycle Generator
                </h3>
                <div className="fin-card-sub" style={{ maxWidth: 700 }}>
                  Generate or refresh official tuition statements for active students based on approved level tariffs.
                  <strong> Automatic Credit Rollover:</strong> Any student who previously overpaid will have their surplus credit automatically deducted from this bill.
                </div>
              </div>
            </div>

            <form onSubmit={handleRunBulkBilling} style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Target Academic Semester
                  </label>
                  <input
                    type="text"
                    required
                    value={billingSemester}
                    onChange={(e) => setBillingSemester(e.target.value)}
                    placeholder="e.g. First Semester 2024/2025"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Student Target Cohort
                  </label>
                  <select
                    value={billingLevel}
                    onChange={(e) => setBillingLevel(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="all">All Enrolled Students (Levels 100 - Postgraduate)</option>
                    <option value="100">Level 100 (Freshmen Only)</option>
                    <option value="200">Level 200 (Sophomores Only)</option>
                    <option value="300">Level 300 (Juniors Only)</option>
                    <option value="400">Level 400 (Seniors Only)</option>
                    <option value="postgraduate">Postgraduate Students Only</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={billingRunning}
                    className="fin-btn-primary"
                    style={{
                      background: '#0284c7',
                      width: '100%',
                      padding: '11px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      justifyContent: 'center',
                    }}
                  >
                    {billingRunning ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Generating Invoices...
                      </>
                    ) : (
                      <>
                        <Play size={15} />
                        Run Billing Cycle
                      </>
                    )}
                  </button>
                </div>
              </div>

              {billingResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 10,
                    background: billingResult.success ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${billingResult.success ? '#a7f3d0' : '#fecaca'}`,
                    color: billingResult.success ? '#065f46' : '#991b1b',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {billingResult.success ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
                  <div>
                    <div style={{ fontWeight: 800 }}>{billingResult.message}</div>
                    {billingResult.data?.stats && (
                      <div style={{ fontSize: 12, marginTop: 3 }}>
                        Billed: <strong>{billingResult.data.stats.billed_count}</strong> students |
                        Total Billed: <strong>GH₵ {Number(billingResult.data.stats.total_billed).toFixed(2)}</strong> |
                        Prior Overpayment Credits Rolled Over: <strong style={{ color: '#047857' }}>GH₵ {Number(billingResult.data.stats.total_credits_applied || 0).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Dynamic Academic Level Tariff Manager */}
          <div className="fin-card">
            <div className="fin-card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="fin-card-title">
                  <Settings size={20} color="#0284c7" />
                  Dynamic Academic Level Fee Tariffs (GH₵)
                </h3>
                <div className="fin-card-sub">
                  Configure custom semester flat fee breakdowns per academic level (Level 100, 200, 300, 400 &amp; Postgraduate).
                </div>
              </div>

              {/* Level Selector Chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: '100', label: 'Level 100 (Freshmen)' },
                  { id: '200', label: 'Level 200 (Sophomores)' },
                  { id: '300', label: 'Level 300 (Juniors)' },
                  { id: '400', label: 'Level 400 (Seniors)' },
                  { id: 'postgraduate', label: 'Postgraduate' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => selectLevel(lvl.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: selectedLevel === lvl.id ? 800 : 500,
                      border: selectedLevel === lvl.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: selectedLevel === lvl.id ? '#e0f2fe' : '#ffffff',
                      color: selectedLevel === lvl.id ? '#0369a1' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {tariffSuccessMsg && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#059669" />
                {tariffSuccessMsg}
              </div>
            )}

            {/* Level Tariff Edit Form */}
            <form onSubmit={handleSaveTariff} style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Editing Tariff: <span style={{ color: '#0284c7' }}>{levelTitle || `Level ${selectedLevel}`}</span>
                </div>
                <span className="fin-badge fin-badge-amber" style={{ fontSize: 11 }}>
                  {levelSemester}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Tariff Label / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={levelTitle}
                    onChange={(e) => setLevelTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Academic Facility &amp; Tuition (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={levelAcademicFee}
                    onChange={(e) => setLevelAcademicFee(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    ICT &amp; Digital Library Fee (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={levelIctFee}
                    onChange={(e) => setLevelIctFee(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    SRC Student Dues (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={levelSrcDues}
                    onChange={(e) => setLevelSrcDues(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Examination Fee (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={levelExamFee}
                    onChange={(e) => setLevelExamFee(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Dynamic Sum preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Calculated Total Flat Tariff ({levelTitle || `Level ${selectedLevel}`})
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Includes tuition, technology, student council dues &amp; assessment levies
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0284c7' }}>
                  GH₵ {(Number(levelAcademicFee || 0) + Number(levelIctFee || 0) + Number(levelSrcDues || 0) + Number(levelExamFee || 0)).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={recalculateStudents}
                    onChange={(e) => setRecalculateStudents(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Recalculate and update all active student statements for this level</span>
                </label>

                <button
                  type="submit"
                  disabled={savingTariff}
                  className="fin-btn-primary"
                  style={{ background: '#0284c7', minWidth: 200, justifyContent: 'center' }}
                >
                  {savingTariff ? 'Saving Tariff...' : `Save ${selectedLevel ? `Level ${selectedLevel}` : ''} Tariff`}
                </button>
              </div>
            </form>

            {/* University-wide Fee Schedule Table */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} color="#475569" />
                All Academic Level Tariffs Overview ({allFeeStructures[0]?.semester || 'Current Semester'})
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="fin-table" style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Academic Level</th>
                      <th>Tuition &amp; Facilities</th>
                      <th>ICT &amp; Library</th>
                      <th>SRC Dues</th>
                      <th>Exams</th>
                      <th style={{ textAlign: 'right' }}>Consolidated Total (GH₵)</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allFeeStructures.length > 0 ? allFeeStructures : [data?.active_fee_structure]).filter(Boolean).map((str) => {
                      const isRowSelected = str?.academic_level === selectedLevel;
                      return (
                        <tr
                          key={str?.id || str?.academic_level}
                          style={{
                            background: isRowSelected ? '#f0f9ff' : 'transparent',
                            fontWeight: isRowSelected ? 700 : 400,
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {str?.level_title || `Level ${str?.academic_level}`}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>Level Code: {str?.academic_level}</div>
                          </td>
                          <td>GH₵ {Number(str?.academic_fee).toFixed(2)}</td>
                          <td>GH₵ {Number(str?.ict_library_fee).toFixed(2)}</td>
                          <td>GH₵ {Number(str?.src_dues).toFixed(2)}</td>
                          <td>GH₵ {Number(str?.examination_fee).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: '#0284c7', fontSize: 13 }}>
                            GH₵ {Number(str?.total_fee).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => selectLevel(str?.academic_level || '100')}
                              className="fin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                            >
                              Edit Rate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: 12, color: '#64748b' }}>
              Registration Hold Rule: Course registration is restricted whenever student arrears exceed <strong>GH₵ 500.00</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: OVERPAYMENTS & REFUNDS ── */}
      {activeTab === 'refunds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top KPI Metrics Banner for Overpayments */}
          <div className="fin-stats-grid">
            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">TOTAL STUDENT OVERPAYMENT CREDITS</span>
                <span className="fin-badge fin-badge-green">Surplus Held</span>
              </div>
              <div className="fin-stat-val emerald">
                GH₵ {Number(metrics.total_credits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="fin-stat-sub">
                Auto-carried forward into next billing cycle or eligible for refund
              </div>
            </div>

            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">PENDING REFUND REQUESTS</span>
                <span className={`fin-stat-badge ${(refundsList.filter(r => r.status === 'pending').length > 0) ? 'fin-stat-badge-arrears' : 'fin-stat-badge-paid'}`}>
                  {refundsList.filter(r => r.status === 'pending').length} Awaiting Review
                </span>
              </div>
              <div className="fin-stat-val amber">
                {refundsList.filter(r => r.status === 'pending').length}
              </div>
              <div className="fin-stat-sub">
                Students requested direct Mobile Money or Bank payout
              </div>
            </div>

            <div className="fin-stat-card">
              <div className="fin-stat-header">
                <span className="fin-stat-label">DISBURSED REFUNDS</span>
                <span className="fin-stat-badge fin-stat-badge-paid">Completed</span>
              </div>
              <div className="fin-stat-val indigo">
                {refundsList.filter(r => r.status === 'disbursed').length}
              </div>
              <div className="fin-stat-sub">
                Successfully paid out to student bank/MoMo accounts
              </div>
            </div>
          </div>

          {/* Explanatory Policy Callout */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 14, padding: '16px 20px', color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <HelpCircle size={22} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#064e3b' }}>
                How Student Overpayments &amp; Credits Work
              </div>
              <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                When a student pays more than their assessed semester tuition fees, the system automatically preserves the surplus as an active <strong>Credit Balance (credit_balance)</strong>.
                <br />
                &bull; <strong>Automatic Semester Rollover:</strong> When Finance runs the next semester billing cycle, any existing credit is automatically applied to deduct from their new tuition invoice (visible as <em>Previous Credit Applied</em>).
                <br />
                &bull; <strong>Direct Refund Request:</strong> If a student needs the money immediately instead of rolling over, they can submit a refund request from their portal. Bursary staff can review, approve, and disburse it below.
              </div>
            </div>
          </div>

          {/* Section 1: Refund Requests Queue */}
          <div className="fin-card">
            <div className="fin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="fin-card-title">
                  <RotateCcw size={20} color="#0f766e" />
                  Student Refund Requests Queue
                </h3>
                <div className="fin-card-sub">
                  Review student claims for cash/MoMo/bank disbursement of overpayment credit balances.
                </div>
              </div>

              {/* Status Filter Chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['all', 'pending', 'approved', 'disbursed', 'rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setRefundStatusFilter(status)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: refundStatusFilter === status ? 700 : 500,
                      border: refundStatusFilter === status ? '1px solid #0f766e' : '1px solid #cbd5e1',
                      background: refundStatusFilter === status ? '#ccfbf1' : '#ffffff',
                      color: refundStatusFilter === status ? '#0f766e' : '#475569',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {loadingRefunds ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <div>Loading refund requests...</div>
              </div>
            ) : refundsList.filter(r => refundStatusFilter === 'all' || r.status === refundStatusFilter).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>No {refundStatusFilter !== 'all' ? refundStatusFilter : ''} refund requests found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Any student submissions will appear here for Bursar review.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="fin-table" style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Payout Channel &amp; Destination</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundsList
                      .filter(r => refundStatusFilter === 'all' || r.status === refundStatusFilter)
                      .map((refund) => (
                        <tr key={refund.id}>
                          <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                            {new Date(refund.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{refund.student_name}</div>
                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{refund.student_index}</div>
                          </td>
                          <td style={{ fontWeight: 900, color: '#0f766e', fontSize: 13 }}>
                            GH₵ {Number(refund.amount).toFixed(2)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>
                              {refund.channel === 'momo' ? 'Mobile Money (MoMo)' : refund.channel === 'bank_transfer' ? 'Bank Transfer' : 'Cash / Cheque'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                              {refund.account_details}
                            </div>
                            {refund.disbursement_reference && (
                              <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>
                                Ref: {refund.disbursement_reference}
                              </div>
                            )}
                          </td>
                          <td style={{ maxWidth: 200, fontSize: 11, color: '#475569' }}>
                            {refund.reason || 'Overpayment tuition refund'}
                            {refund.admin_notes && (
                              <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                                Note: {refund.admin_notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`fin-badge ${
                                refund.status === 'disbursed'
                                  ? 'fin-badge-green'
                                  : refund.status === 'pending'
                                  ? 'fin-badge-amber'
                                  : refund.status === 'approved'
                                  ? 'fin-badge-blue'
                                  : 'fin-badge-red'
                              }`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {refund.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {refund.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setActionRefundModal({ item: refund, action: 'disburse' })}
                                  className="fin-btn-primary"
                                  style={{ background: '#059669', padding: '5px 10px', fontSize: 11 }}
                                >
                                  <Check size={12} /> Disburse
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActionRefundModal({ item: refund, action: 'reject' })}
                                  className="fin-btn-outline"
                                  style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', padding: '5px 10px', fontSize: 11 }}
                                >
                                  <X size={12} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Active Student Credit Surplus Table */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-title">
                  <CheckCircle2 size={20} color="#059669" />
                  Students with Active Overpayment Credit Balances
                </h3>
                <div className="fin-card-sub">
                  Enrolled students whose cumulative payments exceed their billed fees. These credits automatically deduct on the next semester bill.
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="fin-table" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student Index</th>
                    <th>Academic Level</th>
                    <th>Semester</th>
                    <th>Total Billed</th>
                    <th>Total Paid</th>
                    <th style={{ textAlign: 'right' }}>Active Credit Surplus (GH₵)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.credit_students && data.credit_students.length > 0) ? (
                    data.credit_students.map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{st.student_name}</td>
                        <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{st.student_index || (st as any).student_id}</td>
                        <td>Level {st.academic_level || '100'}</td>
                        <td>{st.semester}</td>
                        <td>GH₵ {Number(st.total_billed).toFixed(2)}</td>
                        <td style={{ color: '#047857', fontWeight: 700 }}>GH₵ {Number(st.total_paid).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: 13 }}>
                          + GH₵ {Number(st.credit_balance || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className="fin-badge fin-badge-green" style={{ fontSize: 11 }}>
                            Surplus Held / Auto Rollover
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                        No active student credit balances recorded currently. Overpayments will appear here automatically.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION REASON PROMPT MODAL ── */}
      {rejectModalSlip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #fecdd3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#ffe4e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e11d48',
                  }}
                >
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    Decline Deposit Slip
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Audit record & student notification
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalSlip(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 16,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Student:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {rejectModalSlip.student_name} ({rejectModalSlip.student_index})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Bank & Ref:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {rejectModalSlip.provider} · {rejectModalSlip.reference_number}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Voucher Amount:</span>
                <span style={{ fontWeight: 800, color: '#047857' }}>
                  GH₵ {Number(rejectModalSlip.amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Reason for Declining (Audit Standard)
              </label>
              <select
                value={rejectReasonPreset}
                onChange={(e) => setRejectReasonPreset(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  background: '#ffffff',
                }}
              >
                <option value="Reference not found on official bank statement">
                  Reference not found on official bank statement
                </option>
                <option value="Amount deposited does not match submitted voucher">
                  Amount deposited does not match submitted voucher
                </option>
                <option value="Bank stamp or teller signature missing/illegible">
                  Bank stamp or teller signature missing/illegible
                </option>
                <option value="Alteration or correction detected on physical slip">
                  Alteration or correction detected on physical slip
                </option>
                <option value="Duplicate teller number submitted previously">
                  Duplicate teller number submitted previously
                </option>
                <option value="Account credited belongs to a different institution">
                  Account credited belongs to a different institution
                </option>
                <option value="Other (Custom audit reason)">
                  Other (Custom audit reason)
                </option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Auditor Remarks / Notes for Student
              </label>
              <textarea
                rows={3}
                value={rejectCustomNote}
                onChange={(e) => setRejectCustomNote(e.target.value)}
                placeholder="Optional instructions for the student (e.g. please visit Cash Office with the physical bank receipt)..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRejectModalSlip(null)}
                disabled={verifyingSlipId === rejectModalSlip.id}
                className="fin-btn-secondary"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={verifyingSlipId === rejectModalSlip.id}
                className="fin-btn-primary"
                style={{ background: '#e11d48', padding: '8px 16px', fontSize: 12 }}
              >
                <XCircle size={14} />
                {verifyingSlipId === rejectModalSlip.id ? 'Declining Slip...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW DEPOSIT SLIP MODAL ── */}
      {previewSlip && (
        <div className="fin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="fin-modal-card" style={{ maxWidth: 640 }}>
            <div className="fin-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#047857" />
                  Bank Deposit Slip Verification
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Student: <strong>{previewSlip.student_name}</strong> &bull; Index: <strong>{previewSlip.student_index}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSlip(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Bank Provider</div>
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>{previewSlip.provider}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Teller Ref Number</div>
                  <strong style={{ fontSize: 13, color: '#047857', fontFamily: 'monospace' }}>{previewSlip.reference_number}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Claimed Amount</div>
                  <strong style={{ fontSize: 14, color: '#059669' }}>GH₵ {Number(previewSlip.amount).toFixed(2)}</strong>
                </div>
              </div>

              {/* Slip Image Container */}
              {(() => {
                const rawUrl = previewSlip.slip_image || '';
                const token = localStorage.getItem('access_token') || localStorage.getItem('portal_access') || '';
                const viewUrl = rawUrl.includes('?sig=')
                  ? rawUrl
                  : (token ? (rawUrl.includes('?') ? `${rawUrl}&token=${encodeURIComponent(token)}` : `${rawUrl}?token=${encodeURIComponent(token)}`) : rawUrl);

                return (
                  <>
                    <div style={{ maxHeight: 420, overflow: 'auto', borderRadius: 10, border: '1px solid #cbd5e1', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 8 }}>
                      <img
                        src={viewUrl}
                        alt={`Deposit Slip ${previewSlip.reference_number}`}
                        style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 6 }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const errDiv = target.parentElement?.querySelector('.slip-img-fallback');
                          if (errDiv) (errDiv as HTMLElement).style.display = 'block';
                        }}
                      />
                      <div className="slip-img-fallback" style={{ display: 'none', color: '#f87171', padding: 20, textAlign: 'center', fontSize: 13 }}>
                        Unable to render image preview directly. Click below to open in a new tab.
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <ExternalLink size={13} /> Open Full Size in New Tab
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => setPreviewSlip(null)}
                className="fin-btn-secondary"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const slipToReject = previewSlip;
                  setPreviewSlip(null);
                  setRejectModalSlip(slipToReject);
                  setRejectReasonPreset('Reference not found on official bank statement');
                  setRejectCustomNote('');
                }}
                disabled={verifyingSlipId === previewSlip.id}
                className="fin-btn-outline"
                style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', padding: '8px 16px', fontSize: 12 }}
              >
                <XCircle size={14} /> Reject Slip
              </button>
              <button
                type="button"
                onClick={() => {
                  const slipToApprove = previewSlip;
                  setPreviewSlip(null);
                  handleVerifySlip(slipToApprove.id, true);
                }}
                disabled={verifyingSlipId === previewSlip.id}
                className="fin-btn-primary"
                style={{ background: '#059669', padding: '8px 16px', fontSize: 12 }}
              >
                <CheckCircle2 size={14} /> Approve &amp; Credit Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND ACTION MODAL (DISBURSE OR REJECT) ── */}
      {actionRefundModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: `1px solid ${actionRefundModal.action === 'disburse' ? '#a7f3d0' : '#fecdd3'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: actionRefundModal.action === 'disburse' ? '#ecfdf5' : '#fff1f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {actionRefundModal.action === 'disburse' ? (
                    <CheckCircle2 size={22} color="#059669" />
                  ) : (
                    <XCircle size={22} color="#e11d48" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {actionRefundModal.action === 'disburse' ? 'Confirm Refund Disbursement' : 'Reject Refund Request'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Student: {actionRefundModal.item.student_name} ({actionRefundModal.item.student_index})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionRefundModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Refund Amount:</span>
                <strong style={{ color: '#0f172a', fontSize: 14 }}>GH₵ {Number(actionRefundModal.item.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Payout Channel:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {actionRefundModal.item.channel === 'momo' ? 'Mobile Money (MoMo)' : actionRefundModal.item.channel === 'bank_transfer' ? 'Bank Transfer' : 'Cash / Cheque'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Destination Details:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>
                  {actionRefundModal.item.account_details}
                </span>
              </div>
            </div>

            {actionRefundModal.action === 'disburse' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Disbursement Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MTN-TXN-984210 or GCB-FT-2024"
                    value={refundActionRef}
                    onChange={(e) => setRefundActionRef(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    The transaction reference issued by the bank or Mobile Money provider.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Treasury Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Disbursed via University MTN MoMo Corporate Gateway"
                    value={refundActionNotes}
                    onChange={(e) => setRefundActionNotes(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Audit Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify why this refund request cannot be fulfilled (e.g. Invalid MoMo account details, unverified bank slip, or prior credit consumed)..."
                  value={refundActionNotes}
                  onChange={(e) => setRefundActionNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => setActionRefundModal(null)}
                className="fin-btn-secondary"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefundAction}
                disabled={submittingRefundAction}
                className="fin-btn-primary"
                style={{
                  background: actionRefundModal.action === 'disburse' ? '#059669' : '#e11d48',
                  padding: '8px 18px',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {submittingRefundAction
                  ? 'Processing...'
                  : actionRefundModal.action === 'disburse'
                  ? 'Confirm Disbursement'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
