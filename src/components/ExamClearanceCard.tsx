import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Download,
  ShieldCheck,
  QrCode,
  Calendar,
  BookOpen,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { examSlipApi } from '../api/services';
import type { ExamClearanceStatus } from '../types';
import { C } from '../utils/theme';

interface ExamClearanceCardProps {
  className?: string;
  onRefresh?: () => void;
}

export const ExamClearanceCard: React.FC<ExamClearanceCardProps> = () => {
  const [status, setStatus] = useState<ExamClearanceStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await examSlipApi.getStatus();
      setStatus(res.data);
    } catch (err: any) {
      console.error('Failed to fetch clearance status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDownloadSlip = async () => {
    try {
      setDownloading(true);
      const toastId = toast.loading('Generating official 1-page examination docket...');
      await examSlipApi.downloadPdf(
        undefined,
        `Exam_Docket_${status?.student_id || 'Candidate'}_${new Date().toISOString().slice(0, 10)}.pdf`
      );
      toast.success('Examination docket downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to generate examination clearance slip.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          marginBottom: 20,
        }}
      >
        <div style={{ height: 16, width: 200, background: '#f1f5f9', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 28, width: '100%', background: '#f8fafc', borderRadius: 6 }} />
      </div>
    );
  }

  if (!status) return null;

  const isEligible = status.is_eligible;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        background: isEligible
          ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%, #fefce8 100%)'
          : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 60%, #fffbeb 100%)',
        border: isEligible ? '1px solid #a7f3d0' : '1px solid #fecdd3',
        borderLeft: isEligible ? '5px solid #047857' : '5px solid #e11d48',
        boxShadow: '0 4px 16px -2px rgba(4, 19, 13, 0.05)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Left Side: Details */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {/* Status pill row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 9999,
                background: isEligible ? '#dcfce7' : '#fee2e2',
                color: isEligible ? '#047857' : '#be123c',
                border: isEligible ? '1px solid #86efac' : '1px solid #fca5a5',
                letterSpacing: '0.02em',
              }}
            >
              {isEligible ? (
                <>
                  <ShieldCheck size={14} style={{ color: '#047857' }} />
                  EXAMINATION CLEARANCE: APPROVED
                </>
              ) : (
                <>
                  <AlertTriangle size={14} style={{ color: '#be123c' }} />
                  EXAMINATION CLEARANCE: RESTRICTED
                </>
              )}
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Calendar size={13} style={{ color: '#ca8a04' }} />
              {status.semester}
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Candidate Examination Clearance Docket & Hall Ticket
            {isEligible && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#b45309',
                }}
              >
                <Sparkles size={12} />
                Verified
              </span>
            )}
          </h3>

          {isEligible ? (
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6, maxWidth: 640 }}>
              Your financial clearance and registered coursework have been verified. You are currently confirmed for{' '}
              <strong style={{ color: '#047857' }}>
                {status.registered_courses_count} courses ({status.total_credits} Credits)
              </strong>
              . Download your official 1-page pass with authentication QR code for exam hall admission.
            </p>
          ) : (
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>
                {status.has_financial_hold
                  ? `Active Financial Hold: ${status.hold_reason || 'Outstanding balance'} (Arrears: GH₵ ${parseFloat(status.hold_amount || '0').toFixed(2)})`
                  : 'No active course registrations found for the current semester.'}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                Candidates must have zero outstanding financial holds and verified course registration to generate their hall ticket.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Action Button */}
        <div style={{ flexShrink: 0 }}>
          {isEligible ? (
            <button
              onClick={handleDownloadSlip}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                cursor: downloading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!downloading) {
                  e.currentTarget.style.background = '#065f46';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!downloading) {
                  e.currentTarget.style.background = '#047857';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {downloading ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Generating Docket...
                </>
              ) : (
                <>
                  <Printer size={16} style={{ color: '#facc15' }} />
                  Print / Download Docket (PDF)
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                background: '#fff1f2',
                color: '#be123c',
                border: '1px solid #fecdd3',
              }}
            >
              Clearance Required
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamClearanceCard;
