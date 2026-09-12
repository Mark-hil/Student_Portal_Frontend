import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, BookOpen, Layers, FileText, CheckCircle2, Clock, MapPin,
  Video, Upload, Check, AlertCircle, AlertTriangle, Loader2,
  ExternalLink, MessageSquare, ChevronDown, ChevronUp, FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { coursesApi, assignmentsApi, filesApi } from '../../api/services';
import type { Course, Lesson, Assignment, Submission } from '../../types';

interface Props {
  course: Course;
  onClose: () => void;
}

export function StudentCourseModal({ course, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'assignments'>('overview');

  // Lessons Query
  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['courses', 'lessons', course.id],
    queryFn: () => coursesApi.lessons(course.id).then(r => r.data),
  });

  const lessons: Lesson[] = Array.isArray(lessonsData)
    ? lessonsData
    : (lessonsData as any)?.results ?? [];

  // Assignments Query
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['grades', 'assignments', course.id],
    queryFn: () => assignmentsApi.list({ course: course.id }).then(r => r.data),
  });

  const assignments: Assignment[] = Array.isArray(assignmentsData)
    ? assignmentsData
    : assignmentsData?.results ?? [];

  // Toggle Lesson Progress Mutation
  const toggleProgressMutation = useMutation({
    mutationFn: (lessonId: string) => coursesApi.toggleLessonProgress(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'lessons', course.id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrollments'] });
      toast.success('Lesson progress updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update lesson progress.');
    },
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
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
          borderRadius: 20,
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.slate2}`, background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.indigo, background: C.indigoL, padding: '2px 8px', borderRadius: 6 }}>
                  {course.code}
                </span>
                <span style={{ fontSize: 12, color: C.slate5, fontWeight: 500 }}>
                  {course.credits} Credits · {course.semester || 'Spring 2025'}
                </span>
                {course.category && (
                  <span style={{ fontSize: 12, color: C.slate5 }}>· {course.category.name}</span>
                )}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: C.slate9, margin: 0 }}>
                {course.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.slate4,
                padding: 4,
                borderRadius: 8,
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {[
              { id: 'overview', label: 'Overview & Schedule', icon: BookOpen },
              { id: 'lessons', label: `Lessons & Content (${lessons.length})`, icon: Layers },
              { id: 'assignments', label: `Assignments & Submissions (${assignments.length})`, icon: FileText },
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
                    gap: 7,
                    padding: '8px 14px',
                    borderRadius: 9,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: active ? '#fff' : 'transparent',
                    color: active ? C.indigo : C.slate6,
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.slate6, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                  Course Syllabus & Overview
                </h4>
                <p style={{ fontSize: 13.5, color: C.slate7, lineHeight: 1.65, margin: 0 }}>
                  {course.description || 'This course explores modern principles, advanced analytical methods, practical labs, and comprehensive problem sets essential for mastery of the discipline.'}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.slate6, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                  Weekly Lecture Sessions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(course.schedules || []).length === 0 ? (
                    <div style={{ fontSize: 12.5, color: C.slate4 }}>Schedule details announced by faculty at first lecture.</div>
                  ) : (
                    course.schedules.map((s, idx) => (
                      <div key={idx} style={{ background: C.slate0, padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock size={16} color={C.indigo} />
                          <span style={{ fontWeight: 600, color: C.slate8 }}>{s.day_name}, {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.slate5 }}>
                          <MapPin size={15} />
                          <span>{s.room || 'Turing Hall, Section A'}</span>
                        </div>
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
                  {(course.instructors || []).length === 0 ? (
                    <div style={{ fontSize: 12.5, color: C.slate4 }}>Instructor assigned by department.</div>
                  ) : (
                    (course.instructors || []).map((ins, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.slate0, padding: '10px 16px', borderRadius: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.indigo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {ins.full_name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9 }}>{ins.full_name}</div>
                          <div style={{ fontSize: 11.5, color: C.slate4 }}>{ins.email} · {ins.department}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div>
              {isLoadingLessons ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.slate5 }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  Loading course syllabus and lessons...
                </div>
              ) : lessons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.slate5 }}>
                  <BookOpen size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, color: C.slate7 }}>No lessons published yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Your instructor will release lecture materials and reading modules as the term progresses.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {lessons.map(lesson => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      onToggle={() => toggleProgressMutation.mutate(lesson.id)}
                      isPending={toggleProgressMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              {isLoadingAssignments ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.slate5 }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  Loading assignments & submissions...
                </div>
              ) : assignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.slate5 }}>
                  <FileText size={36} color={C.slate3} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, color: C.slate7 }}>No assignments scheduled</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Any course assignments or project milestones will appear here.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {assignments.map(assignment => (
                    <StudentAssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.slate2}`, background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              background: C.slate1,
              border: `1px solid ${C.slate2}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: C.slate7,
              cursor: 'pointer',
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lesson Item Component ───────────────────────────────────────────────────
function LessonItem({ lesson, onToggle, isPending }: { lesson: Lesson; onToggle: () => void; isPending: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${lesson.is_completed ? '#bbf7d0' : C.slate2}`,
        background: lesson.is_completed ? '#f0fdf4' : '#fff',
        borderRadius: 12,
        padding: '14px 18px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <button
            onClick={onToggle}
            disabled={isPending}
            title={lesson.is_completed ? 'Mark uncompleted' : 'Mark as completed'}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `2px solid ${lesson.is_completed ? C.green : C.slate3}`,
              background: lesson.is_completed ? C.green : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              color: '#fff',
            }}
          >
            {lesson.is_completed && <Check size={16} strokeWidth={3} />}
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div style={{ fontSize: 14, fontWeight: 700, color: lesson.is_completed ? C.green : C.slate9, marginTop: 2 }}>
              {lesson.title}
            </div>
          </div>
        </div>

        {(lesson.content || lesson.video_url) && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.slate4,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.slate2}`, fontSize: 13, color: C.slate7, lineHeight: 1.6 }}>
          {lesson.video_url && (
            <div style={{ marginBottom: 10 }}>
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.indigo, fontWeight: 600, textDecoration: 'none' }}
              >
                <Video size={16} /> Watch Lecture Recording <ExternalLink size={13} />
              </a>
            </div>
          )}
          {lesson.content && (
            <div style={{ whiteSpace: 'pre-line', background: '#fff', padding: 12, borderRadius: 8, border: `1px solid ${C.slate2}` }}>
              {lesson.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Student Assignment Card & Dual-Mode Submission ───────────────────────────
function StudentAssignmentCard({ assignment }: { assignment: Assignment }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch student's existing submission
  const { data: mySubmission, isLoading: isLoadingSub } = useQuery({
    queryKey: ['submission', assignment.id],
    queryFn: () => assignmentsApi.mySubmission(assignment.id).then(r => r.data),
  });

  const isPastDue = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
  const isGraded = mySubmission?.status === 'graded';
  const isSubmitted = !!mySubmission;

  const handleSubmit = async () => {
    if (!selectedFile && !textContent.trim()) {
      toast.error('Please upload a submission file or enter your written answer/link.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedFileId: string | undefined = undefined;

      if (selectedFile) {
        const uploadRes = await filesApi.upload(selectedFile, 'assignment');
        uploadedFileId = uploadRes.data.id;
      }

      await assignmentsApi.submit(assignment.id, {
        file: uploadedFileId,
        text_content: textContent.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ['submission', assignment.id] });
      toast.success(isPastDue ? 'Assignment submitted (Recorded with Late Timestamp).' : 'Assignment submitted successfully! Digital receipt generated.');
      setSelectedFile(null);
      setTextContent('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${C.slate2}`, borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px 20px',
          background: isExpanded ? '#f8fafc' : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.slate6, background: C.slate1, padding: '2px 8px', borderRadius: 5 }}>
              {assignment.assignment_type}
            </span>
            <span style={{ fontSize: 12, color: C.slate5 }}>
              Max: {assignment.max_score} pts · Weight: {assignment.weight}%
            </span>
            {assignment.due_date && (
              <span style={{ fontSize: 12, color: isPastDue ? C.amber : C.slate5, fontWeight: isPastDue ? 700 : 500 }}>
                · Due: {new Date(assignment.due_date).toLocaleDateString()} {new Date(assignment.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: C.slate9, margin: 0 }}>
            {assignment.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isLoadingSub ? (
            <Loader2 size={16} className="animate-spin" color={C.slate4} />
          ) : isGraded ? (
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              Graded: {mySubmission?.score} / {assignment.max_score}
            </span>
          ) : isSubmitted ? (
            <span style={{ background: mySubmission?.status === 'late' ? '#fef3c7' : '#e0e7ff', color: mySubmission?.status === 'late' ? '#b45309' : C.indigo, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              {mySubmission?.status === 'late' ? 'Submitted (Late)' : 'Submitted'}
            </span>
          ) : isPastDue ? (
            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              Missing / Past Due
            </span>
          ) : (
            <span style={{ background: C.slate1, color: C.slate6, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
              Pending Submission
            </span>
          )}

          {isExpanded ? <ChevronUp size={18} color={C.slate4} /> : <ChevronDown size={18} color={C.slate4} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: 20, borderTop: `1px solid ${C.slate2}`, background: '#fff' }}>
          {assignment.description && (
            <div style={{ fontSize: 13, color: C.slate7, lineHeight: 1.6, marginBottom: 16, background: C.slate0, padding: '12px 16px', borderRadius: 8 }}>
              {assignment.description}
            </div>
          )}

          {/* Graded Feedback Display */}
          {isGraded && mySubmission && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <CheckCircle2 size={17} /> Instructor Evaluation & Score
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#166534', margin: '4px 0 8px' }}>
                {mySubmission.score} / {assignment.max_score} points ({Math.round((Number(mySubmission.score) / Number(assignment.max_score)) * 100)}%)
              </div>
              {mySubmission.feedback ? (
                <div style={{ fontSize: 13, color: '#14532d', background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #dcfce7' }}>
                  <strong>Instructor Feedback:</strong> {mySubmission.feedback}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#15803d' }}>No qualitative comments attached.</div>
              )}
            </div>
          )}

          {/* Active / Existing Submission Info */}
          {mySubmission && (
            <div style={{ background: C.slate0, border: `1px solid ${C.slate2}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: C.slate8 }}>
                  <FileCheck size={16} color={C.indigo} /> Digital Submission Receipt
                </div>
                <span style={{ fontSize: 11.5, color: C.slate5 }}>
                  {new Date(mySubmission.submitted_at).toLocaleString()}
                </span>
              </div>

              {mySubmission.file_name && (
                <div style={{ fontSize: 12.5, color: C.slate7, marginTop: 4 }}>
                  <strong>Attached File:</strong>{' '}
                  {mySubmission.file_url ? (
                    <a href={mySubmission.file_url} target="_blank" rel="noreferrer" style={{ color: C.indigo, textDecoration: 'underline' }}>
                      {mySubmission.file_name}
                    </a>
                  ) : (
                    <span>{mySubmission.file_name}</span>
                  )}
                </div>
              )}

              {mySubmission.text_content && (
                <div style={{ fontSize: 12.5, color: C.slate7, marginTop: 6, whiteSpace: 'pre-line', background: '#fff', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.slate2}` }}>
                  {mySubmission.text_content}
                </div>
              )}
            </div>
          )}

          {/* Submission Input Form (Dual-Mode: File + Text) */}
          {(!isGraded || !mySubmission) && (
            <div style={{ borderTop: mySubmission ? `1px dashed ${C.slate2}` : 'none', paddingTop: mySubmission ? 14 : 0 }}>
              <h5 style={{ fontSize: 12.5, fontWeight: 700, color: C.slate8, marginBottom: 8 }}>
                {mySubmission ? 'Resubmit Assignment Deliverables' : 'Submit Deliverable (File / Link / Text)'}
              </h5>

              {isPastDue && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span><strong>Late Submission:</strong> Due date has passed. Your submission will record the exact submission timestamp for instructor review.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* File Upload Zone */}
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${selectedFile ? C.indigo : C.slate3}`,
                      background: selectedFile ? C.indigoL : '#fafafa',
                      borderRadius: 10,
                      padding: '16px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Upload size={22} color={selectedFile ? C.indigo : C.slate4} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedFile ? C.indigo : C.slate7 }}>
                      {selectedFile ? selectedFile.name : 'Click to upload solution file (PDF, ZIP, DOCX, Code)'}
                    </div>
                    <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Maximum file size: 25MB'}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </div>

                {/* Text / Repository Input */}
                <div>
                  <textarea
                    rows={3}
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="Enter GitHub repository URL, written answers, or submission notes..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${C.slate2}`,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      style={{ padding: '8px 14px', background: 'none', border: 'none', color: C.slate5, fontSize: 12, cursor: 'pointer' }}
                    >
                      Clear File
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.indigo,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <FileCheck size={15} />}
                    {mySubmission ? 'Resubmit Solution' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
