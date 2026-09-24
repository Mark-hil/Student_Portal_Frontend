import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Layers, AlertCircle, ArrowUpRight, CreditCard, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { gradeColor } from '../../utils/theme';
import { coursesApi, gradesApi, financialsApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SectionHead } from '../../components/ui/SectionHead';
import { Empty } from '../../components/ui/Empty';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function StudentDashboard({ user, onNav }: { user: UserType; onNav: (v: string) => void }) {
  const { data: gpa } = useQuery({
    queryKey: ['gpa-summary'],
    queryFn: () => gradesApi.gpaSummary().then(r => r.data),
    staleTime: 600_000,
  });
  const { data: courses } = useQuery({
    queryKey: ['courses', 'mine'],
    queryFn: () => coursesApi.myCourses().then(r => r.data),
    staleTime: 60_000,
  });
  const { data: statement } = useQuery({
    queryKey: ['financial-statement'],
    queryFn: () => financialsApi.getMyStatement().then(r => r.data),
    staleTime: 30_000,
  });

  const my = courses ?? [];
  const semGPA = gpa?.semester_gpa ? parseFloat(gpa.semester_gpa) : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;
  const feeBalance = statement ? Number(statement.balance) : 0;
  const hasHold = Boolean(statement?.has_active_hold);

  return (
    <div className="dashboard-container">
      {/* ── Rich Hero Section ─────────────────────────────── */}
      <div className="dashboard-hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="hero-content">
          <div>
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
              <span className="hero-badge">
                {statement?.semester || gpa?.current_semester_label || 'Current Semester'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>•</span>
              <span className="flex items-center gap-1" style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                <Award size={15} color="#f59e0b" /> Academic Standing: Good Standing
              </span>
            </div>
            <h1 className="hero-title">
              Welcome back, {user.first_name}! 
            </h1>
            <p className="hero-subtitle">
              You have <strong style={{ color: '#fff' }}>{my.length} active courses</strong> enrolled with{' '}
              <strong style={{ color: '#fff' }}>{gpa?.credits_this_semester ?? 0} registered credits</strong> this semester.
            </p>
          </div>

          <div className="hero-actions">
            {/* <button onClick={() => onNav('financials')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontWeight: 800 }}>
              <CreditCard size={16} /> Pay Fees (GH₵ {feeBalance.toFixed(2)})
            </button> */}
            <button onClick={() => onNav('register')} className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)' }}>
              Course Registration <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Financial Hold Warning (if active) ──────────────── */}
      {hasHold && (
        <div
          onClick={() => onNav('financials')}
          style={{
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} color="#ef4444" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                Course Registration Hold Active (Arrears &gt; GH₵ 500.00)
              </div>
              <div style={{ fontSize: 12, color: '#ef4444' }}>
                You owe GH₵ {feeBalance.toFixed(2)} in semester fees. Settle via Mobile Money or Bank deposit to unlock registration.
              </div>
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 11 }}>
            Pay Now →
          </button>
        </div>
      )}

      {/* ── Semester GPA + Cumulative GPA Cards ───────────── */}
      <div className="gpa-banner-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {[
          {
            label: 'Semester GPA',
            val: semGPA,
            sub: `${gpa?.current_semester_label ?? 'Spring 2025'} · ${gpa?.credits_this_semester ?? 0} Credits in progress`,
            badge: semGPA && semGPA >= 3.5 ? "Dean's List" : 'Current Term',
            cardClass: 'gpa-card--primary',
          },
          {
            label: 'Cumulative GPA',
            val: cumGPA,
            sub: `All Semesters · ${gpa?.credits_completed ?? 0} Total Credits Earned`,
            badge: `${(gpa?.semester_history ?? []).length} Terms Completed`,
            cardClass: 'gpa-card--violet',
          },
        ].map((g, i) => (
          <div key={i} className={`gpa-card ${g.cardClass}`}>
            <div className="gpa-card-label">{g.label}</div>
            <div className="gpa-card-value">
              {g.val != null ? g.val.toFixed(2) : '—'}
            </div>
            <div className="gpa-card-sub">{g.sub}</div>
            <div className="gpa-card-badge">{g.badge}</div>
          </div>
        ))}
      </div>

      {/* ── Key Academic Metrics ───────────────────────────── */}
      <div className="metrics-grid">
        {[
          { l: 'Total Credits Done', v: gpa?.credits_completed ?? 0, s: '120 to graduate', icon: Award, a: 'var(--emerald-500)', bg: 'var(--emerald-50)' },
          { l: 'This Term Credits', v: gpa?.credits_this_semester ?? 0, s: `${my.length} active courses`, icon: BookOpen, a: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { l: 'Active Enrollments', v: my.length, s: 'Officially registered', icon: Layers, a: 'var(--violet-500)', bg: 'var(--violet-50)' },
          { l: 'Upcoming Deadlines', v: 2, s: 'Assignments due soon', icon: AlertCircle, a: 'var(--amber-500)', bg: 'var(--amber-50)' },
        ].map(({ l, v, s, icon: Icon, a, bg }) => (
          <div key={l} className="metric-card">
            <div className="metric-icon-box" style={{ background: bg, border: `1px solid ${a}25` }}>
              <Icon size={20} color={a} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="metric-label">{l}</div>
              <div className="metric-value">{v}</div>
              <div className="metric-sub">{s}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Enrolled Courses Overview ──────────────────────── */}
      <div>
        <SectionHead
          title="Current Enrolled Courses"
          sub="Your active subjects, instructor contacts, and completion progress"
          action={
            <button onClick={() => onNav('courses')} className="btn btn-secondary btn-sm">
              View Full Schedule →
            </button>
          }
        />
        {my.length === 0 ? (
          <Empty icon={BookOpen} title="No courses registered yet" sub="Go to Course Registration to enroll in classes for Spring 2025." />
        ) : (
          <div className="flex flex-col gap-3">
            {my.map((c: any, i: number) => {
              const col = COLORS[i % COLORS.length];
              const pct = parseFloat(c.progress_pct ?? '0');
              const schedule = c.schedule_days && c.schedule_time ? `${c.schedule_days} · ${c.schedule_time}` : null;
              const location = c.room_location ?? 'Campus TBA';

              return (
                <Card key={c.id} hoverable onClick={() => onNav('courses')} style={{ padding: '18px 24px' }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1" style={{ minWidth: 260 }}>
                      <div style={{ width: 4, height: 48, borderRadius: 'var(--radius-full)', background: col, flexShrink: 0 }} />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                          <span className="course-code-badge" style={{ color: col, background: col + '18', borderColor: col + '30' }}>
                            {c.code}
                          </span>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                            {c.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                            • {c.credits} Credits
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: '0.78125rem', color: 'var(--slate-500)', marginBottom: 6 }}>
                          <span>👤 {c.instructors?.[0]?.full_name ?? 'Faculty Instructor'}</span>
                          {schedule && <span>🕒 {schedule} ({location})</span>}
                        </div>

                        <ProgressBar value={pct} color={col} h={6} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: c.final_grade ? gradeColor(c.final_grade) : 'var(--slate-400)' }}>
                        {c.final_grade || 'In Progress'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: 2 }}>{pct.toFixed(0)}% Completed</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
