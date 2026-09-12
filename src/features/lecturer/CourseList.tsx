import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, ChevronRight, Calendar, Clock, MapPin,
  LayoutGrid, CalendarRange, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { coursesApi } from '../../api/services';
import type { Course } from '../../types';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLORS = [C.indigo, C.green, C.amber, '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export function CourseList({ onSelect }: { onSelect: (id: string) => void }) {
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list');

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['lecturer-courses'],
    queryFn: () => coursesApi.myCourses().then(r => r.data)
  });

  if (isLoading) return <div style={{ padding: 30, textAlign: 'center' }}><Spinner /></div>;
  if (!courses?.length) return <div style={{ padding: 20, color: C.slate5 }}>No teaching courses assigned yet.</div>;

  // Build timetable slots for teaching
  const timetableSlots: { course: Course; schedule: any; day: string; color: string }[] = [];
  courses.forEach((c, idx) => {
    const col = COLORS[idx % COLORS.length];
    (c.schedules || []).forEach(s => {
      const dayMap: Record<string, string> = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday',
        '0': 'Monday', '1': 'Tuesday', '2': 'Wednesday', '3': 'Thursday', '4': 'Friday',
      };
      const dayName = dayMap[s.day_of_week] || s.day_name || 'Monday';
      if (DAYS.includes(dayName)) {
        timetableSlots.push({ course: c, schedule: s, day: dayName, color: col });
      }
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: C.slate5, fontWeight: 500 }}>
          Assigned to <strong>{courses.length}</strong> active course section{courses.length > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', background: C.slate1, padding: 3, borderRadius: 10, gap: 2 }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: viewMode === 'list' ? '#fff' : 'transparent',
              color: viewMode === 'list' ? C.slate9 : C.slate5,
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={13} /> Course List
          </button>
          <button
            onClick={() => setViewMode('timetable')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: viewMode === 'timetable' ? '#fff' : 'transparent',
              color: viewMode === 'timetable' ? C.slate9 : C.slate5,
              boxShadow: viewMode === 'timetable' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <CalendarRange size={13} /> Teaching Timetable
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map((c, idx) => {
            const col = COLORS[idx % COLORS.length];
            return (
              <Card
                key={c.id}
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color .15s', borderLeft: `4px solid ${col}` }}
                onClick={() => onSelect(c.id)}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ background: `${col}18`, padding: 10, borderRadius: 12 }}>
                    <BookOpen color={col} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.slate9 }}>
                      {c.code} — {c.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                      <span>Semester: <strong>{c.semester || 'Spring 2025'}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} /> {c.enrollment_count ?? 0} / {c.max_students} Students
                      </span>
                      {c.schedules?.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.indigo, fontWeight: 600 }}>
                          <Clock size={12} /> {c.schedules[0].day_name} {c.schedules[0].start_time?.slice(0, 5)}–{c.schedules[0].end_time?.slice(0, 5)}
                          {c.schedules[0].room && ` · ${c.schedules[0].room}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      coursesApi.exportRosterCsv(c.id, `${c.code}_student_roster.csv`);
                      toast.success(`Exporting roster for ${c.code}`);
                    }}
                    title="Export Course Student Roster CSV"
                    style={{
                      background: '#f8fafc',
                      border: `1px solid ${C.slate2}`,
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.slate7,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={13} /> Roster
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      coursesApi.exportGradesCsv(c.id, `${c.code}_grades.csv`);
                      toast.success(`Exporting grades for ${c.code}`);
                    }}
                    title="Export Course Grade Sheet CSV"
                    style={{
                      background: '#f8fafc',
                      border: `1px solid ${C.slate2}`,
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.slate7,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={13} /> Grades
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.indigo, fontSize: 12, fontWeight: 600 }}>
                    Manage Course <ChevronRight size={16} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Weekly Teaching Timetable Grid ──────────────────────── */
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, minHeight: 260 }}>
              {DAYS.map(day => {
                const daySlots = timetableSlots.filter(s => s.day === day);
                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(248, 250, 252, 0.5)', padding: 8, borderRadius: 10 }}>
                    {daySlots.length === 0 ? (
                      <div style={{ fontSize: 11, color: C.slate3, textAlign: 'center', padding: '24px 0' }}>
                        No lectures
                      </div>
                    ) : (
                      daySlots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => onSelect(slot.course.id)}
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
    </div>
  );
}
