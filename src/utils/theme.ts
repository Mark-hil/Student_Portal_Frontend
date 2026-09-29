import { BatchStatus } from '../types';

export const C = {
  // Brand & Dark Backgrounds (Institutional Deep Forest)
  forestDark: '#04130d',
  forestDark1: '#072118',
  forestDark2: '#0d3125',
  navy: '#04130d',
  navy1: '#072118',
  navy2: '#0d3125',
  navy3: '#1e3a2f',

  // Primary Institutional Accent (University Forest Green)
  primary: '#047857',
  primaryHover: '#065f46',
  primaryL: '#f0fdf4',
  primaryBorder: '#bbf7d0',

  // Backward compatibility alias for views referencing C.indigo
  indigo: '#047857',
  indigoHover: '#065f46',
  indigoL: '#f0fdf4',
  indigoBorder: '#bbf7d0',

  // Secondary Institutional Accent (Academic Gold & Yellow)
  gold: '#eab308',
  goldWarm: '#f59e0b',
  goldYellow: '#facc15',
  goldL: '#fefce8',
  goldBorder: '#fef08a',
  goldText: '#92400e',
  amber: '#f59e0b',
  amberL: '#fffbeb',
  amberBorder: '#fde68a',

  // Success (Emerald Green)
  green: '#10b981',
  greenL: '#ecfdf5',
  greenBorder: '#a7f3d0',
  emerald: '#10b981',
  emeraldL: '#ecfdf5',

  // Purple / Violet (Specialized roles)
  purple: '#8b5cf6',
  purpleL: '#f5f3ff',
  purpleBorder: '#ddd6fe',

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
  shadowSm: '0 1px 2px 0 rgba(4, 19, 13, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(4, 19, 13, 0.07), 0 2px 4px -2px rgba(4, 19, 13, 0.05)',
  shadowLg: '0 10px 15px -3px rgba(4, 19, 13, 0.08), 0 4px 6px -4px rgba(4, 19, 13, 0.04)',
  shadowXl: '0 20px 25px -5px rgba(4, 19, 13, 0.1), 0 8px 10px -6px rgba(4, 19, 13, 0.06)',
  shadowPrimaryGlow: '0 4px 14px rgba(4, 120, 87, 0.38)',
  shadowGoldGlow: '0 4px 14px rgba(234, 179, 8, 0.38)',
};

export const gpaColor = (v: number | null) =>
  !v ? C.slate4 : v >= 3.7 ? C.primary : v >= 3.3 ? C.green : v >= 2.7 ? C.goldWarm : C.rose;

export const gradeColor = (g: string) =>
  ({ 'A': C.primary, 'B': C.green, 'C': C.goldWarm, 'D': '#f97316', 'F': C.rose }[g?.[0]] ?? C.slate4);

export const BATCH_COLORS: Record<BatchStatus, string> = {
  draft: '#94a3b8',
  pending_review: '#f59e0b',
  rejected: '#f43f5e',
  approved: '#047857',
  published: '#10b981',
};

export const BATCH_LABELS: Record<BatchStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
  approved: 'Approved',
  published: 'Published',
};
