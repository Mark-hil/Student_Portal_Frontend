/**
 * Complete TypeScript types — single source of truth.
 * Covers: Student, Lecturer, and Academic Officer roles.
 */

// ── Auth / User ───────────────────────────────────────────────────────────────
export type Role = 'student' | 'instructor' | 'staff' | 'admin';

export interface UserProfile {
  enrollment_year:  number | null;
  graduation_year:  number | null;
  major:            string;
  gpa:              string | null;
  total_credits:    number;
  preferences:      Record<string, unknown>;
}

export interface User {
  id:             string;
  email:          string;
  student_id:     string | null;
  first_name:     string;
  last_name:      string;
  full_name:      string;
  role:           Role;
  avatar:         string | null;
  phone:          string;
  department:     string;
  bio:            string;
  email_verified: boolean;
  created_at:     string;
  profile:        UserProfile | null;
}

export interface LoginResponse {
  user:   User;
  tokens: { access: string; refresh: string };
}

// ── Courses ───────────────────────────────────────────────────────────────────
export type CourseStatus = 'draft' | 'active' | 'archived';

export interface Category { id: string; name: string; slug: string; icon: string; }

export interface CourseSchedule {
  id:           string;
  day_of_week:  number;
  day_name:     string;
  start_time:   string;
  end_time:     string;
  room:         string;
  is_online:    boolean;
  meeting_link: string;
}

export interface Instructor { id: string; full_name: string; email: string; avatar: string | null; department: string; }
export interface Prerequisite { id: string; code: string; title: string; credits: number; }

export type LessonType = 'video' | 'reading' | 'quiz' | 'assignment' | 'live';
export interface Lesson {
  id: string; title: string; order: number; lesson_type: LessonType;
  duration_minutes: number | null; is_free_preview: boolean; published_at: string | null;
}

export interface Course {
  id:                string;
  code:              string;
  title:             string;
  slug:              string;
  description:       string;
  category:          Category | null;
  credits:           number;
  status:            CourseStatus;
  semester:          string;
  start_date:        string | null;
  end_date:          string | null;
  max_students:      number;
  enrollment_count:  number;
  available_seats:   number;
  is_full:           boolean;
  is_enrolled:       boolean;
  enrollment_status: 'active' | 'waitlisted' | 'dropped' | null;
  tags:              string[];
  schedules:         CourseSchedule[];
  prerequisites:     Prerequisite[];
  lessons?:          Lesson[];
  instructors?:      Instructor[];
  syllabus_url?:     string;
}

// ── Enrollments ───────────────────────────────────────────────────────────────
export type EnrollmentStatus = 'active' | 'dropped' | 'completed' | 'waitlisted';
export interface Enrollment {
  id:           string;
  course:       Course;
  status:       EnrollmentStatus;
  enrolled_at:  string;
  progress_pct: string;
  final_grade:  string;
  grade_points: string | null;
}

// ── Registration ──────────────────────────────────────────────────────────────
export interface BulkRegistrationResult {
  registered: Enrollment[];
  errors:     Array<{ course: string; error: string; detail: string }>;
  summary:    { registered_count: number; error_count: number; total_credits: number };
}
export interface ConflictCheck {
  has_conflict: boolean;
  conflicts:    Array<{ day: string; new_slot: string; conflict_with: string; existing_slot: string }>;
}
export interface RegistrationWindow {
  id: string; semester: string; opens_at: string; closes_at: string;
  is_active: boolean; is_open: boolean; detail?: string;
}

// ── Assignments ───────────────────────────────────────────────────────────────
export type AssignmentType = 'homework' | 'midterm' | 'final' | 'quiz' | 'project' | 'lab' | 'attendance';

export interface Assignment {
  id:              string;
  title:           string;
  assignment_type: AssignmentType;
  max_score:       string;
  weight:          string;
  due_date:        string | null;
  is_published:    boolean;
  course_code:     string;
  course_title:    string;
  created_at:      string;
}

// ── Grade Batch (lecturer / officer workflow) ─────────────────────────────────
export type BatchStatus = 'draft' | 'pending_review' | 'rejected' | 'approved' | 'published';

export interface BatchGradeEntry {
  student_id:   string;
  student_name: string;
  student_code: string | null;
  score:        string | null;
  feedback:     string;
  letter_grade: string;
  percentage:   number | null;
}

export interface GradeBatch {
  id:              string;
  assignment:      Assignment;
  status:          BatchStatus;
  submitted_by:    { id: string; full_name: string; email: string } | null;
  submitted_at:    string | null;
  submission_note: string;
  reviewed_by:     { id: string; full_name: string; email: string } | null;
  reviewed_at:     string | null;
  review_notes:    string;
  published_at:    string | null;
  grade_count:     number;
  grades:          BatchGradeEntry[];
}

export interface GradeBatchListItem {
  id:               string;
  assignment_title: string;
  course_code:      string;
  status:           BatchStatus;
  submitted_by_name:string;
  submitted_at:     string | null;
  reviewed_at:      string | null;
  published_at:     string | null;
  grade_count:      number;
}

// ── Grade (student view — only published) ────────────────────────────────────
export interface Grade {
  id:           string;
  assignment:   Assignment;
  score:        string | null;
  feedback:     string;
  letter_grade: string;
  percentage:   number | null;
  grade_points: string | null;
  graded_at:    string | null;
  batch_status: BatchStatus;
}

// ── GPA / Transcript ──────────────────────────────────────────────────────────
export interface TranscriptRow {
  id:                string;
  course_code:       string;
  course_title:      string;
  credits:           number;
  semester:          string;
  semester_label:    string;
  final_grade:       string;
  grade_points:      string | null;
  credits_attempted: number;
  credits_earned:    number;
  quality_points:    string | null;
}

export interface SemesterRecordData {
  id:                           string;
  semester:                     string;
  semester_label:               string;
  status:                       string;
  semester_gpa:                 string | null;
  semester_credits_attempted:   number;
  semester_credits_earned:      number;
  semester_quality_points:      string;
  cumulative_gpa:               string | null;
  cumulative_credits_attempted: number;
  cumulative_credits_earned:    number;
  cumulative_quality_points:    string;
  computed_at:                  string;
  transcript_rows:              TranscriptRow[];
}

export interface GPASummary {
  semester_gpa:            string | null;
  cumulative_gpa:          string | null;
  current_semester:        string;
  current_semester_label:  string;
  credits_completed:       number;
  credits_this_semester:   number;
  semester_history:        SemesterRecordData[];
}

export interface TranscriptSemester {
  semester:          string;
  label:             string;
  semester_gpa:      string | null;
  cumulative_gpa:    string | null;
  credits_attempted: number;
  credits_earned:    number;
  courses:           TranscriptRow[];
}

export interface CourseSummaryRow {
  course_id:     string;
  course_code:   string;
  course_title:  string;
  credits:       number;
  progress_pct:  number;
  current_grade: string | null;
  current_pct:   number | null;
  grade_points:  string | null;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotifType =
  | 'grade_posted' | 'enrollment_confirmed' | 'assignment_due'
  | 'grade_batch_approved' | 'grade_batch_rejected' | 'grade_batch_published'
  | 'grade_review_requested' | 'announcement' | 'system';

export interface Notification {
  id:         string;
  notif_type: NotifType;
  title:      string;
  body:       string;
  read:       boolean;
  created_at: string;
  read_at:    string | null;
}

// ── API Utilities ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count:        number;
  next:         string | null;
  previous:     string | null;
  total_pages:  number;
  current_page: number;
  results:      T[];
}

export interface ApiError {
  error:   string;
  detail:  string;
  errors?: Record<string, string[]>;
}
