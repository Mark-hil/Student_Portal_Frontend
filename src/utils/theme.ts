import { BatchStatus } from '../types';

export const C = {
  navy:'#0f172a', navy2:'#1e3a5f',
  indigo:'#6366f1', indigoL:'#eef2ff',
  green:'#10b981', greenL:'#ecfdf5',
  amber:'#f59e0b', amberL:'#fefce8',
  rose:'#ef4444',  roseL:'#fef2f2',
  slate9:'#0f172a', slate7:'#334155', slate6:'#475569',
  slate5:'#64748b', slate4:'#94a3b8', slate3:'#cbd5e1',
  slate2:'#e2e8f0', slate1:'#f1f5f9', slate0:'#f8fafc',
};

export const gpaColor   = (v: number|null) => !v ? C.slate4 : v>=3.7 ? C.green : v>=3.3 ? C.indigo : v>=2.7 ? C.amber : C.rose;
export const gradeColor = (g: string)      => ({'A':C.green,'B':C.indigo,'C':C.amber,'D':'#f97316','F':C.rose}[g?.[0]] ?? C.slate4);

export const BATCH_COLORS: Record<BatchStatus,string> = {
  draft:'#94a3b8', pending_review:'#f59e0b',
  rejected:'#ef4444', approved:'#6366f1', published:'#10b981',
};
export const BATCH_LABELS: Record<BatchStatus,string> = {
  draft:'Draft', pending_review:'Pending Review',
  rejected:'Rejected', approved:'Approved', published:'Published',
};
