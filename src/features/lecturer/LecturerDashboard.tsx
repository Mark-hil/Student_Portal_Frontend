import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, XCircle, CheckCircle, BookOpen, Layers } from 'lucide-react';
import { C } from '../../utils/theme';
import { batchesApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { GradeBatchList } from '../shared/GradeBatchList';
import { CourseList } from './CourseList';
import { CourseDetail } from './CourseDetail';
import { SectionHead } from '../../components/ui/SectionHead';

export function LecturerDashboard({ user }: { user: UserType }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data: batches } = useQuery({
    queryKey: ['batches', 'lecturer'],
    queryFn: () => batchesApi.list({ role: 'lecturer' }).then(r => r.data),
    staleTime: 30_000,
  });
  const pending = (batches ?? []).filter((b: any) => b.status === 'pending_review').length;
  const rejected = (batches ?? []).filter((b: any) => b.status === 'rejected').length;
  const published = (batches ?? []).filter((b: any) => b.status === 'published').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Lecturer Hero ─────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #4338ca 100%)',
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
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: '#c4b5fd', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            Faculty & Teaching Portal
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
            Welcome back, Professor {user.last_name || user.first_name} 👋
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>
            Manage course syllabi, student coursework submissions, and submit official grade batches for registrar review.
          </p>
        </div>
      </div>

      {/* ── Batch Status Metric Cards ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { l: 'Pending Academic Review', v: pending, a: '#f59e0b', bg: '#fffbeb', s: 'Submitted to Registrar', icon: Clock },
          { l: 'Requires Revision', v: rejected, a: '#f43f5e', bg: '#fff1f2', s: 'Returned with feedback', icon: XCircle },
          { l: 'Published to Transcripts', v: published, a: '#10b981', bg: '#ecfdf5', s: 'Official & Verified', icon: CheckCircle },
        ].map(({ l, v, a, bg, s, icon: Icon }) => (
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

      {selectedCourse ? (
        <CourseDetail courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <CourseList onSelect={setSelectedCourse} />
          </div>
          <div>
            <SectionHead title="Grade Submissions & Batches" sub="Create and track status of semester grade submissions" />
            <GradeBatchList role="lecturer" />
          </div>
        </div>
      )}
    </div>
  );
}
