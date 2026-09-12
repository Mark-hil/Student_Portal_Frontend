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
} from 'lucide-react';
import { financialsApi } from '../../api/services';
import type { BursarOverview, PaymentRecord, SemesterFeeStructure } from '../../types';

export const BursarManagement: React.FC = () => {
  const [data, setData] = useState<BursarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bank_api' | 'slips' | 'bursary'>('overview');
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

  // Receipt download
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Slip Approval Handler
  const handleVerifySlip = async (paymentId: number, approve: boolean) => {
    try {
      setVerifyingSlipId(paymentId);
      await financialsApi.verifySlip(paymentId, approve, approve ? 'Verified by Bursary' : 'Deposit slip rejected - invalid reference');
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update slip status.');
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
        <RefreshCw size={32} className="animate-spin" color="#4f46e5" style={{ marginBottom: 12 }} />
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
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`fin-btn-outline ${activeTab === 'overview' ? 'active' : ''}`}
          style={{
            background: activeTab === 'overview' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'overview' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'overview' ? '#4f46e5' : '#cbd5e1',
          }}
        >
          <TrendingUp size={15} />
          Overview &amp; Collections
        </button>

        <button
          onClick={() => setActiveTab('bank_api')}
          className={`fin-btn-outline ${activeTab === 'bank_api' ? 'active' : ''}`}
          style={{
            background: activeTab === 'bank_api' ? '#2563eb' : '#ffffff',
            color: activeTab === 'bank_api' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'bank_api' ? '#2563eb' : '#cbd5e1',
            fontWeight: 800,
          }}
        >
          <Code2 size={15} />
          Bank Integration Endpoints (For Banks)
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
          onClick={() => setActiveTab('bursary')}
          className={`fin-btn-outline ${activeTab === 'bursary' ? 'active' : ''}`}
          style={{
            background: activeTab === 'bursary' ? '#7c3aed' : '#ffffff',
            color: activeTab === 'bursary' ? '#ffffff' : '#334155',
            borderColor: activeTab === 'bursary' ? '#7c3aed' : '#cbd5e1',
          }}
        >
          <Award size={15} />
          Scholarships &amp; Tariffs
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563eb' }}>
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

          {/* Bank Teller Interactive Simulator */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <h2 className="fin-card-title">
                  <Building2 size={20} color="#2563eb" />
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
              <button type="submit" disabled={tellerSearching} className="fin-btn-primary" style={{ background: '#2563eb' }}>
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
                  <Receipt size={20} color="#4f46e5" />
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
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4f46e5' }}>{p.receipt_number}</td>
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
          <div style={{ padding: 20, background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', borderRadius: 16, color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: 6 }}>
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
                  <span style={{ padding: '3px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, fontWeight: 900, fontSize: 12, fontFamily: 'monospace' }}>
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
                          <a href={slip.slip_image} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 700, fontSize: 12 }}>
                            View Image
                          </a>
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
                            onClick={() => handleVerifySlip(slip.id, false)}
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

          {/* Dynamic Academic Level Tariff Manager */}
          <div className="fin-card" style={{ gridColumn: 'span 2' }}>
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
    </div>
  );
};
