/** React Query hooks for grades, GPA, assignments, and batch workflow. */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi, assignmentsApi, batchesApi } from '../api/services';

// ── Student hooks ─────────────────────────────────────────────────────────────
export function useMyGrades(params?: { course?: string; semester?: string }) {
  return useQuery({
    queryKey: ['grades', params],
    queryFn:  () => gradesApi.list(params).then(r => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useGPASummary() {
  return useQuery({
    queryKey: ['gpa-summary'],
    queryFn:  () => gradesApi.gpaSummary().then(r => r.data),
    staleTime: 10 * 60_000,
  });
}

export function useTranscript() {
  return useQuery({
    queryKey: ['transcript'],
    queryFn:  () => gradesApi.transcript().then(r => r.data),
    staleTime: 15 * 60_000,
  });
}

// ── Lecturer hooks ────────────────────────────────────────────────────────────
export function useAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn:  () => assignmentsApi.list(courseId ? { course: courseId } : undefined).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof assignmentsApi.create>[0]) => assignmentsApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useUploadGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, grades }: { batchId: string; grades: Array<{ student_id: string; score: number; feedback?: string }> }) =>
      batchesApi.upload(batchId, grades).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useSubmitBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, note }: { batchId: string; note?: string }) =>
      batchesApi.submit(batchId, note).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

// ── Officer hooks ─────────────────────────────────────────────────────────────
export function useBatchList(role?: string) {
  return useQuery({
    queryKey: ['batches', role],
    queryFn:  () => batchesApi.list(role ? { role } : undefined).then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useBatchDetail(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn:  () => batchesApi.detail(id).then(r => r.data),
    enabled:  !!id,
    staleTime: 30_000,
  });
}

export function useApproveBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => batchesApi.approve(batchId).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useRejectBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, notes }: { batchId: string; notes: string }) =>
      batchesApi.reject(batchId, notes).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function usePublishBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => batchesApi.publish(batchId).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['grades'] });
      qc.invalidateQueries({ queryKey: ['gpa-summary'] });
      qc.invalidateQueries({ queryKey: ['transcript'] });
    },
  });
}
