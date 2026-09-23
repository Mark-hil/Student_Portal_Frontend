import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, ChevronRight, Layers, FileText,
  Search, Filter, Plus, GraduationCap
} from 'lucide-react';
import { C } from '../../utils/theme';
import { coursesApi } from '../../api/services';
import type { Course, User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { SectionHead } from '../../components/ui/SectionHead';
import { CourseDetail } from './CourseDetail';
import { CourseList } from './CourseList';

interface Props {
  user: UserType;
  initialCourseId?: string | null;
}

export function LecturerCoursesView({ user, initialCourseId = null }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(initialCourseId);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['lecturer-courses'],
    queryFn: () => coursesApi.myCourses().then(r => r.data),
  });

  if (selectedCourse) {
    return (
      <CourseDetail
        courseId={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  const activeCount = courses?.length || 0;
  const totalEnrolled = (courses || []).reduce((acc, c) => acc + (c.enrollment_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Banner ────────────────────────────────────────── */}
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
            Teaching & Course Administration
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
            Manage Courses & Curriculum
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>
            Access class rosters, configure course assessments, grade student submissions, and upload lesson modules.
          </p>
        </div>
      </div>

      {/* ── Quick Stats ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#e0e7ff', borderRadius: 12, padding: 10, color: C.indigo }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.slate5 }}>Assigned Courses</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.slate9 }}>{activeCount}</div>
            <div style={{ fontSize: 11, color: C.slate4 }}>Active teaching sections</div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#ecfdf5', borderRadius: 12, padding: 10, color: C.green }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.slate5 }}>Total Enrolled Students</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.slate9 }}>{totalEnrolled}</div>
            <div style={{ fontSize: 11, color: C.slate4 }}>Across all course sections</div>
          </div>
        </Card>
      </div>

      {/* ── Course List & Timetable ────────────────────────── */}
      <div>
        <SectionHead
          title="Assigned Teaching Courses"
          sub="Select any course section to view its enrolled students, assessments, and learning modules."
        />
        <CourseList onSelect={setSelectedCourse} />
      </div>
    </div>
  );
}
