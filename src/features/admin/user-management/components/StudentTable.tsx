import React from 'react';
import {
  GraduationCap,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  UserMinus,
  RotateCcw,
  History,
  Trash2,
  FileText,
  Edit2,
  Key,
  UserX,
  UserCheck,
} from 'lucide-react';
import { C } from '../../../../utils/theme';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import { Empty } from '../../../../components/ui/Empty';
import { ScrollableTable } from '../../../../components/ui/Responsive';
import { UserStatusBadge } from './UserStatusBadge';
import type { User, AcademicStatus } from '../../../../types';

export interface StudentTableProps {
  students: User[];
  isLoading: boolean;
  selectedStudentIds: string[];
  onSelectStudent: (id: string, selected: boolean) => void;
  onSelectAllStudents: (selected: boolean) => void;
  onPromote: (user: User) => void;
  onDemote: (user: User) => void;
  onWithdraw: (user: User) => void;
  onReinstate: (user: User) => void;
  onViewHistory: (user: User) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
  onViewSlip: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isLoading,
  selectedStudentIds,
  onSelectStudent,
  onSelectAllStudents,
  onPromote,
  onDemote,
  onWithdraw,
  onReinstate,
  onViewHistory,
  onDelete,
  onRestore,
  onViewSlip,
  onEdit,
  onToggleStatus,
  onResetPassword,
}) => {
  const activeStudents = students.filter((u: User) => !u.is_deleted);
  const allActiveSelected =
    activeStudents.length > 0 &&
    activeStudents.every((u: User) => selectedStudentIds.includes(u.id));

  return (
    <Card style={{ overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : students.length === 0 ? (
        <Empty
          icon={GraduationCap}
          title="No students found"
          sub="No student records matched your search, program, or academic status filters."
        />
      ) : (
        <ScrollableTable minWidth={1050}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.slate0, borderBottom: `1px solid ${C.slate2}` }}>
                <th style={{ width: 44, padding: '14px 14px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allActiveSelected}
                    onChange={(e) => onSelectAllStudents(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.indigo }}
                    title="Select all active students on page"
                  />
                </th>
                {[
                  'Student Details',
                  'ASDAM ID & MOH PIN',
                  'Program & Level',
                  'Academic Standing',
                  'Registration State',
                  'Lifecycle & Actions',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.slate5,
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((u: User) => {
                const isActive = u.is_active !== false;
                const isArchived = Boolean(u.is_deleted);
                const isNursing =
                  u.program === 'nursing' || u.department?.toLowerCase()?.includes('nurs');
                const isMidwifery =
                  u.program === 'midwifery' || u.department?.toLowerCase()?.includes('midwi');
                const isRegistered = u.is_registered !== false;
                const acadStatus: AcademicStatus = ((u.academic_status || 'active').toLowerCase() as AcademicStatus);

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderTop: `1px solid ${C.slate1}`,
                      background: isArchived ? '#f8fafc' : '#fff',
                      opacity: isArchived ? 0.8 : 1,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Selection Checkbox */}
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      {!isArchived && (
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(u.id)}
                          onChange={(e) => onSelectStudent(u.id, e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.indigo }}
                        />
                      )}
                    </td>

                    {/* Student Identity */}
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: isArchived ? C.slate2 : '#ecfdf5',
                            color: isArchived ? C.slate6 : '#047857',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 800,
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `1px solid ${isArchived ? C.slate3 : '#a7f3d0'}`,
                          }}
                        >
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{u.first_name} {u.last_name}</span>
                            {isArchived && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: '#e2e8f0',
                                  color: '#475569',
                                }}
                              >
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: C.slate5, fontWeight: 400 }}>{u.email}</div>
                          {u.phone && (
                            <div style={{ fontSize: 11, color: C.slate4, fontWeight: 400 }}>{u.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Institutional ID & MOH PIN */}
                    <td style={{ padding: '14px 16px' }}>
                      {u.student_id ? (
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 12.5,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#f8fafc',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {u.student_id}
                          </span>
                          {u.moh_pin && (
                            <div style={{ fontSize: 11, color: C.slate5, marginTop: 4 }}>
                              MOH PIN: <strong style={{ color: C.slate8 }}>{u.moh_pin}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: C.slate4, fontSize: 12, fontStyle: 'italic' }}>Pending ID</span>
                          {u.moh_pin && (
                            <div style={{ fontSize: 11, color: C.slate5, marginTop: 2 }}>
                              PIN: <strong style={{ color: C.slate7 }}>{u.moh_pin}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Program & Academic Level */}
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: isNursing ? '#ecfdf5' : isMidwifery ? '#faf5ff' : '#f1f5f9',
                            color: isNursing ? '#047857' : isMidwifery ? '#7e22ce' : '#334155',
                            border: `1px solid ${isNursing ? '#a7f3d0' : isMidwifery ? '#e9d5ff' : '#cbd5e1'}`,
                          }}
                        >
                          <HeartPulse size={12} />
                          {isNursing ? 'Nursing' : isMidwifery ? 'Midwifery' : u.program || 'General Health'}
                        </span>
                        <div style={{ fontSize: 11.5, color: C.slate6, marginTop: 3, fontWeight: 600 }}>
                          Class Level {u.class_name || '100'} {u.admission_year ? `• Cohort '${u.admission_year}` : ''}
                        </div>
                      </div>
                    </td>

                    {/* Academic Standing */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <UserStatusBadge status={acadStatus} isArchived={isArchived} />
                        {u.withdrawal_reason && acadStatus === 'withdrawn' && (
                          <span
                            style={{
                              fontSize: 10.5,
                              color: '#dc2626',
                              fontStyle: 'italic',
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={u.withdrawal_reason}
                          >
                            Reason: {u.withdrawal_reason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Registration State */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isRegistered ? '#15803d' : '#b45309',
                            background: isRegistered ? '#dcfce7' : '#fef3c7',
                            border: `1px solid ${isRegistered ? '#bbf7d0' : '#fde68a'}`,
                            padding: '2px 7px',
                            borderRadius: 6,
                            width: 'fit-content',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isRegistered ? '#16a34a' : '#d97706' }} />
                          {isRegistered ? 'Registered' : 'Pending Onboarding'}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: isActive ? C.slate5 : '#b91c1c',
                          }}
                        >
                          {isActive ? 'Account Active' : 'Account Suspended'}
                        </span>
                      </div>
                    </td>

                    {/* Lifecycle & Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Student Progression Actions */}
                        {!isArchived && acadStatus !== 'graduated' && acadStatus !== 'withdrawn' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onPromote(u)}
                              title={u.class_name === '300' ? 'Graduate Student (Alumnus)' : 'Promote Student to Next Level'}
                              style={{
                                padding: '4px 8px',
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: C.indigo,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              {u.class_name === '300' ? <GraduationCap size={12} /> : <TrendingUp size={12} />}
                              {u.class_name === '300' ? 'Graduate' : 'Promote'}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDemote(u)}
                              title="Demote or Retain Student"
                              style={{
                                padding: '4px 8px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#b45309',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <TrendingDown size={12} /> Demote
                            </button>

                            <button
                              type="button"
                              onClick={() => onWithdraw(u)}
                              title="Withdraw Student"
                              style={{
                                padding: '4px 8px',
                                background: '#fff1f2',
                                border: '1px solid #fecdd3',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#be123c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <UserMinus size={12} /> Withdraw
                            </button>
                          </>
                        )}

                        {!isArchived && acadStatus === 'withdrawn' && (
                          <button
                            type="button"
                            onClick={() => onReinstate(u)}
                            title="Reinstate Withdrawn Student"
                            style={{
                              padding: '4px 8px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <RotateCcw size={12} /> Reinstate
                          </button>
                        )}

                        {/* Registration Slip */}
                        <button
                          type="button"
                          onClick={() => onViewSlip(u)}
                          title="View Official Registration Record"
                          style={{
                            padding: '4px 8px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <FileText size={12} /> Slip
                        </button>

                        {/* Progression Audit Logs */}
                        <button
                          type="button"
                          onClick={() => onViewHistory(u)}
                          title="View Academic Progression & Audit Log"
                          style={{
                            padding: '4px 8px',
                            background: '#f8fafc',
                            border: `1px solid ${C.slate2}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: C.slate6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <History size={12} /> Logs
                        </button>

                        {/* Edit Student */}
                        <button
                          type="button"
                          onClick={() => onEdit(u)}
                          title="Edit Student Information"
                          style={{
                            padding: '4px 8px',
                            background: C.slate1,
                            border: `1px solid ${C.slate2}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: C.slate7,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => onResetPassword(u)}
                          title="Reset Password"
                          style={{
                            padding: '4px 8px',
                            background: '#f8fafc',
                            border: `1px solid ${C.slate2}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: C.slate6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Key size={12} /> Key
                        </button>

                        {/* Toggle Account Status */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u)}
                          title={isActive ? 'Suspend Portal Access' : 'Activate Portal Access'}
                          style={{
                            padding: '4px 8px',
                            background: isActive ? '#fef2f2' : '#ecfdf5',
                            border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: isActive ? '#b91c1c' : '#047857',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>

                        {/* Archive / Restore / Purge */}
                        {isArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRestore(u)}
                              title="Restore Soft-Deleted Student"
                              style={{
                                padding: '4px 8px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#047857',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <RotateCcw size={12} /> Restore
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(u)}
                              title="Permanently Purge Student from DB"
                              style={{
                                padding: '4px 8px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Trash2 size={12} /> Purge
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDelete(u)}
                            title="Archive Student Record"
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              border: `1px solid ${C.slate2}`,
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Trash2 size={12} /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollableTable>
      )}
    </Card>
  );
};
