/**
 * React Query hooks for all course + registration data.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/services';

export function useCourseList(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['courses', 'list', params],
    queryFn:  () => coursesApi.list(params).then(r => r.data),
    staleTime: 3 * 60 * 1000,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ['courses', 'mine'],
    queryFn:  () => coursesApi.myCourses().then(r => r.data),
    staleTime: 60 * 1000,
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn:  () => coursesApi.detail(id).then(r => r.data),
    enabled:  !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRegistrationWindow(semester?: string) {
  return useQuery({
    queryKey: ['registration-window', semester],
    queryFn:  () => coursesApi.registrationWindow(semester).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConflictCheck(courseId: string, enabled = false) {
  return useQuery({
    queryKey: ['conflict', courseId],
    queryFn:  () => coursesApi.checkConflict(courseId).then(r => r.data),
    enabled:  enabled && !!courseId,
    staleTime: 0,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn:  () => coursesApi.enrollments().then(r => r.data),
    staleTime: 60 * 1000,
  });
}

export function useEnrollmentHistory() {
  return useQuery({
    queryKey: ['enrollments', 'history'],
    queryFn:  () => coursesApi.enrollmentHistory().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Register for a single course */
export function useRegisterCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => coursesApi.register(courseId).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

/** Register for multiple courses at once */
export function useBulkRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseIds: string[]) => coursesApi.bulkRegister(courseIds).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

/** Drop an enrollment */
export function useDropCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason?: string }) =>
      coursesApi.drop(enrollmentId, reason).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
