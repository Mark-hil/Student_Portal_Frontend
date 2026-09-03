import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Search, Calendar, Clock, Download,
  Users, UserX, UserCheck, RefreshCw, AlertCircle, CheckCircle2,
  Sliders, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { coursesApi, adminApi } from '../../api/services';
import type { RegistrationStats } from '../../types';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';

export function CourseManagement() {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWindowModalOpen, setIsWindowModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [isExportingReg, setIsExportingReg] = useState(false);
  const [isExportingUnreg, setIsExportingUnreg] = useState(false);

  // Registration Window state for modal
  const [windowForm, setWindowForm] = useState({
    semester: 'Spring 2025',
    opens_at: '',
    closes_at: '',
    is_active: true,
  });

  const [newCourse, setNewCourse] = useState({
    code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: 'Spring 2025', status: 'active',
    instructor_ids: [] as string[],
    schedule_day: 'mon', schedule_start: '09:00', schedule_end: '10:30', schedule_room: 'Turing Hall 204'
  });

  // Course list query
  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'list', { search }],
    queryFn: () => coursesApi.list({ search }).then(r => r.data),
    staleTime: 30_000
  });

  // Instructors query
  const { data: instData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => adminApi.listUsers({ role: 'instructor' }).then(r => r.data)
  });

  // Registration Window query
  const { data: regWindow, isLoading: isWindowLoading } = useQuery({
    queryKey: ['courses', 'registration-window'],
    queryFn: () => coursesApi.registrationWindow().then(r => r.data),
    staleTime: 30_000,
  });

  // Registration Stats query
  const { data: regStats, isLoading: isStatsLoading } = useQuery<RegistrationStats>({
    queryKey: ['courses', 'registration-stats'],
    queryFn: () => coursesApi.registrationStats().then(r => r.data),
    staleTime: 30_000,
  });

  // Mutation: Manage Window
  const windowMutation = useMutation({
    mutationFn: (payload: any) => coursesApi.manageRegistrationWindow(payload),
    onSuccess: (data) => {
      toast.success('Registration window updated successfully!');
      qc.invalidateQueries({ queryKey: ['courses', 'registration-window'] });
      qc.invalidateQueries({ queryKey: ['courses', 'registration-stats'] });
      setIsWindowModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update registration window.');
    }
  });

  const preparePayload = () => {
    const payload: any = {
      code: newCourse.code,
      title: newCourse.title,
      slug: newCourse.slug || newCourse.code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newCourse.description,
      credits: newCourse.credits,
      max_students: newCourse.max_students,
      semester: newCourse.semester,
      status: newCourse.status,
      instructor_ids: newCourse.instructor_ids.filter(Boolean),
    };
    if (newCourse.schedule_day) {
      payload.schedules_data = [{
        day_of_week: newCourse.schedule_day,
        start_time: newCourse.schedule_start,
        end_time: newCourse.schedule_end,
        room: newCourse.schedule_room,
        is_online: false
      }];
    }
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: () => coursesApi.create(preparePayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
      setNewCourse({
        code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: 'Spring 2025', status: 'active',
        instructor_ids: [], schedule_day: 'mon', schedule_start: '09:00', schedule_end: '10:30', schedule_room: 'Turing Hall 204'
      });
      toast.success('Course created successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => coursesApi.update(editingCourse.id, preparePayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
      setEditingCourse(null);
      setNewCourse({
        code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: 'Spring 2025', status: 'active',
        instructor_ids: [], schedule_day: 'mon', schedule_start: '09:00', schedule_end: '10:30', schedule_room: 'Turing Hall 204'
      });
      toast.success('Course updated successfully!');
    }
  });

  const openCreateModal = () => {
    setEditingCourse(null);
    setNewCourse({
      code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: 'Spring 2025', status: 'active',
      instructor_ids: [], schedule_day: 'mon', schedule_start: '09:00', schedule_end: '10:30', schedule_room: 'Turing Hall 204'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    const existingSched = course.schedules?.[0];
    setNewCourse({
      code: course.code, title: course.title, slug: course.slug, description: course.description,
      credits: course.credits, max_students: course.max_students, semester: course.semester || 'Spring 2025',
      status: course.status,
      instructor_ids: course.instructors?.[0] ? [course.instructors[0].id] : [],
      schedule_day: existingSched?.day_of_week || 'mon',
      schedule_start: existingSched?.start_time?.slice(0, 5) || '09:00',
      schedule_end: existingSched?.end_time?.slice(0, 5) || '10:30',
      schedule_room: existingSched?.room || 'Turing Hall 204'
    });
    setIsModalOpen(true);
  };

  const openWindowModal = () => {
    if (regWindow) {
      setWindowForm({
        semester: regWindow.semester || 'Spring 2025',
        opens_at: regWindow.opens_at ? regWindow.opens_at.slice(0, 16) : '',
        closes_at: regWindow.closes_at ? regWindow.closes_at.slice(0, 16) : '',
        is_active: regWindow.is_active ?? true,
      });
    } else {
      const now = new Date();
      const in14Days = new Date(Date.now() + 14 * 86400000);
      setWindowForm({
        semester: 'Spring 2025',
        opens_at: now.toISOString().slice(0, 16),
        closes_at: in14Days.toISOString().slice(0, 16),
        is_active: true,
      });
    }
    setIsWindowModalOpen(true);
  };

  const handleSaveWindow = (e: React.FormEvent) => {
    e.preventDefault();
    windowMutation.mutate({
      semester: windowForm.semester,
      opens_at: windowForm.opens_at ? new Date(windowForm.opens_at).toISOString() : undefined,
      closes_at: windowForm.closes_at ? new Date(windowForm.closes_at).toISOString() : undefined,
      is_active: windowForm.is_active,
    });
  };

  const handleExportRegistered = async () => {
    try {
      setIsExportingReg(true);
      await coursesApi.downloadRegisteredCSV(regWindow?.semester);
      toast.success('Registered students CSV downloaded.');
    } catch (e) {
      toast.error('Failed to export CSV.');
    } finally {
      setIsExportingReg(false);
    }
  };

  const handleExportUnregistered = async () => {
    try {
      setIsExportingUnreg(true);
      await coursesApi.downloadUnregisteredCSV(regWindow?.semester);
      toast.success('Unregistered students CSV downloaded.');
    } catch (e) {
      toast.error('Failed to export CSV.');
    } finally {
      setIsExportingUnreg(false);
    }
  };

  const handleSubmit = () => {
    if (editingCourse) updateMutation.mutate();
    else createMutation.mutate();
  };

  const courses = data?.results ?? [];
  const isWindowOpen = regWindow?.is_open;

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>Course & Registration Management</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>
            Control semester registration windows, extend deadlines, generate CSV audit reports, and configure class schedules.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 20px',
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
          <Plus size={17} /> Create Course
        </button>
      </div>

      {/* ── Registration Window & Reports Hub ── */}
      <Card style={{ padding: '22px 26px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: `1px solid ${C.slate2}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${C.slate2}`, paddingBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: isWindowOpen ? '#ecfdf5' : '#fef2f2',
                color: isWindowOpen ? '#059669' : '#dc2626',
                padding: 14,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isWindowOpen ? '#a7f3d0' : '#fecaca'}`,
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: C.slate9 }}>
                  {regWindow?.semester || 'Spring 2025'} Registration Window
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: isWindowOpen ? '#059669' : '#dc2626',
                    color: '#fff',
                  }}
                >
                  {isWindowOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: C.slate6, marginTop: 4, display: 'flex', gap: 14 }}>
                <span>Opens: <strong>{formatDateTime(regWindow?.opens_at)}</strong></span>
                <span>•</span>
                <span>Deadline: <strong>{formatDateTime(regWindow?.closes_at)}</strong></span>
              </div>
            </div>
          </div>

          {/* Actions & CSV Export Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              onClick={openWindowModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                background: '#fff',
                color: C.slate8,
                border: `1px solid ${C.slate3}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Sliders size={15} color={C.indigo} /> Manage / Reopen Window
            </button>

            <button
              onClick={handleExportRegistered}
              disabled={isExportingReg}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                background: '#fff',
                color: '#047857',
                border: `1px solid #a7f3d0`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isExportingReg ? <Spinner /> : <Download size={15} />} Export Registered (CSV)
            </button>

            <button
              onClick={handleExportUnregistered}
              disabled={isExportingUnreg}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                background: '#fff',
                color: '#b91c1c',
                border: `1px solid #fecaca`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isExportingUnreg ? <Spinner /> : <Download size={15} />} Export Unregistered (CSV)
            </button>
          </div>
        </div>

        {/* Live Enrollment Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginTop: 18 }}>
          <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
            <div style={{ fontSize: 12.5, color: C.slate5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Users size={15} /> Total Students
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.slate9, marginTop: 6 }}>
              {regStats?.total_students ?? 0}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
            <div style={{ fontSize: 12.5, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <UserCheck size={15} /> Registered Students
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 6 }}>
              {regStats?.registered_students ?? 0}{' '}
              <span style={{ fontSize: 12, fontWeight: 600, color: C.slate4 }}>
                ({regStats?.registration_rate_pct ?? 0}%)
              </span>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
            <div style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <UserX size={15} /> Unregistered (0 Credits)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginTop: 6 }}>
              {regStats?.unregistered_students ?? 0}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
            <div style={{ fontSize: 12.5, color: C.indigo, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <BookOpen size={15} /> Total Active Enrollments
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.indigo, marginTop: 6 }}>
              {regStats?.total_active_enrollments ?? 0}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Search Bar ── */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by course code or title…"
          style={{ width: '100%', padding: '11px 16px 11px 40px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* ── Course Table ── */}
      <Card style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : courses.length === 0 ? (
          <Empty icon={BookOpen} title="No courses found" sub="Try adjusting your search." />
        ) : (
          <ScrollableTable minWidth={750}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.slate0 }}>
                  {['Code', 'Title', 'Credits', 'Schedule & Room', 'Capacity', 'Instructor', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((c: any) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${C.slate1}` }}>
                    <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 800, color: C.indigo }}>{c.code}</td>
                    <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>{c.title}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: C.slate7, fontWeight: 600 }}>{c.credits} cr</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: C.slate7 }}>
                      {c.schedules?.length > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700, color: C.slate8 }}>{c.schedules[0].day_name} {c.schedules[0].start_time?.slice(0, 5)}–{c.schedules[0].end_time?.slice(0, 5)}</div>
                          <div style={{ color: C.slate5, fontSize: 12 }}>{c.schedules[0].room || 'Turing Hall'}</div>
                        </div>
                      ) : <span style={{ color: C.slate4 }}>TBD</span>}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: C.slate7, fontWeight: 600 }}>{c.enrollment_count} / {c.max_students}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: C.slate7 }}>{c.instructors?.[0]?.full_name || 'Unassigned'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <Badge label={c.status} color={c.status === 'active' ? C.greenL : C.slate1} text={c.status === 'active' ? C.green : C.slate5} />
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <button onClick={() => openEditModal(c)} style={{ background: 'transparent', border: 'none', color: C.indigo, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </Card>

      {/* ── Registration Window & Deadline Manager Modal ── */}
      {isWindowModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 26, width: 520, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.slate9 }}>Manage Semester Registration Window</h3>
            <p style={{ margin: '6px 0 18px', fontSize: 13.5, color: C.slate5 }}>
              Set registration deadlines or reopen access for students who missed registration.
            </p>

            {/* Quick Extension Shortcuts */}
            <div style={{ background: C.slate0, padding: 14, borderRadius: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 10 }}>⚡ Quick Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  onClick={() => windowMutation.mutate({ semester: windowForm.semester, extend_days: 3 })}
                  disabled={windowMutation.isPending}
                  style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, background: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  +3 Days Extension
                </button>
                <button
                  onClick={() => windowMutation.mutate({ semester: windowForm.semester, extend_days: 7 })}
                  disabled={windowMutation.isPending}
                  style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, background: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  +7 Days Extension
                </button>
                <button
                  onClick={() => windowMutation.mutate({ semester: windowForm.semester, reopen: true })}
                  disabled={windowMutation.isPending}
                  style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: C.indigo, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Reopen Now (7 Days)
                </button>
                <button
                  onClick={() => windowMutation.mutate({ semester: windowForm.semester, is_active: false })}
                  disabled={windowMutation.isPending}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close / Suspend
                </button>
              </div>
            </div>

            {/* Custom Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Semester</label>
                <input
                  value={windowForm.semester}
                  onChange={e => setWindowForm({ ...windowForm, semester: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Opens At Date & Time</label>
                  <input
                    type="datetime-local"
                    value={windowForm.opens_at}
                    onChange={e => setWindowForm({ ...windowForm, opens_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Deadline Date & Time</label>
                  <input
                    type="datetime-local"
                    value={windowForm.closes_at}
                    onChange={e => setWindowForm({ ...windowForm, closes_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setIsWindowModalOpen(false)}
                style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C.slate7 }}
              >
                Cancel
              </button>
              <button
                onClick={() => windowMutation.mutate({
                  semester: windowForm.semester,
                  opens_at: windowForm.opens_at ? new Date(windowForm.opens_at).toISOString() : undefined,
                  closes_at: windowForm.closes_at ? new Date(windowForm.closes_at).toISOString() : undefined,
                  is_active: windowForm.is_active,
                })}
                disabled={windowMutation.isPending}
                style={{ padding: '10px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}
              >
                {windowMutation.isPending ? 'Saving...' : 'Save Window Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Course Modal ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>{editingCourse ? 'Edit Course & Schedule' : 'Create New Course & Schedule'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <input placeholder="Course Code (e.g. CS101)" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
                <input placeholder="Slug (e.g. cs-101)" value={newCourse.slug} onChange={e => setNewCourse({ ...newCourse, slug: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              <input placeholder="Course Title" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <textarea placeholder="Course Description" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', minHeight: 74, resize: 'vertical' }} />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Credits</label>
                  <input type="number" value={newCourse.credits} onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Max Capacity</label>
                  <input type="number" value={newCourse.max_students} onChange={e => setNewCourse({ ...newCourse, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Semester</label>
                  <input placeholder="e.g. Spring 2025" value={newCourse.semester} onChange={e => setNewCourse({ ...newCourse, semester: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Weekly Timetable & Room Configuration */}
              <div style={{ background: C.slate0, padding: '16px 18px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.slate8, marginBottom: 12 }}>📅 Weekly Meeting Timetable & Location</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 6 }}>Meeting Day</label>
                    <select value={newCourse.schedule_day} onChange={e => setNewCourse({ ...newCourse, schedule_day: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate3}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                      <option value="mon">Monday</option>
                      <option value="tue">Tuesday</option>
                      <option value="wed">Wednesday</option>
                      <option value="thu">Thursday</option>
                      <option value="fri">Friday</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 6 }}>Classroom / Location</label>
                    <input placeholder="e.g. Turing Hall 204" value={newCourse.schedule_room} onChange={e => setNewCourse({ ...newCourse, schedule_room: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate3}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 6 }}>Start Time</label>
                    <input type="time" value={newCourse.schedule_start} onChange={e => setNewCourse({ ...newCourse, schedule_start: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate3}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 6 }}>End Time</label>
                    <input type="time" value={newCourse.schedule_end} onChange={e => setNewCourse({ ...newCourse, schedule_end: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate3}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Assign Faculty Instructor</label>
                <select
                  value={newCourse.instructor_ids[0] || ''}
                  onChange={e => setNewCourse({ ...newCourse, instructor_ids: [e.target.value] })}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, outline: 'none', background: '#fff' }}
                >
                  <option value="">-- Select Instructor --</option>
                  {instData?.results?.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.first_name} {i.last_name} ({i.department || i.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 26 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.slate7 }}>Cancel</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} style={{ padding: '10px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
