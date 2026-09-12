import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Search, BookOpen, Loader2, Calendar, Clock, AlertCircle, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { coursesApi, financialsApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const COLORS = [C.indigo, C.green, C.amber, '#ec4899', '#8b5cf6', '#06b6d4'];

export function CourseRegistration() {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: statement } = useQuery({
    queryKey: ['financial-statement'],
    queryFn: () => financialsApi.getMyStatement().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: windowData, isLoading: isWindowLoading } = useQuery({
    queryKey: ['courses', 'registration-window'],
    queryFn: () => coursesApi.registrationWindow().then(r => r.data),
    staleTime: 60_000,
  });

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['courses', 'list'],
    queryFn: () => coursesApi.list().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['courses', 'enrollments'],
    queryFn: () => coursesApi.enrollments().then(r => r.data),
    staleTime: 30_000,
  });

  const hasFinancialHold = Boolean(statement?.has_active_hold);
  const isRegistrationOpen = windowData ? windowData.is_open : true;

  const activeEnrolledIds = new Set(
    (myEnrollments?.results ?? [])
      .filter((e: any) => e.status === 'active' || e.status === 'waitlisted')
      .map((e: any) => e.course?.id)
  );

  const bulkMut = useMutation({
    mutationFn: (ids: string[]) => coursesApi.bulkRegister(ids).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Successfully registered ${data.registered?.length || 0} course(s)!`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['courses', 'mine'] });
      qc.invalidateQueries({ queryKey: ['courses', 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['gpa-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to complete registration.');
    }
  });

  const [conflictWarning, setConflictWarning] = useState<{ course: any; conflictingWith: any[] } | null>(null);

  const singleMut = useMutation({
    mutationFn: (id: string) => coursesApi.register(id).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Successfully enrolled in ${data.course?.code || 'course'}!`);
      setConflictWarning(null);
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['courses', 'mine'] });
      qc.invalidateQueries({ queryKey: ['courses', 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['gpa-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.course_id || 'Failed to enroll.');
    }
  });

  const handleEnrollClick = async (c: any) => {
    try {
      const res = await coursesApi.checkConflict(c.id);
      if (res.data.has_conflict) {
        setConflictWarning({
          course: c,
          conflictingWith: (res.data as any).conflicts || [],
        });
        return;
      }
    } catch {
      // Proceed if conflict check endpoint has no conflicts
    }
    singleMut.mutate(c.id);
  };

  const catalog = catalogData?.results ?? [];
  const filtered = catalog.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );
  const selCredits = [...selected].reduce((s, id) => {
    const c = catalog.find((x: any) => x.id === id);
    return s + (c?.credits ?? 0);
  }, 0);

  // Format closing date & time
  const formatDeadline = (isoStr?: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* ── Financial Hold Warning Banner ── */}
      {hasFinancialHold && (
        <div
          style={{
            marginBottom: 20,
            padding: '16px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
            border: '1.5px solid #f87171',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 8,
              background: '#ef4444',
              borderRadius: 10,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#991b1b' }}>
              Registration Restriced: Financial Hold Active
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>
              {statement?.active_hold_reason || 'You have outstanding semester fee arrears exceeding GH₵ 500.00. University policy blocks course registration until fees are settled.'}
            </p>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#7f1d1d' }}>
              Current Outstanding Balance: GH₵ {Number(statement?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* ── Registration Window Banner ── */}
      {windowData && (
        <div
          style={{
            marginBottom: 20,
            padding: isMobile ? '12px 14px' : '14px 18px',
            borderRadius: 12,
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            background: isRegistrationOpen
              ? '#ecfdf5'
              : windowData.status_label === 'upcoming'
              ? '#fefce8'
              : '#fef2f2',
            border: `1px solid ${
              isRegistrationOpen
                ? '#a7f3d0'
                : windowData.status_label === 'upcoming'
                ? '#fde047'
                : '#fecaca'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: isRegistrationOpen
                  ? '#059669'
                  : windowData.status_label === 'upcoming'
                  ? '#ca8a04'
                  : '#dc2626',
                color: '#fff',
                padding: 8,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isRegistrationOpen ? (
                <Clock size={18} />
              ) : windowData.status_label === 'upcoming' ? (
                <Calendar size={18} />
              ) : (
                <Lock size={18} />
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isRegistrationOpen
                    ? '#065f46'
                    : windowData.status_label === 'upcoming'
                    ? '#854d0e'
                    : '#991b1b',
                }}
              >
                {isRegistrationOpen
                  ? 'Registration is Currently Open'
                  : windowData.status_label === 'upcoming'
                  ? 'Registration Opens Soon'
                  : 'Registration Window Closed'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 2,
                  color: isRegistrationOpen
                    ? '#047857'
                    : windowData.status_label === 'upcoming'
                    ? '#a16207'
                    : '#b91c1c',
                }}
              >
                {isRegistrationOpen ? (
                  <>
                    Deadline: <strong>{formatDeadline(windowData.closes_at)}</strong> · Semester: {windowData.semester || 'Spring 2025'}
                  </>
                ) : windowData.status_label === 'upcoming' ? (
                  <>Opens on: <strong>{formatDeadline(windowData.opens_at)}</strong></>
                ) : (
                  <>The registration deadline closed on <strong>{formatDeadline(windowData.closes_at)}</strong>. For exceptions or late add/drop, please contact the Academic Registrar.</>
                )}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 99,
              background: isRegistrationOpen ? '#059669' : '#dc2626',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              alignSelf: isMobile ? 'flex-end' : 'center',
            }}
          >
            {isRegistrationOpen ? 'Active' : 'Closed'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>Available Course Catalog</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>Select courses for your academic schedule (Maximum 18 credits per semester)</p>
        </div>
        {selected.size > 0 && isRegistrationOpen && (
          <button
            onClick={() => bulkMut.mutate([...selected])}
            disabled={bulkMut.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 22px',
              background: C.indigo,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {bulkMut.isPending ? <Spinner /> : <Check size={16} />}
            Register {selected.size} Course{selected.size > 1 ? 's' : ''} ({selCredits} Credits)
          </button>
        )}
      </div>

      {bulkMut.isSuccess && (
        <div style={{ background: C.greenL, border: `1px solid #6ee7b7`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Check size={18} color={C.green} />
          <span style={{ fontSize: 14, color: '#065f46', fontWeight: 700 }}>
            Registered {bulkMut.data?.summary.registered_count} course(s) · {bulkMut.data?.summary.total_credits} credits successfully!
          </span>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses by code, title, department…"
          style={{ width: '100%', padding: '11px 16px 11px 40px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Empty icon={BookOpen} title="No courses found" sub="Try a different search term or category filter." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(310px,1fr))', gap: 18 }}>
          {filtered.map((c: any, i: number) => {
            const col = COLORS[i % COLORS.length];
            const isEnrolled = activeEnrolledIds.has(c.id);
            const sel = selected.has(c.id);
            const pct = Math.round(((c.enrollment_count || 0) / (c.max_students || 30)) * 100);
            return (
              <Card key={c.id} style={{ overflow: 'hidden', border: `1.5px solid ${sel ? C.indigo : isEnrolled ? '#6ee7b7' : C.slate2}`, boxShadow: sel ? `0 0 0 3px ${C.indigoL}` : undefined }}>
                <div style={{ background: col, padding: '18px 20px 16px', color: '#fff', position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, marginBottom: 4, letterSpacing: '.03em' }}>{c.code} · {c.credits} Credits</div>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>{c.title}</div>
                  {isEnrolled && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.25)', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 800 }}>
                      ✓ Enrolled
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px 20px 18px' }}>
                  {c.schedules?.length > 0 && (
                    <div style={{ fontSize: 12.5, color: C.slate6, marginBottom: 10, fontWeight: 600 }}>
                      {c.schedules.map((s: any) => `${s.day_name} ${s.start_time?.slice(0, 5)}–${s.end_time?.slice(0, 5)}`).join(' · ')}
                    </div>
                  )}
                  {c.prerequisites?.length > 0 && (
                    <div style={{ fontSize: 12, color: C.slate5, marginBottom: 10 }}>
                      Prerequisites: <strong>{c.prerequisites.map((p: any) => p.code).join(', ')}</strong>
                    </div>
                  )}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.slate5, marginBottom: 6, fontWeight: 600 }}>
                      <span style={{ color: c.is_full ? '#dc2626' : C.slate7 }}>{c.is_full ? '⚠️ Section Full' : `${c.available_seats ?? (c.max_students - (c.enrollment_count || 0))} seats remaining`}</span>
                      <span>{c.enrollment_count ?? 0}/{c.max_students ?? 30} enrolled</span>
                    </div>
                    <ProgressBar value={pct} color={pct > 85 ? C.amber : C.green} h={6} />
                  </div>
                  {isEnrolled ? (
                    <div style={{ padding: '10px 14px', background: C.greenL, borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 800, color: C.green }}>
                      ✓ Enrolled in this Class
                    </div>
                  ) : !isRegistrationOpen ? (
                    <div style={{ padding: '10px 14px', background: C.slate1, borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.slate5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Lock size={14} /> Registration Closed
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setSelected(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                        style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${sel ? C.indigo : C.slate2}`, background: sel ? C.indigoL : '#fff', color: sel ? C.indigo : C.slate6, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {sel ? '✓ Selected' : '+ Select'}
                      </button>
                      <button
                        onClick={() => handleEnrollClick(c)}
                        disabled={c.is_full || singleMut.isPending}
                        style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: 'none', background: c.is_full ? C.slate1 : C.indigo, color: c.is_full ? C.slate4 : '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: c.is_full ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        {singleMut.isPending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : c.is_full ? 'Full' : 'Enroll Now'}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULE CONFLICT PRE-CHECK MODAL ────────────────────── */}
      {conflictWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.slate9, margin: 0 }}>
                  Schedule Conflict Detected
                </h3>
                <div style={{ fontSize: 12, color: C.slate5, marginTop: 2 }}>
                  {conflictWarning.course.code} — {conflictWarning.course.title}
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13.5, color: C.slate7, lineHeight: 1.6, margin: '0 0 16px' }}>
                Enrolling in <strong>{conflictWarning.course.code}</strong> will create a time overlap with your currently enrolled timetable sessions:
              </p>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                  Conflicting Sessions:
                </div>
                {conflictWarning.conflictingWith.length > 0 ? (
                  conflictWarning.conflictingWith.map((c: any, idx: number) => (
                    <div key={idx} style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                      • {c.course_code || c.title || 'Enrolled Course'} ({c.day_name || 'Overlap'} {c.time_slot || ''})
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: '#b45309' }}>
                    • Time slot overlaps with your existing course schedule.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConflictWarning(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.slate2}`,
                    background: '#fff',
                    color: C.slate7,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel & Adjust
                </button>
                <button
                  type="button"
                  onClick={() => singleMut.mutate(conflictWarning.course.id)}
                  disabled={singleMut.isPending}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#d97706',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: singleMut.isPending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {singleMut.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Override & Register Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
