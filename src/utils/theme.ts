import { BatchStatus } from '../types';

export const C = {
  // Brand & Dark Backgrounds
  navy: '#090d16',
  navy1: '#0f172a',
  navy2: '#1e293b',
  navy3: '#334155',

  // Primary Accent (Indigo & Violet)
  indigo: '#4f46e5',
  indigoHover: '#4338ca',
  indigoL: '#eef2ff',
  indigoBorder: '#c7d2fe',

  // Success (Emerald)
  green: '#10b981',
  greenL: '#ecfdf5',
  greenBorder: '#a7f3d0',
  emerald: '#10b981',
  emeraldL: '#ecfdf5',

  // Purple / Violet
  purple: '#8b5cf6',
  purpleL: '#f5f3ff',
  purpleBorder: '#ddd6fe',

  // Warning (Amber)
  amber: '#f59e0b',
  amberL: '#fffbeb',
  amberBorder: '#fde68a',

  // Danger (Rose)
  rose: '#f43f5e',
  roseL: '#fff1f2',
  roseBorder: '#fecdd3',

  // Slate Neutral Hierarchy
  slate9: '#0f172a',
  slate8: '#1e293b',
  slate7: '#334155',
  slate6: '#475569',
  slate5: '#64748b',
  slate4: '#94a3b8',
  slate3: '#cbd5e1',
  slate2: '#e2e8f0',
  slate1: '#f1f5f9',
  slate0: '#f8fafc',
  white: '#ffffff',

  // Elevation Shadows
  shadowSm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  shadowLg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  shadowXl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
};

export const gpaColor = (v: number | null) =>
  !v ? C.slate4 : v >= 3.7 ? C.green : v >= 3.3 ? C.indigo : v >= 2.7 ? C.amber : C.rose;

export const gradeColor = (g: string) =>
  ({ 'A': C.green, 'B': C.indigo, 'C': C.amber, 'D': '#f97316', 'F': C.rose }[g?.[0]] ?? C.slate4);

export const BATCH_COLORS: Record<BatchStatus, string> = {
  draft: '#94a3b8',
  pending_review: '#f59e0b',
  rejected: '#f43f5e',
  approved: '#4f46e5',
  published: '#10b981',
};

export const BATCH_LABELS: Record<BatchStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
  approved: 'Approved',
  published: 'Published',
};
