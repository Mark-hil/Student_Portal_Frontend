import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Calendar, Clock, MapPin, User, ChevronRight,
  Search, Filter, Plus, UserMinus, FileText, CheckCircle2,
  AlertTriangle, Loader2, Video, X, ExternalLink, Sparkles,
  Layers, ArrowRight, LayoutGrid, CalendarRange, ShieldAlert,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C, gradeColor } from '../../utils/theme';
import { coursesApi, gradesApi } from '../../api/services';
import type { Course, Enrollment, RegistrationWindow } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';

const COLORS = [C.indigo, C.green, C.amber, '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface Props {
  onNav: (view: string) => void;
}

export function StudentCourses({ onNav }: Props) {
  const { isMobile, isTablet } = useBreakpoint();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timetable'>('grid');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dropTarget, setDropTarget] = useState<{ course: Course; enrollmentId?: string } | null>(null);
  const [dropReason, setDropReason] = useState('Schedule conflict');

  // Queries
  const { data: myCoursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', 'mine'],
    queryFn: () => coursesApi.myCourses().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['courses', 'enrollments'],
    queryFn: () => coursesApi.enrollments().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: gpa } = useQuery({
    queryKey: ['gpa-summary'],
    queryFn: () => gradesApi.gpaSummary().then(r => r.data),
    staleTime: 600_000,
  });

  const { data: regWindow } = useQuery({
    queryKey: ['registration-window'],
    queryFn: () => coursesApi.registrationWindow().then(r => r.data),
    staleTime: 60_000,
  });

  const isRegistrationOpen = regWindow?.is_open ?? true;

  const courses: Course[] = myCoursesData ?? [];
  const enrollments: Enrollment[] = enrollmentsData?.results ?? [];

  // Map courseId to enrollmentId
  const enrollmentMap = new Map<string, string>();
  enrollments.forEach(e => {
    if (e.course?.id) enrollmentMap.set(e.course.id, e.id);
  });

  // Drop mutation
  const dropMutation = useMutation({
    mutationFn: async ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) => {
      return coursesApi.drop(enrollmentId, reason);
    },
    onSuccess: () => {
      toast.success('Course dropped successfully.');
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['gpa-summary'] });
      setDropTarget(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to drop course.');
    },
  });

  const handleConfirmDrop = () => {
    if (!dropTarget) return;
    const enrollmentId = dropTarget.enrollmentId || enrollmentMap.get(dropTarget.course.id);
    if (!enrollmentId) {
      toast.error('Enrollment ID not found. Please try refreshing.');
      return;
    }
    dropMutation.mutate({ enrollmentId, reason: dropReason });
  };

  // Filter courses
  const categories = Array.from(new Set(courses.map(c => c.category?.name).filter(Boolean)));
  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructors?.[0]?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category?.name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalCredits = courses.reduce((acc, c) => acc + (c.credits || 0), 0);

  // Group schedules by day for Timetable View
  const timetableSlots: Array<{ day: string; schedule: any; course: Course; color: string }> = [];
  courses.forEach((course, idx) => {
    const color = COLORS[idx % COLORS.length];
    (course.schedules || []).forEach(sched => {
      timetableSlots.push({
        day: sched.day_name,
        schedule: sched,
        course,
        color,
      });
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* ── Header & Academic Summary ─────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`,
          borderRadius: 20,
          padding: isMobile ? '20px 18px' : '26px 30px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(99,102,241,.2)', filter: 'blur(20px)' }} />

        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 18, position: 'relative', zIndex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
              {gpa?.current_semester_label ?? 'Spring 2025 Semester'} · Enrolled Courses
            </div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: '-.02em', color: '#fff' }}>
              My Enrolled Courses
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span><strong>{courses.length}</strong> Registered Classes</span>
              <span>•</span>
              <span><strong>{totalCredits}</strong> Total Credits</span>
              <span>•</span>
              <span style={{ color: totalCredits >= 12 ? '#86efac' : '#fde047', fontWeight: 700 }}>
                {totalCredits >= 12 ? 'Full-time (12+ cr)' : 'Part-time (<12 cr)'}
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={() => onNav('register')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: C.indigo,
                color: '#fff',
                border: 'none',
                padding: '11px 18px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Plus size={16} /> Add Courses
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search, Category Filters, and View Switcher ──── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: isMobile ? '100%' : 260, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code, title, instructor…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 12,
                border: `1px solid ${C.slate2}`,
                background: '#fff',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: `1px solid ${C.slate2}`,
                background: '#fff',
                fontSize: 13.5,
                color: C.slate7,
                outline: 'none',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: C.slate1, borderRadius: 12, padding: 3, border: `1px solid ${C.slate2}`, width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '8px 14px',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'grid' ? '#fff' : 'transparent',
              color: viewMode === 'grid' ? C.indigo : C.slate5,
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <LayoutGrid size={15} /> Cards View
          </button>
          <button
            onClick={() => setViewMode('timetable')}
            style={{
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '8px 14px',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'timetable' ? '#fff' : 'transparent',
              color: viewMode === 'timetable' ? C.indigo : C.slate5,
              boxShadow: viewMode === 'timetable' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <CalendarRange size={15} /> Weekly Timetable
          </button>
        </div>
      </div>

      {/* ── Content View ─────────────────────────────────────────── */}
      {isLoadingCourses ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.slate4 }}>
          <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          Loading your enrolled courses…
        </div>
      ) : courses.length === 0 ? (
        /* Empty State */
        <Card style={{ padding: '52px 24px', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.indigoL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <BookOpen size={32} color={C.indigo} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.slate9, margin: '0 0 8px' }}>
            No Courses Enrolled Yet
          </h2>
          <p style={{ fontSize: 14, color: C.slate5, maxWidth: 460, margin: '0 auto 22px', lineHeight: 1.5 }}>
            You have not registered for any courses in the <strong>{gpa?.current_semester_label ?? 'Spring 2025'}</strong> semester. Explore available course sections and build your schedule.
          </p>
          <button
            onClick={() => onNav('register')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.indigo,
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            <Plus size={17} /> Browse & Register Courses
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ── Cards Grid View ─────────────────────────────────────── */
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? 14 : 18 }}>
          {filteredCourses.map((course, idx) => {
            const col = COLORS[idx % COLORS.length];
            const instructor = course.instructors?.[0];
            const schedules = course.schedules || [];
            const enrollmentId = enrollmentMap.get(course.id);

            return (
              <Card
                key={course.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform .15s, box-shadow .15s',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4.5, background: col }} />

                <div>
                  {/* Top Bar: Code, Category, Credits */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: col,
                          background: `${col}15`,
                          padding: '3px 9px',
                          borderRadius: 6,
                          letterSpacing: '.02em',
                        }}
                      >
                        {course.code}
                      </span>
                      {course.category && (
                        <span style={{ fontSize: 12, color: C.slate5, fontWeight: 600 }}>
                          {course.category.name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.slate7, background: C.slate1, padding: '4px 9px', borderRadius: 99 }}>
                      {course.credits} Credits
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => setSelectedCourse(course)}
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: C.slate9,
                      margin: '0 0 8px',
                      cursor: 'pointer',
                      lineHeight: 1.35,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.indigo)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.slate9)}
                  >
                    {course.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: C.slate5,
                      margin: '0 0 16px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description || 'Comprehensive university course syllabus covering foundational theory and applied principles.'}
                  </p>

                  {/* Class Schedule & Room */}
                  <div style={{ background: C.slate0, borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {schedules.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: C.slate4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} /> Schedule TBA · Check portal announcements
                      </div>
                    ) : (
                      schedules.map((s, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.slate8, fontWeight: 600 }}>
                            <Clock size={14} color={col} /> {s.day_name}, {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.slate5 }}>
                            {s.is_online ? <Video size={13} color={C.indigo} /> : <MapPin size={13} color={C.slate4} />}
                            {s.room || (s.is_online ? 'Virtual Classroom' : 'Main Campus')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Instructor */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.slate1}`, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: `${col}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          color: col,
                        }}
                      >
                        {instructor?.full_name ? instructor.full_name[0] : 'T'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8 }}>
                          {instructor?.full_name || 'Faculty Instructor'}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.slate4 }}>
                          {instructor?.email || 'instructor@uniportal.edu'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${C.slate1}` }}>
                  <button
                    onClick={() => setSelectedCourse(course)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: C.slate1,
                      color: C.slate7,
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.slate2)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.slate1)}
                  >
                    <FileText size={15} /> Syllabus & Detail
                  </button>

                  <button
                    onClick={() => setDropTarget({ course, enrollmentId })}
                    title={!isRegistrationOpen ? 'Registration window is closed.' : 'Drop this course'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      padding: '10px 14px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ffe4e6';
                      e.currentTarget.style.borderColor = '#fda4af';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fff1f2';
                      e.currentTarget.style.borderColor = '#fecdd3';
                    }}
                  >
                    <UserMinus size={15} /> Drop
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Weekly Timetable Schedule View ──────────────────────── */
        <Card style={{ padding: 22, overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
              {DAYS.map(day => (
                <div
                  key={day}
                  style={{
                    background: C.slate0,
                    padding: '10px 12px',
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.slate7,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, minHeight: 280 }}>
              {DAYS.map(day => {
                const daySlots = timetableSlots.filter(s => s.day === day);
                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(248, 250, 252, 0.5)', padding: 8, borderRadius: 10 }}>
                    {daySlots.length === 0 ? (
                      <div style={{ fontSize: 11, color: C.slate3, textAlign: 'center', padding: '24px 0' }}>
                        No classes
                      </div>
                    ) : (
                      daySlots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => setSelectedCourse(slot.course)}
                          style={{
                            background: '#fff',
                            borderLeft: `4px solid ${slot.color}`,
                            padding: '10px 12px',
                            borderRadius: 8,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            transition: 'transform .1s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: slot.color }}>
                            {slot.course.code}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.slate9, margin: '2px 0 4px', lineHeight: 1.3 }}>
                            {slot.course.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: C.slate5, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {slot.schedule.start_time?.slice(0, 5)} – {slot.schedule.end_time?.slice(0, 5)}
                          </div>
                          <div style={{ fontSize: 10, color: C.slate4, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> {slot.schedule.room || 'Turing Hall'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── COURSE DETAILS & SYLLABUS MODAL ───────────────────────── */}
      {selectedCourse && (
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
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 580,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.indigo, background: C.indigoL, padding: '2px 8px', borderRadius: 6 }}>
                    {selectedCourse.code}
                  </span>
                  <span style={{ fontSize: 12, color: C.slate5, fontWeight: 500 }}>
                    {selectedCourse.credits} Credits · {selectedCourse.semester || 'Spring 2025'}
                  </span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>
                  {selectedCourse.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.slate6, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                  Course Overview & Description
                </h4>
                <p style={{ fontSize: 13, color: C.slate7, lineHeight: 1.6, margin: 0 }}>
                  {selectedCourse.description || 'This course explores modern principles, advanced analytical methods, practical labs, and comprehensive problem sets essential for mastery of the discipline.'}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.slate6, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                  Weekly Class Sessions & Location
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedCourse.schedules || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: C.slate4 }}>Schedule details announced by faculty at first lecture.</div>
                  ) : (
                    selectedCourse.schedules.map((s, idx) => (
                      <div key={idx} style={{ background: C.slate0, padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: C.slate8 }}>{s.day_name}, {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</span>
                        <span style={{ color: C.slate5 }}>{s.room || 'Turing Hall, Room 301'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.slate6, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                  Faculty Instructors
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedCourse.instructors || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: C.slate4 }}>Instructor assigned by department.</div>
                  ) : (
                    (selectedCourse.instructors || []).map((ins, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.slate0, padding: '10px 14px', borderRadius: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.indigo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {ins.full_name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.slate9 }}>{ins.full_name}</div>
                          <div style={{ fontSize: 11, color: C.slate4 }}>{ins.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: `1px solid ${C.slate2}` }}>
                <button
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    padding: '9px 18px',
                    background: C.slate1,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.slate7,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DROP COURSE CONFIRMATION MODAL ───────────────────────── */}
      {dropTarget && (
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
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserMinus size={18} color={C.amber} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate9, margin: 0 }}>
                  Course Drop & Unenrollment
                </h3>
                <div style={{ fontSize: 12, color: C.slate5, marginTop: 2 }}>
                  {dropTarget.course.code} — {dropTarget.course.title}
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ background: C.slate0, borderLeft: `3px solid ${C.amber}`, padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12.5, color: C.slate7, lineHeight: 1.5 }}>
                <strong>Academic Notice:</strong> You are requesting to drop <strong>{dropTarget.course.code}</strong> ({dropTarget.course.credits} Credits). This unenrolls you from active lectures and releases your seat in this section. The course remains unaffected in the university catalog.
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.slate6, marginBottom: 6 }}>
                  Reason for Dropping (Optional)
                </label>
                <select
                  value={dropReason}
                  onChange={e => setDropReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: `1px solid ${C.slate3}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: '#fff',
                    color: C.slate8,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Workload adjustment">Workload adjustment</option>
                  <option value="Changed degree requirements">Changed degree requirements</option>
                  <option value="Switched section">Switched section</option>
                  <option value="Other academic reasons">Other academic reasons</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDropTarget(null)}
                  disabled={dropMutation.isPending}
                  style={{
                    padding: '9px 16px',
                    background: C.slate1,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.slate7,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDrop}
                  disabled={dropMutation.isPending}
                  style={{
                    padding: '9px 18px',
                    background: C.amber,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: dropMutation.isPending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {dropMutation.isPending ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <UserMinus size={14} />
                  )} Confirm Unenrollment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
