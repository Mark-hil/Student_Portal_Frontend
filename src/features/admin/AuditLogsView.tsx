import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Lock,
  Globe,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  Clock,
  ArrowRight,
  X,
  FileText,
  MessageSquare,
  Send,
  CheckCheck,
  Radio,
  RotateCw,
  Phone,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { auditApi, smsApi } from '../../api/services';
import type {
  AuditLogEntry,
  AuditLogCategory,
  AuditLogStatus,
  SMSLogEntry,
  SMSDeliveryStatus,
  User as UserType
} from '../../types';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../utils/theme';

interface AuditLogsViewProps {
  user: UserType;
}

const CATEGORY_TABS: { id: string; label: string; category?: AuditLogCategory }[] = [
  { id: 'all', label: 'All Activities' },
  { id: 'auth', label: 'Authentication', category: 'auth' },
  { id: 'user_management', label: 'User & Role Ops', category: 'user_management' },
  { id: 'academics', label: 'Academics & Grades', category: 'academics' },
  { id: 'financials', label: 'Fees & Treasury', category: 'financials' },
  { id: 'security', label: 'Security & Shields', category: 'security' },
];

const SMS_STATUS_TABS: { id: string; label: string; status?: SMSDeliveryStatus }[] = [
  { id: 'all', label: 'All Messages' },
  { id: 'DELIVERED', label: 'Delivered', status: 'DELIVERED' },
  { id: 'SUBMITTED', label: 'Submitted / Sent', status: 'SUBMITTED' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval', status: 'PENDING_APPROVAL' },
  { id: 'FAILED', label: 'Failed / Rejected', status: 'FAILED' },
  { id: 'SIMULATED', label: 'Simulated (Dev)', status: 'SIMULATED' },
];

export function AuditLogsView({ user }: AuditLogsViewProps) {
  // Top-level View Tab: 'audit' vs 'sms'
  const [activeViewTab, setActiveViewTab] = useState<'audit' | 'sms'>('audit');

  // ── Audit Logs State ──────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [inspectEntry, setInspectEntry] = useState<AuditLogEntry | null>(null);
  const [isExportingAudit, setIsExportingAudit] = useState<boolean>(false);

  // ── SMS Logs State ────────────────────────────────────────────────────────────
  const [smsStatusFilter, setSmsStatusFilter] = useState<string>('all');
  const [smsSearchQuery, setSmsSearchQuery] = useState<string>('');
  const [debouncedSmsSearch, setDebouncedSmsSearch] = useState<string>('');
  const [smsPage, setSmsPage] = useState<number>(1);
  const [inspectSms, setInspectSms] = useState<SMSLogEntry | null>(null);
  const [isExportingSms, setIsExportingSms] = useState<boolean>(false);
  const [checkingStatusId, setCheckingStatusId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Debounce search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 350);
    return () => clearTimeout(timeout);
  };

  const handleSmsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSmsSearchQuery(val);
    setSmsPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSmsSearch(val);
    }, 350);
    return () => clearTimeout(timeout);
  };

  // ── Queries: Audit Logs ───────────────────────────────────────────────────────
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['audit-logs', 'stats'],
    queryFn: () => auditApi.stats().then(res => res.data),
    staleTime: 20_000,
  });

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['audit-logs', 'list', selectedCategory, selectedStatus, debouncedSearch, page],
    queryFn: () =>
      auditApi.list({
        page,
        page_size: 20,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: debouncedSearch || undefined,
      }).then(res => res.data),
    staleTime: 10_000,
  });

  // ── Queries: SMS Logs ─────────────────────────────────────────────────────────
  const { data: smsStats, isLoading: isSmsStatsLoading, refetch: refetchSmsStats } = useQuery({
    queryKey: ['sms-logs', 'stats'],
    queryFn: () => smsApi.stats().then(res => res.data),
    staleTime: 15_000,
  });

  const {
    data: smsLogsData,
    isLoading: isSmsLogsLoading,
    isFetching: isSmsLogsFetching,
    refetch: refetchSmsLogs
  } = useQuery({
    queryKey: ['sms-logs', 'list', smsStatusFilter, debouncedSmsSearch, smsPage],
    queryFn: () =>
      smsApi.list({
        page: smsPage,
        page_size: 20,
        status: smsStatusFilter === 'all' ? undefined : smsStatusFilter,
        search: debouncedSmsSearch || undefined,
      }).then(res => res.data),
    staleTime: 10_000,
  });

  // Refresh handlers
  const handleRefresh = () => {
    if (activeViewTab === 'audit') {
      refetchStats();
      refetchLogs();
    } else {
      refetchSmsStats();
      refetchSmsLogs();
    }
  };

  const handleExportAuditCsv = async () => {
    try {
      setIsExportingAudit(true);
      const params: Record<string, any> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (debouncedSearch) params.search = debouncedSearch;
      await auditApi.exportCsv(params, `security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('success', 'Security audit trail exported successfully.');
    } catch (err) {
      showToast('error', 'Failed to export audit logs. Please try again.');
    } finally {
      setIsExportingAudit(false);
    }
  };

  const handleExportSmsCsv = async () => {
    try {
      setIsExportingSms(true);
      const params: Record<string, any> = {};
      if (smsStatusFilter !== 'all') params.status = smsStatusFilter;
      if (debouncedSmsSearch) params.search = debouncedSmsSearch;
      await smsApi.exportCsv(params, `telecom_sms_log_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('success', 'Telecom SMS delivery report exported successfully.');
    } catch (err) {
      showToast('error', 'Failed to export SMS logs. Please try again.');
    } finally {
      setIsExportingSms(false);
    }
  };

  // SMS Actions
  const handleCheckSmsStatus = async (entry: SMSLogEntry) => {
    try {
      setCheckingStatusId(entry.id);
      const res = await smsApi.checkStatus(entry.id);
      if (res.data.success) {
        showToast('success', `Carrier Status for ${entry.recipient_phone}: ${res.data.status} (${res.data.detail})`);
      } else {
        showToast('error', `Status check returned: ${res.data.detail}`);
      }
      refetchSmsLogs();
      refetchSmsStats();
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to poll Arkesel status.');
    } finally {
      setCheckingStatusId(null);
    }
  };

  const handleResendSms = async (entry: SMSLogEntry) => {
    if (!window.confirm(`Re-dispatch SMS to ${entry.recipient_name || entry.recipient_phone}?`)) {
      return;
    }
    try {
      setResendingId(entry.id);
      const res = await smsApi.resend(entry.id);
      if (res.data.success) {
        showToast('success', `SMS re-dispatched! Status: ${res.data.status}`);
      } else {
        showToast('error', `Re-dispatch failed: ${res.data.detail}`);
      }
      refetchSmsLogs();
      refetchSmsStats();
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to resend SMS.');
    } finally {
      setResendingId(null);
    }
  };

  // Helpers for Status Badges
  const renderAuditStatusBadge = (status: AuditLogStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0'
          }}>
            <CheckCircle2 size={12} /> Success
          </span>
        );
      case 'FAILURE':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#fff1f2',
            color: '#9f1239',
            border: '1px solid #fecdd3'
          }}>
            <XCircle size={12} /> Failure
          </span>
        );
      case 'WARNING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a'
          }}>
            <AlertTriangle size={12} /> Warning
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const renderSmsStatusBadge = (status: SMSDeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0'
          }}>
            <CheckCheck size={12} /> Delivered
          </span>
        );
      case 'SUBMITTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            <Send size={12} /> Submitted
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a'
          }}>
            <Clock size={12} /> Pending Approval
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#fff1f2',
            color: '#9f1239',
            border: '1px solid #fecdd3'
          }}>
            <XCircle size={12} /> {status === 'REJECTED' ? 'Rejected' : 'Failed'}
          </span>
        );
      case 'SIMULATED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#f5f3ff',
            color: '#6d28d9',
            border: '1px solid #ddd6fe'
          }}>
            <Radio size={12} /> Simulated
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1'
          }}>
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const getCategoryColor = (cat: AuditLogCategory) => {
    switch (cat) {
      case 'auth': return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' };
      case 'user_management': return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' };
      case 'academics': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'financials': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'security': return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: toastMessage.type === 'success' ? '#065f46' : '#9f1239',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0, marginLeft: 8 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Banner / Header ────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090e1a 0%, #1e1b4b 60%, #172554 100%)',
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
            top: -50,
            right: -50,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#a5b4fc',
                  background: 'rgba(99, 102, 241, 0.2)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Lock size={12} /> Compliance & Integrity Trail
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>•</span>
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={13} /> Immutable Append-Only Ledger
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
              Institutional Security & Audit Trail
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13.5, maxWidth: 650 }}>
              Full chronological record of authentication attempts, administrative changes, grade publications, student admissions, financial operations, and SMS telecom delivery receipts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleRefresh}
              disabled={activeViewTab === 'audit' ? isLogsFetching : isSmsLogsFetching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: (activeViewTab === 'audit' ? isLogsFetching : isSmsLogsFetching) ? 'not-allowed' : 'pointer',
                opacity: (activeViewTab === 'audit' ? isLogsFetching : isSmsLogsFetching) ? 0.7 : 1,
              }}
            >
              <RefreshCw size={14} className={(activeViewTab === 'audit' ? isLogsFetching : isSmsLogsFetching) ? 'spin' : ''} />
              Refresh
            </button>
            {activeViewTab === 'audit' ? (
              <button
                onClick={handleExportAuditCsv}
                disabled={isExportingAudit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: '1px solid #4338ca',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isExportingAudit ? 'not-allowed' : 'pointer',
                  opacity: isExportingAudit ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
                }}
              >
                <FileSpreadsheet size={15} />
                {isExportingAudit ? 'Generating CSV...' : 'Export Audit CSV'}
              </button>
            ) : (
              <button
                onClick={handleExportSmsCsv}
                disabled={isExportingSms}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #0369a1',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isExportingSms ? 'not-allowed' : 'pointer',
                  opacity: isExportingSms ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                }}
              >
                <FileSpreadsheet size={15} />
                {isExportingSms ? 'Generating CSV...' : 'Export Telecom CSV'}
              </button>
            )}
          </div>
        </div>

        {/* ── Top-Level View Switcher Tabs ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16 }}>
          <button
            onClick={() => setActiveViewTab('audit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: activeViewTab === 'audit' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeViewTab === 'audit' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#ffffff',
              border: activeViewTab === 'audit' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
              backdropFilter: activeViewTab === 'audit' ? 'blur(10px)' : 'none',
            }}
          >
            <ShieldCheck size={16} color={activeViewTab === 'audit' ? '#a5b4fc' : 'rgba(255,255,255,0.7)'} />
            Security & User Action Trail
            {stats && (
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 99,
                fontWeight: 600
              }}>
                {stats.total_events}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveViewTab('sms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: activeViewTab === 'sms' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeViewTab === 'sms' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#ffffff',
              border: activeViewTab === 'sms' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
              backdropFilter: activeViewTab === 'sms' ? 'blur(10px)' : 'none',
            }}
          >
            <MessageSquare size={16} color={activeViewTab === 'sms' ? '#38bdf8' : 'rgba(255,255,255,0.7)'} />
            SMS Dispatch & Carrier Tracker
            {smsStats && (
              <span style={{
                background: 'rgba(56, 189, 248, 0.25)',
                color: '#bae6fd',
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 99,
                fontWeight: 600
              }}>
                {smsStats.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: SECURITY AUDIT TRAIL                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeViewTab === 'audit' && (
        <>
          {/* Security KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              {
                label: 'Total Events Logged',
                val: stats?.total_events ?? 0,
                sub: 'System-wide activity record',
                color: '#4f46e5',
                bg: '#eef2ff',
                icon: Layers,
              },
              {
                label: 'Failed Logins (24h)',
                val: stats?.failed_logins_24h ?? 0,
                sub: (stats?.failed_logins_24h ?? 0) > 0 ? 'Requires observation' : 'Normal authentication traffic',
                color: (stats?.failed_logins_24h ?? 0) > 0 ? '#e11d48' : '#059669',
                bg: (stats?.failed_logins_24h ?? 0) > 0 ? '#fff1f2' : '#ecfdf5',
                icon: (stats?.failed_logins_24h ?? 0) > 0 ? ShieldAlert : ShieldCheck,
              },
              {
                label: 'Administrative Ops (7d)',
                val: stats?.admin_changes_7d ?? 0,
                sub: 'Role, student & system changes',
                color: '#0284c7',
                bg: '#f0f9ff',
                icon: Activity,
              },
              {
                label: 'Security Warnings (7d)',
                val: stats?.security_alerts_7d ?? 0,
                sub: 'Privilege guards & shield events',
                color: '#d97706',
                bg: '#fffbeb',
                icon: AlertTriangle,
              },
            ].map(({ label, val, sub, color, bg, icon: Icon }) => (
              <Card key={label} style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    background: bg,
                    borderRadius: 12,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}22`,
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.slate5, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.slate9, lineHeight: 1 }}>
                    {isStatsLoading ? '...' : val.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: C.slate4, marginTop: 4 }}>{sub}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters & Controls */}
          <Card style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {/* Category Tabs */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORY_TABS.map(tab => {
                  const active = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setSelectedCategory(tab.id); setPage(1); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: active ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                        background: active ? '#4f46e5' : '#ffffff',
                        color: active ? '#ffffff' : C.slate7,
                        boxShadow: active ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Status & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    color: C.slate8,
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="FAILURE">Failures Only</option>
                  <option value="WARNING">Warnings Only</option>
                </select>

                <div style={{ position: 'relative', minWidth: 260 }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.slate4 }}
                  />
                  <input
                    type="text"
                    placeholder="Search actor, action, IP or target..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                      width: '100%',
                      padding: '7px 12px 7px 32px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                      color: C.slate9,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Audit Logs Interactive Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: C.slate5, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Timestamp</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actor</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action & Category</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Target Entity</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client / IP</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isLogsLoading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                        <Spinner />
                      </td>
                    </tr>
                  ) : !logsData?.results || logsData.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: C.slate5 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={32} color="#94a3b8" />
                          <div style={{ fontWeight: 600, fontSize: 14 }}>No audit records match the current filters.</div>
                          <div style={{ fontSize: 12 }}>Try clearing the search term or switching activity categories.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logsData.results.map((log: AuditLogEntry) => {
                      const catStyle = getCategoryColor(log.action_category);
                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Timestamp */}
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', color: C.slate7 }}>
                            <div style={{ fontWeight: 600, fontSize: 12.5, color: C.slate9 }}>
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div style={{ fontSize: 11, color: C.slate4 }}>
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>

                          {/* Actor */}
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {log.actor?.full_name ? log.actor.full_name[0].toUpperCase() : <UserIcon size={14} />}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: C.slate9, fontSize: 12.5 }}>
                                  {log.actor?.full_name || 'System Auto-Task'}
                                </div>
                                <div style={{ fontSize: 11, color: C.slate5 }}>
                                  {log.actor_role ? log.actor_role.replace('_', ' ') : 'System'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Action & Category */}
                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: catStyle.bg,
                                color: catStyle.text,
                                border: `1px solid ${catStyle.border}`,
                                marginBottom: 4,
                              }}
                            >
                              {log.category_display || log.action_category}
                            </span>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>
                              {log.action}
                            </div>
                          </td>

                          {/* Target Entity */}
                          <td style={{ padding: '12px 18px' }}>
                            {log.target_repr ? (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>
                                  {log.target_repr}
                                </div>
                                <div style={{ fontSize: 11, color: C.slate4 }}>
                                  {log.target_type} {log.target_id ? `(#${log.target_id})` : ''}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: C.slate4, fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Description */}
                          <td style={{ padding: '12px 18px', maxWidth: 280 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: C.slate7,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={log.description}
                            >
                              {log.description}
                            </div>
                          </td>

                          {/* Client / IP */}
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.slate6 }}>
                              <Globe size={12} color={C.slate4} />
                              <span>{log.ip_address || '127.0.0.1'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                            {renderAuditStatusBadge(log.status)}
                          </td>

                          {/* Details Button */}
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <button
                              onClick={() => setInspectEntry(log)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: C.slate7,
                                border: '1px solid #cbd5e1',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                                e.currentTarget.style.color = C.slate9;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.color = C.slate7;
                              }}
                            >
                              <Eye size={13} /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {logsData && logsData.count > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: 12.5,
                  color: C.slate6,
                }}
              >
                <div>
                  Showing <strong>{((page - 1) * 20) + 1}</strong> to <strong>{Math.min(page * 20, logsData.count)}</strong> of <strong>{logsData.count}</strong> logged activities
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!logsData.previous}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: C.slate7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !logsData.previous ? 'not-allowed' : 'pointer',
                      opacity: !logsData.previous ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontWeight: 600, color: C.slate8 }}>
                    Page {page} of {Math.ceil(logsData.count / 20) || 1}
                  </span>

                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!logsData.next}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: C.slate7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !logsData.next ? 'not-allowed' : 'pointer',
                      opacity: !logsData.next ? 0.5 : 1,
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SMS DISPATCH & TELECOM CARRIER TRACKER                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeViewTab === 'sms' && (
        <>
          {/* Telecom KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              {
                label: 'Total Dispatched SMS',
                val: smsStats?.total ?? 0,
                sub: 'Lifetime outbound volume',
                color: '#0284c7',
                bg: '#f0f9ff',
                icon: MessageSquare,
              },
              {
                label: 'Carrier Delivered',
                val: smsStats?.delivered ?? 0,
                sub: `${smsStats?.delivery_rate_percent ?? 0}% verified handset delivery`,
                color: '#059669',
                bg: '#ecfdf5',
                icon: CheckCheck,
              },
              {
                label: 'Pending Approval / Sent',
                val: (smsStats?.pending_approval ?? 0) + (smsStats?.submitted ?? 0),
                sub: (smsStats?.pending_approval ?? 0) > 0 ? 'Awaiting Arkesel Sender ID approval' : 'In-flight to telecom carrier',
                color: '#d97706',
                bg: '#fffbeb',
                icon: Clock,
              },
              {
                label: 'Failed / Rejected',
                val: smsStats?.failed ?? 0,
                sub: (smsStats?.failed ?? 0) > 0 ? 'Undelivered to phone' : 'Zero transmission drop-offs',
                color: (smsStats?.failed ?? 0) > 0 ? '#e11d48' : '#64748b',
                bg: (smsStats?.failed ?? 0) > 0 ? '#fff1f2' : '#f8fafc',
                icon: (smsStats?.failed ?? 0) > 0 ? XCircle : ShieldCheck,
              },
            ].map(({ label, val, sub, color, bg, icon: Icon }) => (
              <Card key={label} style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    background: bg,
                    borderRadius: 12,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}22`,
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.slate5, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.slate9, lineHeight: 1 }}>
                    {isSmsStatsLoading ? '...' : val.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: C.slate4, marginTop: 4 }}>{sub}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Arkesel Gateway Notice Banner */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Info size={18} color="#0284c7" />
              <div style={{ fontSize: 12.5, color: '#0369a1' }}>
                <strong>Arkesel SMS Gateway Integration (Ghana & International):</strong> Real-time delivery receipts (DLR) are captured via direct gateway polling and public webhook callback (<code>/api/v1/notifications/sms/webhook/</code>).
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={14} color="#0284c7" /> Sender ID: ASDAM
            </div>
          </div>

          {/* SMS Filters & Controls */}
          <Card style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SMS_STATUS_TABS.map(tab => {
                  const active = smsStatusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setSmsStatusFilter(tab.id); setSmsPage(1); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        background: active ? '#0284c7' : '#ffffff',
                        color: active ? '#ffffff' : C.slate7,
                        boxShadow: active ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: 280 }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.slate4 }}
                />
                <input
                  type="text"
                  placeholder="Search recipient phone, student name, msg ID..."
                  value={smsSearchQuery}
                  onChange={handleSmsSearchChange}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    color: C.slate9,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </Card>

          {/* SMS Logs Interactive Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: C.slate5, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Recipient</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Purpose / Sender</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Delivery Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Provider Msg ID</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Message Preview</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Dispatched / Delivered</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Live Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isSmsLogsLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: 'center' }}>
                        <Spinner />
                      </td>
                    </tr>
                  ) : !smsLogsData?.results || smsLogsData.results.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.slate5 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <MessageSquare size={32} color="#94a3b8" />
                          <div style={{ fontWeight: 600, fontSize: 14 }}>No SMS records match your filter.</div>
                          <div style={{ fontSize: 12 }}>Check your search criteria or switch to "All Messages".</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    smsLogsData.results.map((sms: SMSLogEntry) => {
                      const isCheckingThis = checkingStatusId === sms.id;
                      const isResendingThis = resendingId === sms.id;
                      return (
                        <tr
                          key={sms.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Recipient */}
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                <Phone size={13} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: C.slate9, fontSize: 13, fontFamily: 'monospace' }}>
                                  {sms.recipient_phone}
                                </div>
                                <div style={{ fontSize: 11.5, color: C.slate6 }}>
                                  {sms.recipient_name || sms.user_full_name || 'Unlinked Recipient'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Purpose / Sender */}
                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#f1f5f9',
                                color: C.slate8,
                                border: '1px solid #cbd5e1',
                                marginBottom: 3,
                              }}
                            >
                              {sms.purpose ? sms.purpose.replace(/_/g, ' ') : 'general'}
                            </span>
                            <div style={{ fontSize: 11, color: C.slate5 }}>
                              Sender: <strong>{sms.sender_id || 'ASDAM'}</strong>
                            </div>
                          </td>

                          {/* Delivery Status */}
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                            {renderSmsStatusBadge(sms.status)}
                            {sms.status_code && (
                              <div style={{ fontSize: 10, color: C.slate4, marginTop: 2 }}>
                                Code: {sms.status_code}
                              </div>
                            )}
                          </td>

                          {/* Provider Msg ID */}
                          <td style={{ padding: '12px 18px' }}>
                            {sms.provider_message_id ? (
                              <span style={{
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: C.slate7,
                                background: '#f8fafc',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                display: 'inline-block',
                                maxWidth: 140,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={sms.provider_message_id}>
                                {sms.provider_message_id}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: C.slate4 }}>—</span>
                            )}
                          </td>

                          {/* Message Preview */}
                          <td style={{ padding: '12px 18px', maxWidth: 260 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: C.slate7,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                              }}
                              onClick={() => setInspectSms(sms)}
                              title="Click to view full message"
                            >
                              {sms.message_body}
                            </div>
                          </td>

                          {/* Timestamps */}
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', fontSize: 11.5 }}>
                            <div style={{ color: C.slate8, fontWeight: 500 }}>
                              Sent: {sms.sent_at ? new Date(sms.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                            <div style={{ color: sms.delivered_at ? '#059669' : C.slate4, fontSize: 10.5 }}>
                              Delivered: {sms.delivered_at ? new Date(sms.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                            </div>
                          </td>

                          {/* Live Actions */}
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {/* Poll Live Carrier Status */}
                              {sms.provider_message_id && sms.status !== 'SIMULATED' && (
                                <button
                                  onClick={() => handleCheckSmsStatus(sms)}
                                  disabled={isCheckingThis}
                                  title="Check carrier delivery status via Arkesel v2"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: '#f0f9ff',
                                    color: '#0284c7',
                                    border: '1px solid #bae6fd',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: isCheckingThis ? 'not-allowed' : 'pointer',
                                    opacity: isCheckingThis ? 0.6 : 1,
                                  }}
                                >
                                  <RotateCw size={11} className={isCheckingThis ? 'spin' : ''} />
                                  {isCheckingThis ? 'Checking...' : 'Check Status'}
                                </button>
                              )}

                              {/* Resend button */}
                              <button
                                onClick={() => handleResendSms(sms)}
                                disabled={isResendingThis}
                                title="Re-dispatch message to recipient"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#f8fafc',
                                  color: C.slate7,
                                  border: '1px solid #cbd5e1',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: isResendingThis ? 'not-allowed' : 'pointer',
                                  opacity: isResendingThis ? 0.6 : 1,
                                }}
                              >
                                <Send size={11} className={isResendingThis ? 'spin' : ''} />
                                {isResendingThis ? 'Sending...' : 'Resend'}
                              </button>

                              {/* Inspect details */}
                              <button
                                onClick={() => setInspectSms(sms)}
                                title="View carrier payload & delivery details"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#f1f5f9',
                                  color: C.slate7,
                                  border: '1px solid #cbd5e1',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {smsLogsData && smsLogsData.count > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: 12.5,
                  color: C.slate6,
                }}
              >
                <div>
                  Showing <strong>{((smsPage - 1) * 20) + 1}</strong> to <strong>{Math.min(smsPage * 20, smsLogsData.count)}</strong> of <strong>{smsLogsData.count}</strong> dispatched SMS
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setSmsPage(p => Math.max(1, p - 1))}
                    disabled={!smsLogsData.previous}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: C.slate7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !smsLogsData.previous ? 'not-allowed' : 'pointer',
                      opacity: !smsLogsData.previous ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontWeight: 600, color: C.slate8 }}>
                    Page {smsPage} of {Math.ceil(smsLogsData.count / 20) || 1}
                  </span>

                  <button
                    onClick={() => setSmsPage(p => p + 1)}
                    disabled={!smsLogsData.next}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: C.slate7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !smsLogsData.next ? 'not-allowed' : 'pointer',
                      opacity: !smsLogsData.next ? 0.5 : 1,
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: AUDIT LOG INSPECTOR                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {inspectEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setInspectEntry(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: 28,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Audit Event #{inspectEntry.id}
                  </span>
                  {renderAuditStatusBadge(inspectEntry.status)}
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
                  {inspectEntry.action}
                </h2>
                <div style={{ fontSize: 12, color: C.slate5, marginTop: 4 }}>
                  {new Date(inspectEntry.timestamp).toLocaleString()} ({inspectEntry.category_display})
                </div>
              </div>
              <button
                onClick={() => setInspectEntry(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.slate6,
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 4 }}>Description & Rationale</div>
              <div style={{ fontSize: 13, color: C.slate8, lineHeight: 1.5 }}>{inspectEntry.description}</div>
            </div>

            {/* Actors and Targets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>Initiating Actor</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9 }}>
                  {inspectEntry.actor?.full_name || inspectEntry.actor_email || 'Automated / System'}
                </div>
                <div style={{ fontSize: 12, color: C.slate5 }}>
                  Role: {inspectEntry.actor_role || 'system'}
                </div>
                {inspectEntry.actor?.email && (
                  <div style={{ fontSize: 11.5, color: C.slate4, marginTop: 2 }}>{inspectEntry.actor.email}</div>
                )}
              </div>

              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>Target Object</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9 }}>
                  {inspectEntry.target_repr || 'N/A'}
                </div>
                <div style={{ fontSize: 12, color: C.slate5 }}>
                  Type: {inspectEntry.target_type || 'N/A'} | ID: {inspectEntry.target_id || 'N/A'}
                </div>
              </div>
            </div>

            {/* Client Context */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 4 }}>Client & Network Signature</div>
              <div style={{ fontSize: 12, color: C.slate7 }}><strong>IP Address:</strong> {inspectEntry.ip_address || '127.0.0.1'}</div>
              <div style={{ fontSize: 12, color: C.slate7, marginTop: 2, wordBreak: 'break-all' }}><strong>User Agent:</strong> {inspectEntry.user_agent || 'Unknown'}</div>
            </div>

            {/* Change Diffs (Before / After) */}
            {inspectEntry.changes && Object.keys(inspectEntry.changes).length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.slate8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} color="#4f46e5" />
                  State Change Diffs (Before vs After)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>BEFORE CHANGE</div>
                    <pre style={{ margin: 0, fontSize: 11.5, color: '#881337', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                      {JSON.stringify(inspectEntry.changes.before || {}, null, 2)}
                    </pre>
                  </div>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', marginBottom: 6 }}>AFTER CHANGE</div>
                    <pre style={{ margin: 0, fontSize: 11.5, color: '#064e3b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                      {JSON.stringify(inspectEntry.changes.after || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Additional Metadata */}
            {inspectEntry.metadata && Object.keys(inspectEntry.metadata).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.slate8, marginBottom: 8 }}>
                  Raw Execution Metadata
                </div>
                <pre style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 11.5,
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(inspectEntry.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setInspectEntry(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: C.slate7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: SMS DETAIL & GATEWAY INSPECTOR                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {inspectSms && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setInspectSms(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: 28,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SMS Log #{inspectSms.id} • {inspectSms.provider}
                  </span>
                  {renderSmsStatusBadge(inspectSms.status)}
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
                  Dispatch to {inspectSms.recipient_phone}
                </h2>
                <div style={{ fontSize: 12, color: C.slate5, marginTop: 4 }}>
                  Purpose: <strong>{inspectSms.purpose}</strong> | Sender ID: <strong>{inspectSms.sender_id}</strong> | Retries: <strong>{inspectSms.retry_count}</strong>
                </div>
              </div>
              <button
                onClick={() => setInspectSms(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.slate6,
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient & Provider Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>Recipient Info</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9 }}>
                  {inspectSms.recipient_name || inspectSms.user_full_name || 'N/A'}
                </div>
                <div style={{ fontSize: 12, color: C.slate7, fontFamily: 'monospace', marginTop: 2 }}>
                  {inspectSms.recipient_phone}
                </div>
                {inspectSms.user_email && (
                  <div style={{ fontSize: 11.5, color: C.slate4, marginTop: 2 }}>{inspectSms.user_email}</div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>Carrier Delivery Details</div>
                <div style={{ fontSize: 12, color: C.slate7 }}>
                  <strong>Gateway Msg ID:</strong> <span style={{ fontFamily: 'monospace' }}>{inspectSms.provider_message_id || 'None'}</span>
                </div>
                <div style={{ fontSize: 12, color: C.slate7, marginTop: 4 }}>
                  <strong>Dispatched:</strong> {inspectSms.sent_at ? new Date(inspectSms.sent_at).toLocaleString() : 'Not recorded'}
                </div>
                <div style={{ fontSize: 12, color: inspectSms.delivered_at ? '#059669' : C.slate7, marginTop: 2 }}>
                  <strong>Handset Delivered:</strong> {inspectSms.delivered_at ? new Date(inspectSms.delivered_at).toLocaleString() : 'Pending confirmation'}
                </div>
              </div>
            </div>

            {/* Full Message Body */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>
                Full SMS Content ({inspectSms.message_body.length} characters)
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: 14,
                fontSize: 13,
                color: C.slate9,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit'
              }}>
                {inspectSms.message_body}
              </div>
            </div>

            {/* Error Detail (if any) */}
            {inspectSms.error_detail && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', marginBottom: 4 }}>
                  Carrier Error / Status Detail
                </div>
                <div style={{ fontSize: 12.5, color: '#881337', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {inspectSms.error_detail}
                </div>
              </div>
            )}

            {/* Gateway Response JSON */}
            {inspectSms.gateway_response && Object.keys(inspectSms.gateway_response).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', marginBottom: 6 }}>
                  Raw Arkesel Gateway Response Payload
                </div>
                <pre style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 11.5,
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(inspectSms.gateway_response, null, 2)}
                </pre>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {inspectSms.provider_message_id && inspectSms.status !== 'SIMULATED' && (
                  <button
                    onClick={() => handleCheckSmsStatus(inspectSms)}
                    disabled={checkingStatusId === inspectSms.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#f0f9ff',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCw size={13} className={checkingStatusId === inspectSms.id ? 'spin' : ''} />
                    Check Live Status
                  </button>
                )}

                <button
                  onClick={() => handleResendSms(inspectSms)}
                  disabled={resendingId === inspectSms.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    color: C.slate8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Send size={13} className={resendingId === inspectSms.id ? 'spin' : ''} />
                  Re-dispatch SMS
                </button>
              </div>

              <button
                onClick={() => setInspectSms(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: C.slate7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
