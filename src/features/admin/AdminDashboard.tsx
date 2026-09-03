import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, ClipboardCheck, ShieldCheck, Activity, ArrowRight, UserPlus, PlusCircle, FileSpreadsheet } from 'lucide-react';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { GradeBatchList } from '../shared/GradeBatchList';
import { Spinner } from '../../components/ui/Spinner';

export function AdminDashboard({ user }: { user: UserType }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    staleTime: 30_000,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Admin Hero Header ─────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e293b 60%, #0f172a 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#f472b6',
                  background: 'rgba(236, 72, 153, 0.15)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  letterSpacing: '0.04em',
                }}
              >
                Academic Registrar Office
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>•</span>
              <span style={{ fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={13} /> System Operational
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
              Academic Management, {user.first_name}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>
              Oversee university student enrollments, instructor assignments, registration deadlines, and grade approvals.
            </p>
          </div>
        </div>
      </div>

      {/* ── Key System Metrics ─────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: 'Total Students', v: stats?.total_students ?? 0, s: 'Active campus accounts', a: '#4f46e5', bg: '#eef2ff', icon: Users },
            { l: 'Faculty Instructors', v: stats?.total_instructors ?? 0, s: 'Teaching staff', a: '#10b981', bg: '#ecfdf5', icon: Users },
            { l: 'Active Courses', v: stats?.total_courses ?? 0, s: 'Curriculum catalog', a: '#f59e0b', bg: '#fffbeb', icon: BookOpen },
            { l: 'Pending Batches', v: stats?.pending_batches ?? 0, s: 'Awaiting grade review', a: '#f43f5e', bg: '#fff1f2', icon: ClipboardCheck },
          ].map(({ l, v, s, a, bg, icon: Icon }) => (
            <Card key={l} style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  background: bg,
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${a}22`,
                }}
              >
                <Icon size={20} color={a} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.slate5, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.slate9, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 11, color: C.slate4, marginTop: 4 }}>{s}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Grade Batch Review Queue ───────────────────────── */}
      <div style={{ marginTop: 4 }}>
        <GradeBatchList role="officer" />
      </div>
    </div>
  );
}
