import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  BarChart2,
  FileDown,
  GraduationCap,
  FileText,
  Filter,
  ShieldCheck,
  Award,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Sparkles,
  QrCode,
  BookOpen,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { C, gpaColor, gradeColor } from '../../utils/theme';
import { gradesApi, financialsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';
import toast from 'react-hot-toast';

export function StudentGrades({ onNav }: { onNav?: (tab: string) => void } = {}) {
  const { isMobile } = useBreakpoint();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'transcript' | 'coursework'>('transcript');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [showGradingScale, setShowGradingScale] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qc = useQueryClient();

  const { data: statement } = useQuery({
    queryKey: ['financial-statement'],
    queryFn: () => financialsApi.getMyStatement().then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: gpa, refetch: refetchGpa } = useQuery({
    queryKey: ['gpa-summary'],
    queryFn: () => gradesApi.gpaSummary().then((r) => r.data),
    staleTime: 10_000,
  });

  const { data: gradeData, refetch: refetchGrades } = useQuery({
    queryKey: ['grades', {}],
    queryFn: () => gradesApi.list().then((r) => r.data),
    staleTime: 10_000,
  });

  const { data: transcript, refetch: refetchTranscript } = useQuery({
    queryKey: ['transcript'],
    queryFn: () => gradesApi.transcript().then((r) => r.data),
    staleTime: 10_000,
  });

  const { data: courseSummaries = [], refetch: refetchSummaries } = useQuery({
    queryKey: ['grades', 'course-summary'],
    queryFn: () => gradesApi.courseSummary().then((r) => r.data),
    staleTime: 10_000,
  });

  const recompute = useMutation({
    mutationFn: () => gradesApi.recompute(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gpa-summary'] });
      qc.invalidateQueries({ queryKey: ['transcript'] });
      qc.invalidateQueries({ queryKey: ['grades'] });
      qc.invalidateQueries({ queryKey: ['grades', 'course-summary'] });
      refetchGpa();
      refetchTranscript();
      refetchGrades();
      refetchSummaries();
      toast.success('GPA and Transcripts refreshed');
    },
  });

  const allGrades = gradeData?.results ?? [];
  const semGPA = gpa?.semester_gpa ? parseFloat(gpa.semester_gpa) : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  const hasHold = Boolean(statement?.has_active_hold);
  const feeBalance = statement?.balance ? Number(statement.balance) : 0;
  const isArrears = hasHold || feeBalance > 0;

  const candidateName =
    user?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name}` : 'Student Candidate');
  const studentIndexNo = user?.student_id || 'ASDAM-STUDENT';
  const mohPin = user?.moh_pin || 'MOH-NUR-VERIFIED';
  const programName = user?.program
    ? user.program.charAt(0).toUpperCase() +
      user.program.slice(1) +
      (user.program.toLowerCase().includes('nursing') ||
      user.program.toLowerCase().includes('midwifery')
        ? ''
        : ' Nursing')
    : user?.department || 'Registered General Nursing';
  const academicLevel =
    user?.class_name || user?.profile?.academic_level || 'Level 300';

  const getDegreeClassification = (gpaVal: number | null) => {
    if (gpaVal === null || isNaN(gpaVal)) {
      return {
        label: 'In Progress',
        color: '#64748b',
        bg: '#f1f5f9',
        border: '#cbd5e1',
      };
    }
    if (gpaVal >= 3.6) {
      return {
        label: 'First Class Honours / Distinction',
        color: '#064e3b',
        bg: '#ecfdf5',
        border: '#a7f3d0',
      };
    }
    if (gpaVal >= 3.0) {
      return {
        label: 'Second Class Honours (Upper Division)',
        color: '#0369a1',
        bg: '#f0f9ff',
        border: '#bae6fd',
      };
    }
    if (gpaVal >= 2.5) {
      return {
        label: 'Second Class Honours (Lower Division)',
        color: '#b45309',
        bg: '#fffbeb',
        border: '#fde68a',
      };
    }
    if (gpaVal >= 2.0) {
      return {
        label: 'Third Class Honours',
        color: '#c2410c',
        bg: '#fff7ed',
        border: '#fed7aa',
      };
    }
    if (gpaVal >= 1.0) {
      return {
        label: 'Pass',
        color: '#475569',
        bg: '#f8fafc',
        border: '#e2e8f0',
      };
    }
    return {
      label: 'Unsatisfactory / Fail',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    };
  };

  const standing = getDegreeClassification(cumGPA);

  // Compute total quality points across all recorded semesters
  const totalQualityPoints = (transcript ?? []).reduce((acc: number, sem: any) => {
    const semQp = (sem.courses ?? []).reduce(
      (cAcc: number, c: any) => cAcc + (parseFloat(c.quality_points) || 0),
      0
    );
    return acc + semQp;
  }, 0);

  const totalCreditsAttempted = (transcript ?? []).reduce(
    (acc: number, sem: any) => acc + (Number(sem.credits_attempted) || 0),
    0
  );

  const totalCreditsEarned =
    gpa?.credits_completed ??
    (transcript ?? []).reduce(
      (acc: number, sem: any) => acc + (Number(sem.credits_earned) || 0),
      0
    );

  const uniqueCourses = Array.from(
    new Set(allGrades.map((g: any) => g.assignment?.course_code).filter(Boolean))
  );
  const filteredGrades =
    selectedCourse === 'ALL'
      ? allGrades
      : allGrades.filter((g: any) => g.assignment?.course_code === selectedCourse);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await gradesApi.downloadTranscriptPdf();
      if (res?.isOfficial) {
        toast.success('Official Academic Transcript downloaded successfully');
      } else {
        const arrearsVal = res?.holdAmount ? Number(res.holdAmount) : feeBalance;
        toast(
          `Unofficial Academic Transcript downloaded. Outstanding fee balance: GH¢ ${arrearsVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Please settle balance via Student Financials.`,
          {
            icon: '📄',
            duration: 6500,
            style: {
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
            },
          }
        );
      }
    } catch (err: any) {
      let msg = 'Failed to generate transcript PDF';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.detail) msg = parsed.detail;
        } catch (_) {}
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg, { duration: 5000 });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── 1. Top Institutional Masthead & Actions ───────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #04382a 100%)',
          borderRadius: 18,
          padding: isMobile ? '20px 18px' : '26px 32px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 20,
          border: '1px solid rgba(202, 138, 4, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Watermark Accent */}
        <div
          style={{
            position: 'absolute',
            right: -30,
            bottom: -40,
            opacity: 0.08,
            transform: 'rotate(-12deg)',
            pointerEvents: 'none',
          }}
        >
          <GraduationCap size={220} color="#fff" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(254, 240, 138, 0.15)',
              border: '1px solid rgba(254, 240, 138, 0.35)',
              color: '#fef08a',
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <ShieldCheck size={13} /> S.D.A. Nursing & Midwifery Training College • Asamang
          </div>
          <h2
            style={{
              fontSize: isMobile ? 21 : 25,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Official Academic Record & Transcript
          </h2>
          <div
            style={{
              fontSize: 12.5,
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span>Affiliated to University of Cape Coast (UCC)</span>
            <span>•</span>
            <span>Regulated by Nursing & Midwifery Council (NMC)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: isMobile ? '100%' : 'auto',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <button
            onClick={() => recompute.mutate()}
            disabled={recompute.isPending}
            title="Recalculate GPA"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 12,
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: recompute.isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              backdropFilter: 'blur(6px)',
              flex: isMobile ? '1' : 'none',
            }}
          >
            <RefreshCw size={15} className={recompute.isPending ? 'spin' : ''} />
            {recompute.isPending ? 'Calculating…' : 'Refresh'}
          </button>

          {activeTab === 'transcript' && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: isArrears
                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                  : 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                color: '#ffffff',
                border: isArrears ? '1px solid #fef3c7' : '1px solid #fef08a',
                borderRadius: 12,
                padding: '11px 22px',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: downloading ? 'not-allowed' : 'pointer',
                boxShadow: isArrears
                  ? '0 4px 14px rgba(217, 119, 6, 0.35)'
                  : '0 4px 14px rgba(202, 138, 4, 0.35)',
                opacity: downloading ? 0.75 : 1,
                transition: 'all 0.15s ease',
                flex: isMobile ? '2' : 'none',
              }}
            >
              <FileDown size={17} />
              {downloading
                ? 'Generating PDF…'
                : isArrears
                ? 'Download Unofficial PDF Transcript'
                : 'Download PDF Transcript'}
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Navigation Tabs ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? 6 : 12,
          borderBottom: `1px solid ${C.slate2}`,
          paddingBottom: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          onClick={() => setActiveTab('transcript')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '10px 14px' : '12px 22px',
            fontSize: isMobile ? 13.5 : 14.5,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'transcript'
                ? `2.5px solid ${C.primary}`
                : '2.5px solid transparent',
            color: activeTab === 'transcript' ? C.primary : C.slate5,
            marginBottom: -2,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <GraduationCap size={18} /> Official Transcript & Cumulative Record
        </button>

        <button
          onClick={() => setActiveTab('coursework')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '10px 14px' : '12px 22px',
            fontSize: isMobile ? 13.5 : 14.5,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'coursework'
                ? `2.5px solid ${C.primary}`
                : '2.5px solid transparent',
            color: activeTab === 'coursework' ? C.primary : C.slate5,
            marginBottom: -2,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={18} /> Continuous Assessment & Coursework
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 99,
              background: activeTab === 'coursework' ? C.primaryL : C.slate1,
              color: activeTab === 'coursework' ? C.primary : C.slate5,
            }}
          >
            {allGrades.length}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OFFICIAL TRANSCRIPT & CUMULATIVE RECORD                      */}
      {/* =================================================================== */}
      {activeTab === 'transcript' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Fee Arrears Advisory Notice Banner ──────────────────────── */}
          {isArrears && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 14,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    borderRadius: 10,
                    padding: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400e' }}>
                    Official Academic Transcript Withheld Due to Outstanding Arrears
                  </div>
                  <div style={{ fontSize: 12.5, color: '#78350f', marginTop: 3, lineHeight: 1.45 }}>
                    Official academic transcript is withheld due to outstanding semester fee arrears of{' '}
                    <strong>GH¢ {feeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.
                    Please settle your balance via Student Financials. You may still download your{' '}
                    <strong>Unofficial Student Advisory Transcript</strong> at any time.
                  </div>
                </div>
              </div>

              {onNav && (
                <button
                  onClick={() => onNav('financials')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    alignSelf: isMobile ? 'flex-start' : 'center',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Settle via Financials <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* ── Candidate Academic Dossier Card ───────────────────────────── */}
          <Card
            style={{
              padding: isMobile ? '18px 20px' : '22px 26px',
              background: '#ffffff',
              border: `1px solid ${C.slate2}`,
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 12,
                borderBottom: `1px solid ${C.slate2}`,
                paddingBottom: 14,
                marginBottom: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Candidate Bio & Institutional Dossier
                </span>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.slate9,
                    margin: '3px 0 0',
                  }}
                >
                  {candidateName.toUpperCase()}
                </h3>
              </div>

              {/* Standing Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 99,
                    background: standing.bg,
                    border: `1px solid ${standing.border}`,
                    color: standing.color,
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  <Award size={15} />
                  {standing.label}
                </div>

                {isArrears ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 99,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={14} /> Unofficial • Fee Arrears (GH¢ {feeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 99,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={14} /> Good Standing • Certified
                  </div>
                )}
              </div>
            </div>

            {/* Dossier Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr 1fr'
                  : 'repeat(4, 1fr)',
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: C.slate5, fontWeight: 600, textTransform: 'uppercase' }}>
                  Student Index / ID
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.slate9, marginTop: 2 }}>
                  {studentIndexNo}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: C.slate5, fontWeight: 600, textTransform: 'uppercase' }}>
                  MOH / Nursing PIN
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate8, marginTop: 2 }}>
                  {mohPin}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: C.slate5, fontWeight: 600, textTransform: 'uppercase' }}>
                  Program of Study
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate8, marginTop: 2 }}>
                  {programName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: C.slate5, fontWeight: 600, textTransform: 'uppercase' }}>
                  Class / Level
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate8, marginTop: 2 }}>
                  {academicLevel}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Executive Cumulative Metrics Quad ─────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 14,
            }}
          >
            {[
              {
                label: 'Cumulative GPA (CGPA)',
                val: cumGPA != null ? cumGPA.toFixed(2) : '—',
                scale: '/ 4.00',
                sub: standing.label,
                highlight: true,
                badgeBg: '#ecfdf5',
                badgeColor: '#064e3b',
              },
              {
                label: 'Current Term GPA',
                val: semGPA != null ? semGPA.toFixed(2) : '—',
                scale: '/ 4.00',
                sub: `${gpa?.current_semester_label ?? 'Current Term'}`,
                highlight: false,
                badgeBg: '#f0fdf4',
                badgeColor: '#16a34a',
              },
              {
                label: 'Credits Earned',
                val: `${totalCreditsEarned}`,
                scale: `/${totalCreditsAttempted || totalCreditsEarned} att.`,
                sub: `${totalCreditsEarned} total passed credits`,
                highlight: false,
                badgeBg: '#eff6ff',
                badgeColor: '#1d4ed8',
              },
              {
                label: 'Total Quality Points (QP)',
                val: totalQualityPoints > 0 ? totalQualityPoints.toFixed(2) : '—',
                scale: 'QP',
                sub: 'Sum of (CR × Grade Points)',
                highlight: false,
                badgeBg: '#fefce8',
                badgeColor: '#a16207',
              },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  background: m.highlight
                    ? 'linear-gradient(135deg, #064e3b 0%, #0d3125 100%)'
                    : '#ffffff',
                  border: m.highlight
                    ? '1px solid #047857'
                    : `1px solid ${C.slate2}`,
                  borderRadius: 16,
                  padding: '18px 20px',
                  color: m.highlight ? '#ffffff' : C.slate9,
                  boxShadow: m.highlight
                    ? '0 6px 16px rgba(6, 78, 59, 0.2)'
                    : '0 2px 6px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: m.highlight ? 'rgba(255, 255, 255, 0.7)' : C.slate5,
                      marginBottom: 8,
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span
                      style={{
                        fontSize: isMobile ? 28 : 34,
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        color: m.highlight ? '#ffffff' : C.slate9,
                      }}
                    >
                      {m.val}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: m.highlight ? '#fef08a' : C.slate5,
                      }}
                    >
                      {m.scale}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    marginTop: 10,
                    color: m.highlight ? 'rgba(255, 255, 255, 0.85)' : C.slate6,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── 3. Term-by-Term Course Ledger ─────────────────────────────── */}
          {(transcript ?? []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: C.slate9,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Term-by-Term Course Ledger
                  </h3>
                  <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 2 }}>
                    Comprehensive semester-by-semester breakdown of coursework credits and final grades.
                  </div>
                </div>

                <button
                  onClick={() => setShowGradingScale(!showGradingScale)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f8fafc',
                    border: `1px solid ${C.slate2}`,
                    borderRadius: 9,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.slate7,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <HelpCircle size={14} color={C.primary} />
                  <span>{showGradingScale ? 'Hide' : 'View'} UCC Grading Key</span>
                  {showGradingScale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* UCC Grading Scale Drawer */}
              {showGradingScale && (
                <div
                  style={{
                    background: '#fdfefe',
                    border: '1px solid #ca8a04',
                    borderRadius: 14,
                    padding: '16px 20px',
                    boxShadow: '0 4px 12px rgba(202, 138, 4, 0.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#854d0e',
                      textTransform: 'uppercase',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <BookOpen size={14} /> Official UCC / NMTC 4.0 Grading System Key
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? 'repeat(2, 1fr)'
                        : 'repeat(4, 1fr)',
                      gap: 8,
                    }}
                  >
                    {[
                      { g: 'A', score: '80 - 100%', pt: '4.00', desc: 'Excellent' },
                      { g: 'B+', score: '75 - 79%', pt: '3.50', desc: 'Very Good' },
                      { g: 'B', score: '70 - 74%', pt: '3.00', desc: 'Good' },
                      { g: 'C+', score: '65 - 69%', pt: '2.50', desc: 'Fairly Good' },
                      { g: 'C', score: '60 - 64%', pt: '2.00', desc: 'Pass' },
                      { g: 'D+', score: '55 - 59%', pt: '1.50', desc: 'Pass' },
                      { g: 'D', score: '50 - 54%', pt: '1.00', desc: 'Pass' },
                      { g: 'F', score: '< 50%', pt: '0.00', desc: 'Fail' },
                    ].map((k) => (
                      <div
                        key={k.g}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${C.slate2}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: gradeColor(k.g),
                            }}
                          >
                            {k.g}
                          </span>
                          <span style={{ fontSize: 11, color: C.slate5 }}>
                            {k.score}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.slate8 }}>
                            {k.pt}
                          </span>
                          <div style={{ fontSize: 9.5, color: C.slate4 }}>
                            {k.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Semester Cards */}
              {transcript!.map((sem: any) => {
                const termQp = (sem.courses ?? []).reduce(
                  (acc: number, c: any) => acc + (parseFloat(c.quality_points) || 0),
                  0
                );
                return (
                  <Card
                    key={sem.semester}
                    style={{
                      overflow: 'hidden',
                      border: `1px solid ${C.slate2}`,
                      borderRadius: 16,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {/* Semester Header Bar */}
                    <div
                      style={{
                        padding: '14px 22px',
                        background: '#064e3b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {sem.label || sem.semester}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9.5, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Term GPA
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#fef08a' }}>
                            {sem.semester_gpa != null ? Number(sem.semester_gpa).toFixed(2) : '—'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9.5, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Cumulative GPA
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                            {sem.cumulative_gpa != null ? Number(sem.cumulative_gpa).toFixed(2) : '—'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9.5, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Credits Earned
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                            {sem.credits_earned ?? 0} CR
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9.5, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Term QP
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fef08a' }}>
                            {termQp.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Semester Course Table */}
                    <ScrollableTable minWidth={680}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 22px',
                          background: '#f8fafc',
                          borderBottom: `1px solid ${C.slate2}`,
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: C.slate6,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                        }}
                      >
                        <span style={{ width: 100 }}>Course Code</span>
                        <span style={{ flex: 1 }}>Course Title</span>
                        <span style={{ width: 75, textAlign: 'center' }}>Att. Cr</span>
                        <span style={{ width: 75, textAlign: 'center' }}>Earn. Cr</span>
                        <span style={{ width: 85, textAlign: 'center' }}>Score (%)</span>
                        <span style={{ width: 70, textAlign: 'center' }}>Grade</span>
                        <span style={{ width: 80, textAlign: 'right' }}>Grade Pts</span>
                        <span style={{ width: 95, textAlign: 'right' }}>Quality Pts</span>
                      </div>

                      {sem.courses?.map((row: any, idx: number) => {
                        const scoreVal =
                          row.score_percentage != null
                            ? parseFloat(row.score_percentage)
                            : null;
                        const gpVal =
                          row.grade_points != null
                            ? parseFloat(row.grade_points)
                            : null;
                        const qpVal =
                          row.quality_points != null
                            ? parseFloat(row.quality_points)
                            : null;

                        return (
                          <div
                            key={row.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 22px',
                              borderBottom: `1px solid ${C.slate1}`,
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                            }}
                          >
                            <span
                              style={{
                                width: 100,
                                fontSize: 12,
                                fontWeight: 800,
                                color: '#064e3b',
                              }}
                            >
                              {row.course_code}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.slate8,
                              }}
                            >
                              {row.course_title}
                            </span>
                            <span
                              style={{
                                width: 75,
                                fontSize: 12,
                                color: C.slate6,
                                textAlign: 'center',
                              }}
                            >
                              {row.credits_attempted ?? row.credits}
                            </span>
                            <span
                              style={{
                                width: 75,
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.slate8,
                                textAlign: 'center',
                              }}
                            >
                              {row.credits_earned ?? row.credits}
                            </span>
                            <span
                              style={{
                                width: 85,
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: scoreVal ? C.slate9 : C.slate4,
                                textAlign: 'center',
                              }}
                            >
                              {scoreVal != null ? `${scoreVal.toFixed(1)}%` : '—'}
                            </span>
                            <span
                              style={{
                                width: 70,
                                textAlign: 'center',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background:
                                    row.final_grade === 'A'
                                      ? '#ecfdf5'
                                      : row.final_grade?.startsWith('B')
                                      ? '#f0fdf4'
                                      : row.final_grade?.startsWith('C')
                                      ? '#fefce8'
                                      : '#fef2f2',
                                  color: gradeColor(row.final_grade),
                                }}
                              >
                                {row.final_grade || '—'}
                              </span>
                            </span>
                            <span
                              style={{
                                width: 80,
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: C.slate7,
                                textAlign: 'right',
                              }}
                            >
                              {gpVal != null ? gpVal.toFixed(2) : '—'}
                            </span>
                            <span
                              style={{
                                width: 95,
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#064e3b',
                                textAlign: 'right',
                              }}
                            >
                              {qpVal != null ? qpVal.toFixed(2) : '—'}
                            </span>
                          </div>
                        );
                      })}

                      {/* Term Totals Summary Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 22px',
                          background: '#f1f5f9',
                          borderTop: `1px solid ${C.slate3}`,
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.slate8,
                        }}
                      >
                        <span style={{ flex: 1 }}>
                          <strong>TERM TOTALS:</strong> Attempted: {sem.credits_attempted ?? sem.credits_earned} CR &nbsp;|&nbsp; Earned: {sem.credits_earned} CR &nbsp;|&nbsp; Term Quality Points: {termQp.toFixed(2)}
                        </span>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span>
                            Term GPA: <strong style={{ color: '#064e3b' }}>{sem.semester_gpa != null ? Number(sem.semester_gpa).toFixed(2) : '—'}</strong>
                          </span>
                        </div>
                      </div>
                    </ScrollableTable>
                  </Card>
                );
              })}

              {/* ── 4. Cumulative Academic Summary Box ─────────────────────── */}
              <div
                style={{
                  background: '#f8fafc',
                  border: `1.5px solid ${C.slate3}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: C.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Official Academic Certification Summary
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: C.slate9,
                      marginTop: 2,
                    }}
                  >
                    Degree Classification: <span style={{ color: '#ca8a04' }}>{standing.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 4 }}>
                    Total Credits Earned: <strong>{totalCreditsEarned}</strong> · Quality Points: <strong>{totalQualityPoints.toFixed(2)}</strong> · Official CGPA: <strong>{cumGPA != null ? cumGPA.toFixed(2) : '—'} / 4.00</strong>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isArrears ? '#d97706' : '#064e3b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: downloading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <FileDown size={15} />
                    {downloading
                      ? 'Downloading…'
                      : isArrears
                      ? 'Save Unofficial PDF'
                      : 'Save PDF Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Card style={{ padding: 36 }}>
              <Empty
                icon={GraduationCap}
                title="No transcript records currently on file"
                sub="Your official course history will display once semester examinations are finalized and published by Academic Affairs."
              />
            </Card>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: COURSEWORK & ASSIGNMENT GRADES                               */}
      {/* =================================================================== */}
      {activeTab === 'coursework' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* In-Progress Coursework Grade Breakdown */}
          {courseSummaries.length > 0 && (
            <Card style={{ padding: '22px 26px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: C.slate9,
                      margin: 0,
                    }}
                  >
                    In-Progress Coursework Grades & Standing
                  </h3>
                  <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 2 }}>
                    Real-time weighted averages calculated from graded assignments, quizzes, and clinical practicals.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                }}
              >
                {courseSummaries.map((cs: any) => (
                  <div
                    key={cs.course_id}
                    style={{
                      background: '#f8fafc',
                      border: `1px solid ${C.slate2}`,
                      borderRadius: 14,
                      padding: '16px 18px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: C.primary,
                            background: C.primaryL,
                            padding: '2px 7px',
                            borderRadius: 5,
                          }}
                        >
                          {cs.course_code}
                        </span>
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: C.slate9,
                            margin: '4px 0 0',
                          }}
                        >
                          {cs.course_title}
                        </h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: 8,
                            background: cs.predicted_grade ? '#e0e7ff' : C.slate1,
                            color: cs.predicted_grade ? C.primary : C.slate6,
                          }}
                        >
                          {cs.predicted_grade || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: C.slate5, marginBottom: 8 }}>
                      Weighted Score:{' '}
                      <strong>
                        {cs.current_percentage != null
                          ? `${cs.current_percentage}%`
                          : '—'}
                      </strong>{' '}
                      · {cs.total_weight_graded}% coursework graded
                    </div>

                    <ProgressBar
                      value={
                        cs.current_percentage != null
                          ? Number(cs.current_percentage)
                          : 0
                      }
                      color={
                        Number(cs.current_percentage) >= 80
                          ? C.green
                          : Number(cs.current_percentage) >= 65
                          ? C.goldWarm
                          : '#dc2626'
                      }
                      h={6}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Filter size={14} color={C.slate5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.slate7 }}>
                Filter by Course:
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.slate2}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.slate7,
                  background: '#fff',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Enrolled Courses ({allGrades.length} items)</option>
                {uniqueCourses.map((c) => (
                  <option key={c as string} value={c as string}>
                    {c as string}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, color: C.slate5 }}>
              Showing <strong>{filteredGrades.length}</strong> published assessment(s)
            </div>
          </div>

          {/* Grades Table */}
          <Card style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${C.slate1}`,
                fontSize: 14,
                fontWeight: 700,
                color: C.slate9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>Published Assessment Scores</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.slate5 }}>
                Scores verified & published by course instructors
              </span>
            </div>

            {filteredGrades.length === 0 ? (
              <Empty
                icon={BarChart2}
                title="No published grades found"
                sub="Grades appear here once your instructor submits and the academic officer publishes them."
              />
            ) : (
              <ScrollableTable minWidth={620}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.slate0 }}>
                      {[
                        'Course',
                        'Assessment Title',
                        'Score',
                        'Grade',
                        'Weight',
                        'Category',
                        'Published Date',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 20px',
                            textAlign: 'left',
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.slate5,
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((g: any) => (
                      <tr key={g.id} style={{ borderTop: `1px solid ${C.slate1}` }}>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              padding: '4px 9px',
                              borderRadius: 99,
                              background: C.primaryL,
                              color: C.primary,
                            }}
                          >
                            {g.assignment.course_code}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '14px 20px',
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: C.slate8,
                          }}
                        >
                          {g.assignment.title}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: C.slate9 }}>
                            {g.score}
                          </span>
                          <span style={{ fontSize: 12, color: C.slate4 }}>
                            {' '}
                            /{g.assignment.max_score}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: gradeColor(g.letter_grade),
                            }}
                          >
                            {g.letter_grade}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '14px 20px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.slate6,
                          }}
                        >
                          {g.assignment.weight}%
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <Badge label={g.assignment.assignment_type} />
                        </td>
                        <td
                          style={{
                            padding: '14px 20px',
                            fontSize: 12.5,
                            color: C.slate5,
                          }}
                        >
                          {g.graded_at
                            ? new Date(g.graded_at).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
