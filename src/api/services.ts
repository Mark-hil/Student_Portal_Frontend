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
  Lesson, Submission, RosterData,
  StudentStatement, PaymentRecord, SemesterFeeStructure, BursarOverview,
  MOHVerificationResult, MOHUploadResult, StudentRegistrationPayload,
  AcademicProgressionLog, PromoteStudentPayload, DemoteStudentPayload,
  WithdrawStudentPayload, ReinstateStudentPayload, BulkPromotePayload, DeletionPrecheckResult,
  PortalRoleInfo, PortalFunction,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:       (identifier: string, password: string) =>
    client.post<LoginResponse>('/auth/login/', { email: identifier, username: identifier, password }),
  verifyMOH:   (data: { moh_pin: string; serial_number: string }) =>
    client.post<MOHVerificationResult>('/auth/verify-moh/', data),
  registerMOH: (data: { moh_pin: string; serial_number: string; password: string; email?: string; phone?: string }) =>
    client.post<LoginResponse>('/auth/register-moh/', data),
  completeRegistration: (data: StudentRegistrationPayload) =>
    client.post<{ status: string; message: string; user: User; tokens: { access: string; refresh: string } }>(
      '/users/me/complete-registration/',
      data
    ),
  getMe:       () => client.get<User>('/users/me/'),
  register:    (data: { email: string; password: string; first_name: string; last_name: string; role: string }) =>
    client.post<LoginResponse>('/auth/register/', data),
  logout:      (refresh?: string) => client.post('/auth/logout/', { refresh }),
};

export const downloadCsvBlob = (data: any, defaultFilename: string) => {
  const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me:             () => client.get<User>('/users/me/'),
  updateMe:       (data: Partial<User>) => client.patch<User>('/users/me/', data),
  uploadAvatar:   (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return client.post<User>('/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (current: string, newPass: string) =>
    client.post('/users/me/change-password/', { current_password: current, new_password: newPass }),
  exportStudentsCsv: async (params?: { role?: string; search?: string }, filename = 'students_directory.csv') => {
    const res = await client.get('/users/manage/export-students/', {
      params,
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, filename);
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => client.get<{ total_students: number; total_instructors: number; total_courses: number; pending_batches: number; }>('/users/stats/'),
  listUsers: (params?: Record<string, string>) => client.get<PaginatedResponse<User>>('/users/manage/', { params }),
  createUser: (data: any) => client.post<User>('/users/manage/', data),
  updateUser: (id: string, data: Partial<User>) => client.patch<User>(`/users/manage/${id}/`, data),
  toggleUserStatus: (id: string) => client.post<{ status: string; is_active: boolean; user: User }>(`/users/manage/${id}/toggle-status/`),
  resetUserPassword: (id: string, newPassword?: string) =>
    client.post<{ status: string; detail: string }>(`/users/manage/${id}/reset-password/`, { new_password: newPassword }),
  uploadUserAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return client.post<User>(`/users/manage/${id}/avatar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMOHRoster: (formData: FormData) =>
    client.post<MOHUploadResult>('/users/manage/upload-moh-roster/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadMOHTemplate: async () => {
    const res = await client.get('/users/manage/moh-template/', {
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, 'asdam_moh_student_roster_template.csv');
  },
  exportStudentsCsv: async (params?: { role?: string; search?: string }, filename = 'students_directory.csv') => {
    const res = await client.get('/users/manage/export-students/', {
      params,
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, filename);
  },
  resendCredentials: (id: string) =>
    client.post<{ status: string; message: string; result?: any }>(`/users/manage/${id}/resend-credentials/`),
  promoteStudent: (id: string, data: PromoteStudentPayload) =>
    client.post<{ success: boolean; message: string; student_id: string; from_level: string; to_level: string; academic_status: string; user: User }>(
      `/users/manage/${id}/promote/`,
      data
    ),
  demoteStudent: (id: string, data: DemoteStudentPayload) =>
    client.post<{ success: boolean; message: string; student_id: string; from_level: string; to_level: string; academic_status: string; user: User }>(
      `/users/manage/${id}/demote/`,
      data
    ),
  withdrawStudent: (id: string, data: WithdrawStudentPayload) =>
    client.post<{ success: boolean; message: string; student_id: string; academic_status: string; dropped_courses_count: number; user: User }>(
      `/users/manage/${id}/withdraw/`,
      data
    ),
  reinstateStudent: (id: string, data: ReinstateStudentPayload) =>
    client.post<{ success: boolean; message: string; student_id: string; academic_status: string; level: string; user: User }>(
      `/users/manage/${id}/reinstate/`,
      data
    ),
  softDeleteUser: (id: string, reason?: string) =>
    client.post<{ success: boolean; message: string; student_id: string }>(
      `/users/manage/${id}/soft-delete/`,
      { reason }
    ),
  restoreUser: (id: string) =>
    client.post<{ success: boolean; message: string; student_id: string; user: User }>(
      `/users/manage/${id}/restore/`
    ),
  deletionPrecheck: (id: string) =>
    client.get<DeletionPrecheckResult>(`/users/manage/${id}/deletion-precheck/`),
  permanentDeleteUser: (id: string, force = false, reason?: string) =>
    client.post<{ success: boolean; message: string }>(
      `/users/manage/${id}/permanent-delete/`,
      { force, reason }
    ),
  bulkPromote: (data: BulkPromotePayload) =>
    client.post<{ succeeded: Array<{ id: string; name: string; student_id: string; from_level: string; to_level: string; status: string }>; failed: Array<{ id: string; name: string; student_id: string; error: string }>; total: number }>(
      '/users/manage/bulk-promote/',
      data
    ),
  getProgressionHistory: (id: string) =>
    client.get<AcademicProgressionLog[]>(`/users/manage/${id}/progression-history/`),
  getRolesAndFunctions: () =>
    client.get<{ roles: PortalRoleInfo[]; functions: PortalFunction[] }>(
      '/users/manage/roles-and-functions/'
    ),
  assignRoleAndFunctions: (userId: string, payload: { role?: string; assigned_functions?: string[] }) =>
    client.post<{ status: string; message: string; user: User }>(
      `/users/manage/${userId}/assign-role-and-functions/`,
      payload
    ),
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
  manageRegistrationWindow: (data: { semester?: string; opens_at?: string; closes_at?: string; extend_days?: number; reopen?: boolean; is_active?: boolean }) =>
    client.post<RegistrationWindow>('/courses/registration-window/manage/', data),
  registrationStats: (semester?: string) =>
    client.get<import('../types').RegistrationStats>('/courses/reports/registration-stats/', { params: semester ? { semester } : {} }),
  downloadRegisteredCSV: async (semester?: string) => {
    const res = await client.get('/courses/reports/registered-csv/', {
      params: semester ? { semester } : {},
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registered_students_${semester || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  downloadUnregisteredCSV: async (semester?: string) => {
    const res = await client.get('/courses/reports/unregistered-csv/', {
      params: semester ? { semester } : {},
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `unregistered_students_${semester || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  enrollments:        () => client.get<PaginatedResponse<Enrollment>>('/courses/enrollments/'),
  drop:               (enrollmentId: string, reason?: string) =>
    client.post(`/courses/enrollments/${enrollmentId}/drop/`, { reason }),
  enrollmentHistory:  () => client.get<PaginatedResponse<Enrollment>>('/courses/enrollments/history/'),
  create:             (data: any) => client.post<Course>('/courses/', data),
  update:             (id: string, data: any) => client.patch<Course>(`/courses/${id}/`, data),
  delete:             (id: string) => client.delete(`/courses/${id}/`),
  roster:             (courseId: string) => client.get<RosterData>(`/courses/${courseId}/roster/`),
  exportRosterCsv:    async (courseId: string, filename = 'course_roster.csv') => {
    const res = await client.get(`/courses/${courseId}/export-roster/`, { responseType: 'blob' });
    downloadCsvBlob(res.data, filename);
  },
  exportGradesCsv:    async (courseId: string, filename = 'course_grade_sheet.csv') => {
    const res = await client.get(`/courses/${courseId}/export-grades/`, { responseType: 'blob' });
    downloadCsvBlob(res.data, filename);
  },
  lessons:            (courseId?: string) => client.get<Lesson[]>('/courses/lessons/', { params: courseId ? { course: courseId } : {} }),
  createLesson:       (data: Partial<Lesson>) => client.post<Lesson>('/courses/lessons/', data),
  updateLesson:       (id: string, data: Partial<Lesson>) => client.patch<Lesson>(`/courses/lessons/${id}/`, data),
  deleteLesson:       (id: string) => client.delete(`/courses/lessons/${id}/`),
  toggleLessonProgress:(lessonId: string) =>
    client.post<{ lesson_id: string; completed: boolean; progress_pct: number }>(`/courses/lessons/${lessonId}/toggle-progress/`),
};

// ── Grades — Student ──────────────────────────────────────────────────────────
export const gradesApi = {
  list:          (params?: { course?: string; semester?: string }) =>
    client.get<PaginatedResponse<Grade>>('/grades/', { params }),
  gpaSummary:    () => client.get<GPASummary>('/grades/gpa-summary/'),
  transcript:    () => client.get<TranscriptSemester[]>('/grades/transcript/'),
  downloadTranscriptPdf: async () => {
    const res = await client.get('/grades/transcript/pdf/', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unofficial_transcript.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  courseSummary: () => client.get<CourseSummaryRow[]>('/grades/course-summary/'),
  recompute:     (semester?: string) => client.post('/grades/recompute/', { semester }),
};

// ── Assignments — Lecturer + Student ──────────────────────────────────────────
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
  submit: (id: string, data: { file?: string; text_content?: string }) =>
    client.post<Submission>(`/grades/assignments/${id}/submit/`, data),
  mySubmission: (id: string) =>
    client.get<Submission | null>(`/grades/assignments/${id}/my-submission/`),
  submissions: (id: string) =>
    client.get<Submission[]>(`/grades/assignments/${id}/submissions/`),
  gradeSubmission: (assignmentId: string, submissionId: string, score: number, feedback?: string) =>
    client.post<Submission>(`/grades/assignments/${assignmentId}/grade-submission/`, { submission_id: submissionId, score, feedback }),
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
  exportCsvUrl: (batchId: string) =>
    `${client.defaults.baseURL}/grades/batches/${batchId}/export-csv/`,
  exportCsv: async (batchId: string, filename = 'grades.csv') => {
    const res = await client.get(`/grades/batches/${batchId}/export-csv/`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  importCsv: (batchId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post(`/grades/batches/${batchId}/import-csv/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

// ── Financials & Billing (Ghana Cedis GH₵) ──────────────────────────────────
export const financialsApi = {
  // Student endpoints
  getMyStatement: () =>
    client.get<StudentStatement>('/financials/my-statement/'),

  payMoMo: (data: { amount: string | number; provider: string; phone: string; reference?: string }) =>
    client.post<PaymentRecord>('/financials/pay/momo/', data),

  submitBankSlip: (formData: FormData) =>
    client.post<PaymentRecord>('/financials/pay/bank-slip/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getReceiptPdfBlob: (paymentId: number) =>
    client.get(`/financials/payments/${paymentId}/receipt/`, {
      responseType: 'blob',
    }),

  // Bank direct integration / simulator
  bankLookup: (studentId: string) =>
    client.get<{ student_id: string; student_name: string; program: string; semester: string; total_billed: string | number; total_paid: string | number; balance_due: string | number; currency: string; status: string; has_hold: boolean }>(
      '/financials/bank/lookup/',
      { params: { student_id: studentId } }
    ),

  bankNotify: (data: {
    student_id: string;
    amount: string | number;
    bank_name: string;
    teller_ref?: string;
    bank_reference?: string;
    branch?: string;
    teller_id?: string;
    depositor_name?: string;
    notes?: string;
  }) => {
    const ref = data.teller_ref || data.bank_reference || `BNK-${Date.now().toString().slice(-6)}`;
    const payload = {
      ...data,
      teller_ref: ref,
      bank_reference: ref,
    };
    return client.post<{
      status: string;
      message: string;
      receipt_number: string;
      balance_remaining?: string | number;
      current_balance?: string | number;
      currency?: string;
      payment?: PaymentRecord;
    }>('/financials/bank/notify/', payload);
  },

  // Bursar / Accounts Admin endpoints
  getAdminOverview: () =>
    client.get<BursarOverview>('/financials/admin/overview/'),

  verifySlip: (paymentId: number, approve: boolean, notes?: string) =>
    client.post<PaymentRecord>(`/financials/admin/verify-slip/${paymentId}/`, { approve, notes }),

  adjustStatement: (data: { student_id: string; semester?: string; amount: string | number; reason: string }) =>
    client.post<{ status: string; detail: string; bursary_total: string | number; new_balance: string | number }>(
      '/financials/admin/adjust/',
      data
    ),

  getFeeStructure: () =>
    client.get<SemesterFeeStructure[]>('/financials/admin/fee-structure/'),

  getFeeStructures: (params?: { semester?: string; level?: string }) =>
    client.get<SemesterFeeStructure[]>('/financials/admin/fee-structure/', { params }),

  updateFeeStructure: (data: Partial<SemesterFeeStructure> & { recalculate_students?: boolean }) =>
    client.post<{ message: string; fee_structure: SemesterFeeStructure; all_structures: SemesterFeeStructure[] }>(
      '/financials/admin/fee-structure/',
      data
    ),

  exportStatementsCsv: async (params?: { level?: string; status?: string }, filename = 'financial_statements.csv') => {
    const res = await client.get('/financials/admin/export/statements/', {
      params,
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, filename);
  },

  exportPaymentsCsv: async (params?: { channel?: string }, filename = 'payments_stream.csv') => {
    const res = await client.get('/financials/admin/export/payments/', {
      params,
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, filename);
  },

  exportMyStatementCsv: async (filename = 'my_statement_of_account.csv') => {
    const res = await client.get('/financials/statement/export-csv/', {
      responseType: 'blob',
    });
    downloadCsvBlob(res.data, filename);
  },
};
