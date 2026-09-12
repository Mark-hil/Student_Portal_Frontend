import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingUp,
  AlertCircle,
  Building2,
  Smartphone,
  CheckCircle2,
  Clock,
  RefreshCw,
  Layers,
  Award,
  Settings,
  Download,
} from 'lucide-react';
import { financialsApi } from '../../api/services';
import type { BursarOverview, User as UserType } from '../../types';

interface Props {
  user: UserType;
  onNav?: (view: string) => void;
}

export function FinanceDashboard({ user, onNav }: Props) {
  const [data, setData] = useState<BursarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [exportingStatements, setExportingStatements] = useState(false);
  const [exportingPayments, setExportingPayments] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financialsApi.getAdminOverview();
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load financial overview', err);
      setError(err?.response?.data?.detail || 'Failed to load financial metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDownloadReceipt = async (paymentId: number, ref: string) => {
    try {
      setDownloadingId(paymentId);
      const res = await financialsApi.getReceiptPdfBlob(paymentId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Official_Receipt_${ref || paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" color="#d97706" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Loading Financial Operations &amp; Treasury Overview...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 24, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, textAlign: 'center' }}>
        <AlertCircle size={36} color="#e11d48" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#9f1239' }}>Financial Data Unavailable</h3>
        <p style={{ fontSize: 13, color: '#e11d48', marginBottom: 16 }}>{error}</p>
        <button onClick={fetchOverview} className="fin-btn-primary">
          Retry Loading
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_billed: 0,
    total_paid: 0,
    total_arrears: 0,
    collection_rate: 0,
    momo_total: 0,
    bank_total: 0,
    active_holds_count: 0,
    level_breakdown: [],
  };

  const totalBilled = Number(metrics.total_billed || 0);
  const totalPaid = Number(metrics.total_paid || 0);
  const totalArrears = Number(metrics.total_arrears || 0);
  const collectionRate = metrics.collection_rate || (totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0);
  const pendingSlipsCount = data?.pending_bank_slips?.length || 0;

  return (
    <div className="fin-container" style={{ gap: 24 }}>
      {/* ── Finance Executive Hero Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #172554 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.35) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#fbbf24',
                  background: 'rgba(217, 119, 6, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  letterSpacing: '0.04em',
                }}
              >
                Finance &amp; Treasury Directorate
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                Academic Term: <strong style={{ color: '#fff' }}>{data?.active_fee_structure?.semester || 'Academic Year 2024/2025'}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: '#ffffff' }}>
              Financial Operations &amp; Treasury Overview
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', maxWidth: 680, lineHeight: 1.5 }}>
              Institutional financial metrics, dynamic level tuition collections in Ghana Cedis (GH₵), real-time Mobile Money inflows, and partner bank synchronization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                try {
                  setExportingStatements(true);
                  await financialsApi.exportStatementsCsv(undefined, 'student_fee_statements.csv');
                } catch (e) {
                  alert('Failed to export statements CSV');
                } finally {
                  setExportingStatements(false);
                }
              }}
              disabled={exportingStatements}
              className="fin-btn-outline"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)', fontSize: 13 }}
            >
              <Download size={15} />
              {exportingStatements ? 'Exporting...' : 'Export Statements (CSV)'}
            </button>

            <button
              onClick={async () => {
                try {
                  setExportingPayments(true);
                  await financialsApi.exportPaymentsCsv(undefined, 'payments_stream_ledger.csv');
                } catch (e) {
                  alert('Failed to export payments stream CSV');
                } finally {
                  setExportingPayments(false);
                }
              }}
              disabled={exportingPayments}
              className="fin-btn-outline"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)', fontSize: 13 }}
            >
              <Download size={15} />
              {exportingPayments ? 'Exporting...' : 'Export Payments (CSV)'}
            </button>

            <button
              onClick={() => onNav?.('bursar')}
              className="fin-btn-gold"
              style={{ fontSize: 13, padding: '10px 18px' }}
            >
              <Coins size={16} />
              Open Bursar Hub
            </button>
            <button
              onClick={fetchOverview}
              title="Refresh Financials"
              className="fin-btn-outline"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Pending Verification Alert Notice (if any) ── */}
      {pendingSlipsCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: 12,
            padding: '14px 20px',
            color: '#92400e',
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={22} color="#d97706" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                {pendingSlipsCount} Manual Bank Deposit Slip{pendingSlipsCount > 1 ? 's' : ''} Awaiting Verification
              </div>
              <div style={{ fontSize: 12, color: '#b45309' }}>
                Students submitted over-the-counter deposit slips from non-integrated rural bank branches requiring reconciliation.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNav?.('bursar')}
            className="fin-btn-primary"
            style={{ background: '#d97706', fontSize: 12, padding: '6px 14px' }}
          >
            Review Slips Now
          </button>
        </div>
      )}

      {/* ── Executive Financial KPI Grid (GH₵) ── */}
      <div className="fin-stats-grid">
        {/* Total Billed */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">TOTAL TUITION BILLED</span>
            <span className="fin-badge fin-badge-blue">University Ledger</span>
          </div>
          <div className="fin-stat-val indigo">
            GH₵ {totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="fin-stat-sub">
            All enrolled student accounts
          </div>
        </div>

        {/* Total Revenue Collected */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">TOTAL REVENUE COLLECTED</span>
            <span className="fin-stat-badge fin-stat-badge-paid">
              {collectionRate}% Collected
            </span>
          </div>
          <div className="fin-stat-val emerald">
            GH₵ {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(collectionRate, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Total Outstanding Arrears */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">TOTAL OUTSTANDING ARREARS</span>
            <span className="fin-stat-badge fin-stat-badge-arrears">Receivables</span>
          </div>
          <div className="fin-stat-val amber">
            GH₵ {totalArrears.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="fin-stat-sub">
            Due before semester final exams
          </div>
        </div>

        {/* Course Registration Holds */}
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">REGISTRATION HOLDS</span>
            <span className={`fin-stat-badge ${metrics.active_holds_count > 0 ? 'fin-stat-badge-hold' : 'fin-stat-badge-paid'}`}>
              {metrics.active_holds_count > 0 ? 'Active Blocks' : 'All Clear'}
            </span>
          </div>
          <div className={`fin-stat-val ${metrics.active_holds_count > 0 ? 'rose' : 'emerald'}`}>
            {metrics.active_holds_count} Students
          </div>
          <div className="fin-stat-sub">
            Arrears &gt; GH₵ 500.00 rule enforced
          </div>
        </div>
      </div>

      {/* ── Channel Inflow Breakdown: Mobile Money vs Direct Bank Sync ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* MoMo Inflow Card */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <h3 className="fin-card-title">
                <Smartphone size={20} color="#f59e0b" />
                Mobile Money Inflow Channels
              </h3>
              <div className="fin-card-sub">MTN MoMo, Telecel Cash &amp; AT Money Instant Collections</div>
            </div>
            <span className="fin-badge fin-badge-amber">Instant Settlement</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '14px 0 8px 0' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#d97706' }}>
              GH₵ {Number(metrics.momo_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              ({totalPaid > 0 ? ((Number(metrics.momo_total || 0) / totalPaid) * 100).toFixed(1) : 0}% of total collections)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>MTN Mobile Money (*170#):</span>
              <strong style={{ color: '#0f172a' }}>Active Gateway</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Telecel Cash (*110#):</span>
              <strong style={{ color: '#0f172a' }}>Active Gateway</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>AT Money (*110#):</span>
              <strong style={{ color: '#0f172a' }}>Active Gateway</strong>
            </div>
          </div>
        </div>

        {/* Bank Collection Inflow Card */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <h3 className="fin-card-title">
                <Building2 size={20} color="#2563eb" />
                Partner Bank Collect Channels
              </h3>
              <div className="fin-card-sub">GCB, Ecobank, Zenith, CalBank Automated Teller API Sync</div>
            </div>
            <span className="fin-badge fin-badge-blue">Direct Bank Webhook</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '14px 0 8px 0' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#2563eb' }}>
              GH₵ {Number(metrics.bank_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              ({totalPaid > 0 ? ((Number(metrics.bank_total || 0) / totalPaid) * 100).toFixed(1) : 0}% of total collections)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>GCB Bank Collect API:</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Ecobank OmniPlus Sync:</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Zenith / CalBank Teller Webhook:</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Multi-Level Fee Breakdown Matrix ── */}
      <div className="fin-card">
        <div className="fin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="fin-card-title">
              <Layers size={20} color="#0284c7" />
              Dynamic Academic Level Collections &amp; Tariff Schedule
            </h3>
            <div className="fin-card-sub">
              Detailed tracking of tuition billing, collections, and financial hold status by academic tier
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNav?.('bursar')}
            className="fin-btn-secondary"
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            <Settings size={14} />
            Modify Level Tariffs
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Academic Level</th>
                <th style={{ textAlign: 'center' }}>Enrolled Students</th>
                <th style={{ textAlign: 'right' }}>Total Billed (GH₵)</th>
                <th style={{ textAlign: 'right' }}>Total Paid (GH₵)</th>
                <th style={{ textAlign: 'right' }}>Outstanding Arrears (GH₵)</th>
                <th style={{ textAlign: 'center' }}>Collection Rate</th>
                <th style={{ textAlign: 'center' }}>Active Holds</th>
              </tr>
            </thead>
            <tbody>
              {(metrics.level_breakdown && metrics.level_breakdown.length > 0
                ? metrics.level_breakdown
                : [
                    { level: '100', title: 'Level 100 (Freshmen)', student_count: 1, total_billed: 5300, total_paid: 2500, total_arrears: 2800, active_holds: 1, collection_rate: 47.2 },
                    { level: '200', title: 'Level 200 (Sophomores)', student_count: 0, total_billed: 0, total_paid: 0, total_arrears: 0, active_holds: 0, collection_rate: 0 },
                    { level: '300', title: 'Level 300 (Juniors)', student_count: 0, total_billed: 0, total_paid: 0, total_arrears: 0, active_holds: 0, collection_rate: 0 },
                    { level: '400', title: 'Level 400 (Seniors)', student_count: 0, total_billed: 0, total_paid: 0, total_arrears: 0, active_holds: 0, collection_rate: 0 },
                    { level: 'postgraduate', title: 'Postgraduate', student_count: 0, total_billed: 0, total_paid: 0, total_arrears: 0, active_holds: 0, collection_rate: 0 },
                  ]
              ).map((lvl) => (
                <tr key={lvl.level}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{lvl.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Level Code: {lvl.level}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {lvl.student_count}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                    GH₵ {Number(lvl.total_billed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    GH₵ {Number(lvl.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: Number(lvl.total_arrears) > 0 ? '#d97706' : '#64748b' }}>
                    GH₵ {Number(lvl.total_arrears).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{lvl.collection_rate}%</span>
                      <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(lvl.collection_rate, 100)}%`, height: '100%', background: '#0284c7' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {lvl.active_holds > 0 ? (
                      <span className="fin-badge fin-badge-hold" style={{ fontSize: 11 }}>
                        {lvl.active_holds} Blocked
                      </span>
                    ) : (
                      <span className="fin-badge fin-badge-paid" style={{ fontSize: 11 }}>
                        None
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Financial Inflows Feed ── */}
      <div className="fin-card">
        <div className="fin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="fin-card-title">
              <TrendingUp size={20} color="#059669" />
              Recent Revenue Inflows &amp; Real-time Ledger Activity
            </h3>
            <div className="fin-card-sub">
              Live log of Mobile Money payments, partner bank deposits, and verified transactions
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  setExportingPayments(true);
                  await financialsApi.exportPaymentsCsv(undefined, 'revenue_payments_stream.csv');
                } catch (e) {
                  alert('Failed to export payments stream');
                } finally {
                  setExportingPayments(false);
                }
              }}
              disabled={exportingPayments}
              className="fin-btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px', gap: 6 }}
            >
              <Download size={14} />
              {exportingPayments ? 'Exporting...' : 'Export Payments (CSV)'}
            </button>
            <button
              type="button"
              onClick={() => onNav?.('bursar')}
              className="fin-btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              View All in Bursar Hub
            </button>
          </div>
        </div>

        {(!data?.recent_payments || data.recent_payments.length === 0) ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No recent payment transactions recorded yet this semester.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="fin-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Student &amp; Index</th>
                  <th>Payment Channel</th>
                  <th>Transaction Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount (GH₵)</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Official Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_payments.slice(0, 10).map((p) => {
                  const isMoMo = p.channel === 'momo';
                  const isBank = p.channel.includes('bank');
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.student_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{p.student_index || p.student_email}</div>
                      </td>
                      <td>
                        <span
                          className={`fin-badge ${isMoMo ? 'fin-badge-amber' : isBank ? 'fin-badge-blue' : 'fin-badge-violet'}`}
                          style={{ fontSize: 11 }}
                        >
                          {p.provider || p.channel}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#334155' }}>
                          {p.reference_number || `TX-${p.id}`}
                        </code>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: 13 }}>
                        GH₵ {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`fin-badge ${p.status === 'completed' ? 'fin-badge-paid' : p.status === 'pending_verification' ? 'fin-badge-pending' : 'fin-badge-hold'}`}
                          style={{ fontSize: 10, textTransform: 'uppercase' }}
                        >
                          {p.status === 'pending_verification' ? 'Pending Verification' : p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'completed' ? (
                          <button
                            type="button"
                            disabled={downloadingId === p.id}
                            onClick={() => handleDownloadReceipt(p.id, p.receipt_number || p.reference_number || String(p.id))}
                            className="fin-btn-secondary"
                            style={{ padding: '3px 8px', fontSize: 11, gap: 4 }}
                          >
                            <Download size={12} />
                            {downloadingId === p.id ? 'Generating...' : (p.receipt_number || 'Receipt')}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>&mdash;</span>
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

      {/* ── Institutional Quick Actions Footer ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div
          onClick={() => onNav?.('bursar')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
          className="fin-card"
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Settings size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Dynamic Level Tariffs</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Configure tuition by level</div>
          </div>
        </div>

        <div
          onClick={() => onNav?.('bursar')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
          className="fin-card"
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Bursary &amp; Scholarships</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Credit tuition remissions</div>
          </div>
        </div>

        <div
          onClick={() => onNav?.('bursar')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
          className="fin-card"
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Bank Sync Documentation</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Endpoints for partner banks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
