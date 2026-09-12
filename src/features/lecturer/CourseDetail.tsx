import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, FileText, Upload, Users, Layers, BookOpen,
  CheckCircle2, Clock, Trash2, Edit2, ExternalLink, Download,
  MessageSquare, AlertCircle, X, Loader2, Video, Mail, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { coursesApi, assignmentsApi, batchesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { SectionHead } from '../../components/ui/SectionHead';
import { Badge } from '../../components/ui/Badge';
import { ScrollableTable } from '../../components/ui/Responsive';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { GradeUploadModal } from './GradeUploadModal';
import type { Lesson, Submission, RosterData, Assignment } from '../../types';

export function CourseDetail({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'assignments' | 'roster' | 'lessons'>('assignments');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [uploadingAssignment, setUploadingAssignment] = useState<{ id: string; batchId: string } | null>(null);
  const [reviewingAssignment, setReviewingAssignment] = useState<Assignment | null>(null);
  const [exportingGrades, setExportingGrades] = useState(false);
  const [exportingRoster, setExportingRoster] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);

  // Queries
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.detail(courseId).then(r => r.data),
  });

  const { data: assignmentsRes, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.list({ course: courseId }).then(r => r.data),
  });

  const { data: rosterData, isLoading: loadingRoster } = useQuery({
    queryKey: ['roster', courseId],
    queryFn: () => coursesApi.roster(courseId).then(r => r.data),
  });

  const { data: lessonsData, isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => coursesApi.lessons(courseId).then(r => r.data),
  });

  const lessons: Lesson[] = Array.isArray(lessonsData)
    ? lessonsData
    : (lessonsData as any)?.results ?? [];

  const assignments = assignmentsRes?.results || [];

  // Delete Lesson Mutation
  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => coursesApi.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      toast.success('Lesson removed from syllabus.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to remove lesson.');
    },
  });

  const handleUploadClick = (assignment: any) => {
    if (assignment.batch_id) {
      setUploadingAssignment({ id: assignment.id, batchId: assignment.batch_id });
    } else {
      toast.error('No grade batch attached to this assignment.');
    }
  };

  if (loadingCourse) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;
  }
  if (!course) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: '#fff',
              border: `1px solid ${C.slate2}`,
              cursor: 'pointer',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              color: C.slate6,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.indigo, background: C.indigoL, padding: '2px 8px', borderRadius: 6 }}>
                {course.code}
              </span>
              <span style={{ fontSize: 12, color: C.slate5 }}>{course.credits} Credits · {course.semester || 'Spring 2025'}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>{course.title}</h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: C.slate1, borderRadius: 10, padding: 3, border: `1px solid ${C.slate2}` }}>
          {[
            { id: 'assignments', label: `Assignments (${assignments.length})`, icon: FileText },
            { id: 'roster', label: `Class Roster (${rosterData?.total_enrolled ?? 0})`, icon: Users },
            { id: 'lessons', label: `Lessons (${lessons.length})`, icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? '#fff' : 'transparent',
                  color: active ? C.indigo : C.slate6,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: ASSIGNMENTS & SUBMISSIONS ────────────────────── */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHead
            title="Course Assignments & Grading Queue"
            action={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={async () => {
                    try {
                      setExportingGrades(true);
                      await coursesApi.exportGradesCsv(course.id, `${course.code}_grade_sheet.csv`);
                      toast.success('Course grade sheet exported successfully');
                    } catch (e: any) {
                      toast.error('Failed to export grades CSV');
                    } finally {
                      setExportingGrades(false);
                    }
                  }}
                  disabled={exportingGrades}
                  style={{
                    background: '#fff',
                    color: C.slate7,
                    border: `1px solid ${C.slate3}`,
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {exportingGrades ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  Export Grade Report (CSV)
                </button>
                <button
                  onClick={() => setShowCreateAssignment(true)}
                  style={{
                    background: C.indigo,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                  }}
                >
                  <Plus size={16} /> Create Assignment
                </button>
              </div>
            }
          />

          {loadingAssignments ? (
            <div style={{ padding: 30, textAlign: 'center' }}><Spinner /></div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {!assignments.length && (
                <Card style={{ padding: 40, textAlign: 'center', color: C.slate5 }}>
                  <FileText size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, color: C.slate7 }}>No assignments created yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Add assignments or projects to receive student submissions.</div>
                </Card>
              )}
              {assignments.map((a: Assignment) => (
                <Card key={a.id} style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ background: C.slate1, padding: 12, borderRadius: 12 }}>
                      <FileText color={C.indigo} size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.slate9 }}>{a.title}</div>
                      <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{a.assignment_type}</span>
                        <span>•</span>
                        <span>Max: {a.max_score} pts</span>
                        <span>•</span>
                        <span>Weight: {a.weight}%</span>
                        {a.due_date && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setReviewingAssignment(a)}
                      style={{
                        background: '#e0e7ff',
                        color: C.indigo,
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 12.5,
                      }}
                    >
                      <Users size={15} /> Review Submissions
                    </button>
                    <button
                      onClick={() => handleUploadClick(a)}
                      style={{
                        background: C.greenL,
                        color: C.green,
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 12.5,
                      }}
                    >
                      <Upload size={15} /> Batch CSV
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CLASS ROSTER ──────────────────────────────────── */}
      {activeTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHead
            title="Enrolled Student Roster"
            action={
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.slate6 }}>
                  Total: <strong>{rosterData?.total_enrolled ?? 0}</strong> (Active: <strong>{rosterData?.active_count ?? 0}</strong>)
                </span>
                <button
                  onClick={async () => {
                    try {
                      setExportingRoster(true);
                      await coursesApi.exportRosterCsv(course.id, `${course.code}_student_roster.csv`);
                      toast.success('Class roster exported successfully');
                    } catch (e: any) {
                      toast.error('Failed to export roster CSV');
                    } finally {
                      setExportingRoster(false);
                    }
                  }}
                  disabled={exportingRoster}
                  style={{
                    background: '#fff',
                    color: C.indigo,
                    border: `1px solid #c7d2fe`,
                    padding: '7px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: '0 1px 2px rgba(99,102,241,0.1)',
                  }}
                >
                  {exportingRoster ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  Export Student Roster (CSV)
                </button>
              </div>
            }
          />

          {loadingRoster ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
          ) : (rosterData?.students ?? []).length === 0 ? (
            <Card style={{ padding: 40, textAlign: 'center', color: C.slate5 }}>
              <Users size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: C.slate7 }}>No students enrolled in this section yet</div>
            </Card>
          ) : (
            <Card style={{ padding: 18 }}>
              <ScrollableTable>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.slate2}`, textAlign: 'left', color: C.slate5 }}>
                      <th style={{ padding: '10px 14px' }}>Student</th>
                      <th style={{ padding: '10px 14px' }}>Student ID</th>
                      <th style={{ padding: '10px 14px' }}>Department</th>
                      <th style={{ padding: '10px 14px' }}>Enrolled On</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Course Progress</th>
                      <th style={{ padding: '10px 14px' }}>Running Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterData?.students.map(s => (
                      <tr key={s.enrollment_id} style={{ borderBottom: `1px solid ${C.slate1}` }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: C.slate9 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: C.slate5, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} /> {s.email}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: C.slate7 }}>
                          {s.student_code || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: C.slate7 }}>
                          {s.department || 'General'}
                        </td>
                        <td style={{ padding: '12px 14px', color: C.slate5 }}>
                          {new Date(s.enrolled_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: s.status === 'active' ? '#dcfce7' : '#fee2e2',
                              color: s.status === 'active' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: C.slate2, borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ height: '100%', width: `${s.progress_pct}%`, background: C.indigo }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.slate7 }}>{s.progress_pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: C.indigo }}>
                            {s.current_grade}
                          </span>
                          <span style={{ fontSize: 11.5, color: C.slate5, marginLeft: 4 }}>
                            ({s.current_pct}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB 3: LESSONS MANAGEMENT ────────────────────────────── */}
      {activeTab === 'lessons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHead
            title="Course Syllabus & Learning Modules"
            action={
              <button
                onClick={() => setShowCreateLesson(true)}
                style={{
                  background: C.indigo,
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <Plus size={16} /> Add Lesson Module
              </button>
            }
          />

          {loadingLessons ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
          ) : lessons.length === 0 ? (
            <Card style={{ padding: 40, textAlign: 'center', color: C.slate5 }}>
              <Layers size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: C.slate7 }}>No lessons published for this course yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add weekly topics, video links, and reading notes for students.</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lessons.map(lesson => (
                <Card key={lesson.id} style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>
                          Lesson {lesson.order}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, background: C.slate1, color: C.slate7, padding: '2px 7px', borderRadius: 5 }}>
                          {lesson.lesson_type}
                        </span>
                        {lesson.duration_minutes && (
                          <span style={{ fontSize: 11, color: C.slate4 }}>
                            {lesson.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.slate9, margin: 0 }}>
                        {lesson.title}
                      </h4>
                      {lesson.content && (
                        <p style={{ fontSize: 13, color: C.slate6, margin: '6px 0 0', lineHeight: 1.5 }}>
                          {lesson.content}
                        </p>
                      )}
                      {lesson.video_url && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.indigo, fontWeight: 600, textDecoration: 'none' }}
                          >
                            <Video size={14} /> Lecture Video Link <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
                          deleteLessonMutation.mutate(lesson.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: C.slate4,
                        padding: 6,
                        borderRadius: 6,
                      }}
                      title="Remove lesson"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ASSIGNMENT MODAL ──────────────────────────────── */}
      {showCreateAssignment && (
        <CreateAssignmentModal
          courseId={courseId}
          onClose={() => setShowCreateAssignment(false)}
          onSuccess={() => {
            setShowCreateAssignment(false);
            queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
          }}
        />
      )}

      {/* ── BATCH CSV GRADE UPLOAD MODAL ─────────────────────────── */}
      {uploadingAssignment && (
        <GradeUploadModal
          batchId={uploadingAssignment.batchId}
          onClose={() => setUploadingAssignment(null)}
        />
      )}

      {/* ── SUBMISSIONS REVIEW & INDIVIDUAL GRADING QUEUE MODAL ──── */}
      {reviewingAssignment && (
        <SubmissionsReviewModal
          assignment={reviewingAssignment}
          onClose={() => setReviewingAssignment(null)}
        />
      )}

      {/* ── CREATE LESSON MODAL ──────────────────────────────────── */}
      {showCreateLesson && (
        <CreateLessonModal
          courseId={courseId}
          nextOrder={lessons.length + 1}
          onClose={() => setShowCreateLesson(false)}
          onSuccess={() => {
            setShowCreateLesson(false);
            queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
          }}
        />
      )}
    </div>
  );
}

// ── Submissions Review & Grading Queue Modal ─────────────────────────────────
function SubmissionsReviewModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  // Fetch submissions for this assignment
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['submissions', assignment.id],
    queryFn: () => assignmentsApi.submissions(assignment.id).then(r => r.data),
  });

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedSubmission(sub);
    setScoreInput(sub.score !== null ? String(sub.score) : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    const numScore = Number(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > Number(assignment.max_score)) {
      toast.error(`Score must be a number between 0 and ${assignment.max_score}`);
      return;
    }

    setIsGrading(true);
    try {
      await assignmentsApi.gradeSubmission(
        assignment.id,
        selectedSubmission.id,
        numScore,
        feedbackInput.trim()
      );
      toast.success(`Graded ${selectedSubmission.student_name} successfully! Grade synced.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['roster', assignment.course_code] });
      setSelectedSubmission(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade.');
    } finally {
      setIsGrading(false);
    }
  };

  return (
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
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 900,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.slate2}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, textTransform: 'uppercase', marginBottom: 2 }}>
              Grading Queue · Max {assignment.max_score} pts
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>
              {assignment.title} — Submissions ({submissions.length})
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4 }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedSubmission ? '1fr 1fr' : '1fr', flex: 1, overflow: 'hidden' }}>
          {/* Submissions List */}
          <div style={{ overflowY: 'auto', padding: 20, borderRight: selectedSubmission ? `1px solid ${C.slate2}` : 'none' }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.slate5 }}>
                <FileText size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: C.slate7 }}>No submissions received yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Student submissions will appear here in real-time.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {submissions.map(sub => {
                  const isSelected = selectedSubmission?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectSubmission(sub)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: `1px solid ${isSelected ? C.indigo : C.slate2}`,
                        background: isSelected ? C.indigoL : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: C.slate9 }}>{sub.student_name}</div>
                          <div style={{ fontSize: 11.5, color: C.slate5 }}>{sub.student_email}</div>
                        </div>
                        <div>
                          {sub.status === 'graded' ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                              Graded: {sub.score}/{assignment.max_score}
                            </span>
                          ) : sub.status === 'late' ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                              Late Submission
                            </span>
                          ) : (
                            <span style={{ background: '#e0e7ff', color: C.indigo, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                              Submitted
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.slate4, marginTop: 6 }}>
                        Submitted on: {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grading & Feedback Panel */}
          {selectedSubmission && (
            <div style={{ overflowY: 'auto', padding: 24, background: '#fcfcfd', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: C.slate9, margin: '0 0 4px' }}>
                  Student Deliverables: {selectedSubmission.student_name}
                </h4>
                <div style={{ fontSize: 12, color: C.slate5 }}>
                  Submission ID: {selectedSubmission.id.slice(0, 8)} · Status: <strong>{selectedSubmission.status}</strong>
                </div>
              </div>

              {/* Student File */}
              {selectedSubmission.file_name ? (
                <div style={{ background: '#fff', border: `1px solid ${C.slate2}`, padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 4 }}>Attached Solution File</div>
                  {selectedSubmission.file_url ? (
                    <a
                      href={selectedSubmission.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.indigo, fontWeight: 700, fontSize: 13, textDecoration: 'underline' }}
                    >
                      <Download size={14} /> Download {selectedSubmission.file_name}
                    </a>
                  ) : (
                    <div style={{ fontSize: 13, color: C.slate8 }}>{selectedSubmission.file_name}</div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.slate4, fontStyle: 'italic' }}>No file attached with this submission.</div>
              )}

              {/* Student Text / Repository Link */}
              {selectedSubmission.text_content && (
                <div style={{ background: '#fff', border: `1px solid ${C.slate2}`, padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.slate6, marginBottom: 4 }}>Written Solution / Repository Link</div>
                  <div style={{ fontSize: 12.5, color: C.slate8, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {selectedSubmission.text_content}
                  </div>
                </div>
              )}

              {/* Score Input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
                  Assignment Score (Max: {assignment.max_score} pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={Number(assignment.max_score)}
                  value={scoreInput}
                  onChange={e => setScoreInput(e.target.value)}
                  placeholder={`e.g. 95`}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.slate3}`,
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Feedback Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
                  Qualitative Feedback & Comments
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={e => setFeedbackInput(e.target.value)}
                  placeholder="Provide comprehensive constructive feedback on correctness, code quality, or recommendations..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.slate3}`,
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  style={{ padding: '8px 14px', background: 'none', border: 'none', color: C.slate5, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrade}
                  disabled={isGrading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.indigo,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isGrading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isGrading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save & Publish Grade
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Lesson Modal Component ───────────────────────────────────────────
function CreateLessonModal({ courseId, nextOrder, onClose, onSuccess }: { courseId: string; nextOrder: number; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState('reading');
  const [order, setOrder] = useState(nextOrder);
  const [duration, setDuration] = useState(45);
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a lesson title.');
      return;
    }

    setIsSubmitting(true);
    try {
      await coursesApi.createLesson({
        course: courseId,
        title: title.trim(),
        lesson_type: lessonType as any,
        order,
        duration_minutes: duration,
        video_url: videoUrl.trim() || undefined,
        content: content.trim() || undefined,
      });
      toast.success('Lesson module added to syllabus!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 20,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.slate9 }}>Add New Syllabus Module / Lesson</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Module Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Week 1: Introduction to Distributed Systems"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Lesson Type</label>
              <select
                value={lessonType}
                onChange={e => setLessonType(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, fontSize: 13, outline: 'none', background: '#fff' }}
              >
                <option value="reading">Reading & Notes</option>
                <option value="video">Recorded Video</option>
                <option value="quiz">Interactive Quiz</option>
                <option value="live">Live Lecture</option>
                <option value="assignment">Project / Assignment</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Video Recording URL (Optional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... or cloud recording link"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Module Syllabus & Reading Content (Optional)</label>
            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Overview, learning outcomes, required readings, and discussion prompts..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.slate3}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: C.slate1, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: C.slate7 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                background: C.indigo,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
