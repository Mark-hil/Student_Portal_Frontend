/**
 * Complete TypeScript types — single source of truth.
 * Covers: Student, Lecturer, and Academic Officer roles.
 */

// ── Auth / User ───────────────────────────────────────────────────────────────
export type Role =
  | 'super-admin'
  | 'academic-officer'
  | 'departmental-head'
  | 'lecturer'
  | 'finance-officer'
  | 'student'
  // Legacy / alternate aliases
  | 'admin'
  | 'staff'
  | 'instructor'
  | 'finance';

export type AcademicStatus = 'active' | 'probation' | 'repeating' | 'withdrawn' | 'suspended' | 'graduated' | 'deleted';

export interface PortalFunction {
  code: string;
  name: string;
  category: string;
  description: string;
}

export interface PortalRoleInfo {
  code: Role;
  name: string;
  description: string;
  badge_color: string;
  default_functions: string[];
}

export interface UserProfile {
  enrollment_year:  number | null;
  graduation_year:  number | null;
  academic_level?:  string;
  major:            string;
  gpa:              string | null;
  total_credits:    number;
  preferences:      Record<string, unknown>;
  // Demographic and contact details (info.txt)
  ghana_card?:                 string;
  gender?:                     string;
  date_of_birth?:              string;
  birth_place?:                string;
  country_of_birth?:           string;
  nationality?:                string;
  languages_spoken?:           string;
  medical_condition?:          string;
  residential_address?:        string;
  city?:                       string;
  region?:                     string;
  district?:                   string;
  digital_address?:            string;
  guardian_name?:              string;
  guardian_phone?:             string;
  guardian_relationship?:      string;
  registration_completed_at?:  string;
}

export interface User {
  id:             string;
  email:          string;
  student_id:     string | null;
  moh_pin?:       string | null;
  serial_number?: string | null;
  program?:       'nursing' | 'midwifery' | string;
  class_name?:    string;
  admission_year?: number | null;
  is_registered?: boolean;
  academic_status?: AcademicStatus;
  withdrawal_date?: string | null;
  withdrawal_reason?: string | null;
  graduation_date?: string | null;
  first_name:     string;
  last_name:      string;
  full_name:      string;
  role:           Role;
  assigned_functions?: string[];
  effective_functions?: string[];
  avatar:         string | null;
  phone:          string;
  department:     string;
  bio:            string;
  is_active?:     boolean;
  is_deleted?:    boolean;
  deleted_at?:    string | null;
  email_verified: boolean;
  created_at:     string;
  profile:        UserProfile | null;
}

export interface AcademicProgressionLog {
  id: string;
  student: string;
  action: 'promotion' | 'demotion' | 'withdrawal' | 'reinstatement' | 'graduation' | 'status_change' | 'soft_delete' | 'restore';
  action_display: string;
  from_level: string;
  to_level: string;
  from_status: string;
  to_status: string;
  reason: string;
  academic_year: string;
  semester: string;
  performed_by: string | null;
  performed_by_name: string;
  performed_by_email: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PromoteStudentPayload {
  target_level?: string;
  academic_year?: string;
  semester?: string;
  notes?: string;
}

export interface DemoteStudentPayload {
  target_level?: string;
  reason: string;
  academic_year?: string;
  semester?: string;
  notes?: string;
}

export interface WithdrawStudentPayload {
  reason: string;
  withdrawal_category?: string;
  effective_date?: string | null;
  academic_year?: string;
  semester?: string;
  notes?: string;
}

export interface ReinstateStudentPayload {
  target_level?: string;
  academic_year?: string;
  semester?: string;
  notes?: string;
}

export interface BulkPromotePayload {
  student_ids: string[];
  target_level?: string;
  academic_year?: string;
  notes?: string;
}

export interface DeletionPrecheckResult {
  can_hard_delete: boolean;
  blockers: string[];
  student_id: string | null;
  name: string;
}

export interface LoginResponse {
  user:   User;
  tokens: { access: string; refresh: string };
}

export interface MOHVerificationResult {
  status:         'verified';
  student_id:     string;
  first_name:     string;
  last_name:      string;
  full_name:      string;
  moh_pin:        string;
  program:        'nursing' | 'midwifery';
  program_label:  string;
  class_name:     string;
  admission_year: number;
  email:          string;
  is_registered:  boolean;
}

export interface StudentRegistrationPayload {
  first_name:             string;
  last_name:              string;
  ghana_card:             string;
  gender:                 string;
  date_of_birth:          string;
  birth_place:            string;
  country_of_birth?:      string;
  nationality?:           string;
  languages_spoken?:      string;
  medical_condition?:     string;
  residential_address:    string;
  city:                   string;
  region:                 string;
  district:               string;
  digital_address:        string;
  phone:                  string;
  email?:                 string;
  guardian_name:          string;
  guardian_phone:         string;
  guardian_relationship?: string;
  new_password?:          string;
}

export interface MOHUploadResult {
  success:             boolean;
  total_rows:          number;
  imported_count:      number;
  notifications_count?: number;
  skipped_count:       number;
  dry_run:             boolean;
  students: Array<{
    student_id:     string;
    first_name:     string;
    last_name:      string;
    full_name:      string;
    moh_pin:        string;
    serial_number:  string;
    program:        string;
    program_label:  string;
    class_name:     string;
    admission_year: number;
    phone:          string;
    email:          string;
    is_registered:  boolean;
  }>;
  errors: Array<{
    row:    number;
    pin?:   string;
    error:  string;
  }>;
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
  id:               string;
  course?:          string;
  title:            string;
  order:            number;
  lesson_type:      LessonType;
  content?:         string;
  video_url?:       string;
  duration_minutes: number | null;
  is_free_preview:  boolean;
  published_at:     string | null;
  is_completed?:    boolean;
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
  dropped_at?:  string | null;
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
  id?: string;
  semester: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
  is_open: boolean;
  status_label?: 'open' | 'closed' | 'upcoming' | 'inactive';
  detail?: string;
}

export interface RegistrationStats {
  semester: string;
  total_students: number;
  registered_students: number;
  unregistered_students: number;
  registration_rate_pct: number;
  total_active_enrollments: number;
  avg_credits_per_registered: number;
}

// ── Assignments & Submissions ───────────────────────────────────────────────
export type AssignmentType = 'homework' | 'midterm' | 'final' | 'quiz' | 'project' | 'lab' | 'attendance';

export interface Assignment {
  id:              string;
  title:           string;
  assignment_type: AssignmentType;
  description?:    string;
  max_score:       string;
  weight:          string;
  due_date:        string | null;
  is_published:    boolean;
  course_code:     string;
  course_title:    string;
  created_at:      string;
  batch_id?:       string | null;
}

export interface Submission {
  id:            string;
  assignment_id: string;
  student_id:    string;
  student_code:  string | null;
  student_name:  string;
  student_email: string;
  file:          string | null;
  file_name:     string | null;
  file_url:      string | null;
  text_content:  string;
  status:        'submitted' | 'late' | 'graded';
  score:         string | number | null;
  feedback:      string;
  graded_at:     string | null;
  submitted_at:  string;
  updated_at:    string;
}

export interface RosterStudent {
  enrollment_id: string;
  student_id:    string;
  student_code:  string;
  name:          string;
  email:         string;
  department:    string;
  status:        'active' | 'waitlisted' | 'dropped' | 'completed';
  enrolled_at:   string;
  progress_pct:  number;
  current_grade: string;
  current_pct:   number;
}

export interface RosterData {
  course_id:        string;
  course_code:      string;
  course_title:     string;
  total_enrolled:   number;
  active_count:     number;
  waitlisted_count: number;
  dropped_count:    number;
  students:         RosterStudent[];
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

// ── Financials & Fee Billing (Ghana Cedis GH₵) ──────────────────────────────
export interface PaymentRecord {
  id:                number;
  receipt_number:    string;
  amount:            string | number;
  currency:          string;
  channel:           'momo' | 'bank_api' | 'bank_manual' | 'bursary';
  provider:          string;
  phone_or_account:  string;
  reference_number:  string;
  status:            'completed' | 'pending_verification' | 'failed';
  slip_image:        string | null;
  notes:             string;
  created_at:        string;
  verified_at:       string | null;
  student_name:      string;
  student_email:     string;
  student_index:     string;
}

export interface StudentStatement {
  id:                 number;
  semester:           string;
  academic_level?:    string;
  academic_fee:       string | number;
  ict_library_fee:    string | number;
  src_dues:           string | number;
  examination_fee:    string | number;
  bursary_aid:        string | number;
  total_billed:       string | number;
  total_paid:         string | number;
  balance:            string | number;
  currency:           string;
  status:             'unpaid' | 'partial' | 'paid' | 'overdue';
  due_date:           string | null;
  has_active_hold:    boolean;
  active_hold_reason: string | null;
  student_name:       string;
  student_index:      string;
  payments:           PaymentRecord[];
  created_at:         string;
  updated_at:         string;
}

export interface SemesterFeeStructure {
  id:                 number;
  semester:           string;
  academic_level?:    string;
  level_title?:       string;
  academic_fee:       string | number;
  ict_library_fee:    string | number;
  src_dues:           string | number;
  examination_fee:    string | number;
  total_fee:          string | number;
  due_date:           string | null;
  is_active:          boolean;
}

export interface LevelBreakdownItem {
  level: string;
  title: string;
  student_count: number;
  total_billed: string | number;
  total_paid: string | number;
  total_arrears: string | number;
  active_holds: number;
  collection_rate: number;
}

export interface BursarOverview {
  metrics: {
    total_billed:       string | number;
    total_paid:         string | number;
    total_arrears:      string | number;
    collection_rate?:   number;
    momo_total:         string | number;
    bank_total:         string | number;
    active_holds_count: number;
    level_breakdown?:   LevelBreakdownItem[];
  };
  active_fee_structure: SemesterFeeStructure;
  fee_structures?:      SemesterFeeStructure[];
  recent_payments:      PaymentRecord[];
  pending_bank_slips:   PaymentRecord[];
}
