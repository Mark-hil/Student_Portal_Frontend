/**
 * Typed API services — every endpoint in one place.
 * Covers: Student, Lecturer, and Academic Officer roles.
 */
import client from './client';
import type {
  User, Course, Enrollment, Grade, Notification,
  PaginatedResponse, LoginResponse, GPASummary,
  BulkRegistrationResult, TranscriptSemester,
  CourseSummaryRow, RegistrationWindow, ConflictCheck,
  Assignment, GradeBatch, GradeBatchListItem,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    client.post<LoginResponse>('/auth/login/', { email, password }),
  register: (data: { email: string; password: string; first_name: string; last_name: string; role: string }) =>
    client.post<LoginResponse>('/auth/register/', data),
  logout:   (refresh?: string) => client.post('/auth/logout/', { refresh }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me:             () => client.get<User>('/users/me/'),
  updateMe:       (data: Partial<User>) => client.patch<User>('/users/me/', data),
  changePassword: (current: string, newPass: string) =>
    client.post('/users/me/change-password/', { current_password: current, new_password: newPass }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => client.get<{ total_students: number; total_instructors: number; total_courses: number; pending_batches: number; }>('/users/stats/'),
  listUsers: (params?: Record<string, string>) => client.get<PaginatedResponse<User>>('/users/manage/', { params }),
  createUser: (data: any) => client.post<User>('/users/manage/', data),
};

// ── Courses ───────────────────────────────────────────────────────────────────
export const coursesApi = {
  list:               (params?: Record<string, string | number>) =>
    client.get<PaginatedResponse<Course>>('/courses/', { params }),
  detail:             (id: string) => client.get<Course>(`/courses/${id}/`),
  myCourses:          () => client.get<Course[]>('/courses/my-courses/'),
  categories:         () => client.get('/courses/categories/'),
  register:           (courseId: string) => client.post<Enrollment>(`/courses/${courseId}/register/`),
  bulkRegister:       (courseIds: string[]) =>
    client.post<BulkRegistrationResult>('/courses/bulk-register/', { course_ids: courseIds }),
  checkConflict:      (courseId: string) => client.get<ConflictCheck>(`/courses/${courseId}/check-conflict/`),
  registrationWindow: (semester?: string) =>
    client.get<RegistrationWindow>('/courses/registration-window/', { params: semester ? { semester } : {} }),
  enrollments:        () => client.get<PaginatedResponse<Enrollment>>('/courses/enrollments/'),
  drop:               (enrollmentId: string, reason?: string) =>
    client.post(`/courses/enrollments/${enrollmentId}/drop/`, { reason }),
  enrollmentHistory:  () => client.get<PaginatedResponse<Enrollment>>('/courses/enrollments/history/'),
  create:             (data: any) => client.post<Course>('/courses/', data),
  update:             (id: string, data: any) => client.patch<Course>(`/courses/${id}/`, data),
};

// ── Grades — Student ──────────────────────────────────────────────────────────
export const gradesApi = {
  list:          (params?: { course?: string; semester?: string }) =>
    client.get<PaginatedResponse<Grade>>('/grades/', { params }),
  gpaSummary:    () => client.get<GPASummary>('/grades/gpa-summary/'),
  transcript:    () => client.get<TranscriptSemester[]>('/grades/transcript/'),
  courseSummary: () => client.get<CourseSummaryRow[]>('/grades/course-summary/'),
  recompute:     (semester?: string) => client.post('/grades/recompute/', { semester }),
};

// ── Assignments — Lecturer ────────────────────────────────────────────────────
export const assignmentsApi = {
  list:   (params?: { course?: string }) =>
    client.get<PaginatedResponse<Assignment>>('/grades/assignments/', { params }),
  create: (data: {
    course: string; title: string; assignment_type: string;
    max_score: number; weight: number; due_date?: string; description?: string;
  }) => client.post<Assignment>('/grades/assignments/', data),
  update: (id: string, data: Partial<Assignment>) =>
    client.patch<Assignment>(`/grades/assignments/${id}/`, data),
  delete: (id: string) => client.delete(`/grades/assignments/${id}/`),
  togglePublish: (id: string) =>
    client.post<{ is_published: boolean }>(`/grades/assignments/${id}/publish/`),
};

// ── Grade Batches — Lecturer + Officer ────────────────────────────────────────
export const batchesApi = {
  // Lecturer
  list:   (params?: { role?: string }) =>
    client.get<GradeBatchListItem[]>('/grades/batches/', { params }),
  detail: (id: string) =>
    client.get<GradeBatch>(`/grades/batches/${id}/`),
  upload: (batchId: string, grades: Array<{ student_id: string; score: number; feedback?: string }>) =>
    client.post(`/grades/batches/${batchId}/upload/`, { grades }),
  submit: (batchId: string, note?: string) =>
    client.patch<GradeBatch>(`/grades/batches/${batchId}/submit/`, { note }),
  // Officer
  approve: (batchId: string) =>
    client.patch<GradeBatch>(`/grades/batches/${batchId}/approve/`),
  reject:  (batchId: string, notes: string) =>
    client.patch<GradeBatch>(`/grades/batches/${batchId}/reject/`, { notes }),
  publish: (batchId: string) =>
    client.patch<GradeBatch>(`/grades/batches/${batchId}/publish/`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        () => client.get<PaginatedResponse<Notification>>('/notifications/'),
  markRead:    (id: string) => client.patch(`/notifications/${id}/read/`),
  markAllRead: () => client.post('/notifications/mark-all-read/'),
  unreadCount: () => client.get<{ unread: number }>('/notifications/unread-count/'),
};

// ── Files ─────────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: (file: File, purpose?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (purpose) form.append('purpose', purpose);
    return client.post('/files/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
