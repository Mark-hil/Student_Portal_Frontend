import React from 'react';
import {
  Users,
  Shield,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  UserMinus,
  RotateCcw,
  History,
  Trash2,
  FileText,
  Edit2,
  UserX,
  UserCheck,
  Key,
  Mail,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../../../api/services';
import { C } from '../../../../utils/theme';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import { Badge } from '../../../../components/ui/Badge';
import { Empty } from '../../../../components/ui/Empty';
import { ScrollableTable } from '../../../../components/ui/Responsive';
import { UserStatusBadge } from './UserStatusBadge';
import type { User, AcademicStatus } from '../../../../types';

interface UserTableProps {
  users: User[];
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
  onAssignRole?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
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
  onAssignRole,
}) => {
  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case 'super-admin':
      case 'admin':
        return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3', label: 'Super Admin' };
      case 'academic-officer':
      case 'staff':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: 'Academic Officer' };
      case 'departmental-head':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', label: 'Dept Head' };
      case 'lecturer':
      case 'instructor':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Lecturer' };
      case 'finance-officer':
      case 'finance':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: 'Finance Officer' };
      case 'student':
      default:
        return { bg: C.slate1, text: C.slate7, border: C.slate2, label: 'Student' };
    }
  };

  const activeStudents = users.filter((u: User) => u.role === 'student' && !u.is_deleted);
  const allActiveSelected =
    activeStudents.length > 0 &&
    activeStudents.every((u: User) => selectedStudentIds.includes(u.id));

  return (
    <Card style={{ overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <Empty
          icon={Users}
          title="No users found"
          sub="Try adjusting your search, role, or status filters."
        />
      ) : (
        <ScrollableTable minWidth={950}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.slate0 }}>
                <th style={{ width: 42, padding: '12px 14px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allActiveSelected}
                    onChange={(e) => onSelectAllStudents(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.indigo }}
                    title="Select all active students"
                  />
                </th>
                {[
                  'Student / User',
                  'Institutional ID & PIN',
                  'Program & Class',
                  'Academic Status',
                  'System Role & State',
                  'Lifecycle Actions',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.slate5,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => {
                const isActive = u.is_active !== false;
                const isArchived = Boolean(u.is_deleted);
                const isNursing =
                  u.program === 'nursing' || u.department?.toLowerCase()?.includes('nurs');
                const isMidwifery =
                  u.program === 'midwifery' || u.department?.toLowerCase()?.includes('midwi');
                const isRegistered = u.is_registered !== false;
                const isStudent = u.role === 'student';
                const acadStatus: AcademicStatus = ((u.academic_status || 'active').toLowerCase() as AcademicStatus);

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderTop: `1px solid ${C.slate1}`,
                      background: isArchived ? '#f8fafc' : undefined,
                      opacity: isArchived ? 0.85 : 1,
                    }}
                  >
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      {isStudent && !isArchived && (
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(u.id)}
                          onChange={(e) => onSelectStudent(u.id, e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.indigo }}
                        />
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isArchived ? C.slate2 : C.indigoL,
                            color: isArchived ? C.slate6 : C.indigo,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            overflow: 'hidden',
                            flexShrink: 0,
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
                        </div>
                        {u.role === 'admin' && <Shield size={14} color={C.rose} />}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {u.student_id ? (
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '2px 7px',
                              borderRadius: 5,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            {u.student_id}
                          </span>
                          {u.moh_pin && (
                            <div style={{ fontSize: 11, color: C.slate5, marginTop: 3 }}>
                              PIN: <strong style={{ color: C.slate7 }}>{u.moh_pin}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: C.slate4, fontSize: 13 }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isNursing || isMidwifery ? (
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background: isNursing ? '#ecfdf5' : '#faf5ff',
                              color: isNursing ? '#047857' : '#7e22ce',
                              border: isNursing ? '1px solid #a7f3d0' : '1px solid #e9d5ff',
                            }}
                          >
                            <HeartPulse size={12} />
                            {isNursing ? 'Nursing' : 'Midwifery'}
                          </span>
                          <div style={{ fontSize: 11, color: C.slate5, marginTop: 2 }}>
                            Level {u.class_name || '100'} {u.admission_year ? `(${u.admission_year})` : ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: C.slate6 }}>{u.department || 'General'}</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isStudent ? (
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
                      ) : (
                        <span style={{ fontSize: 12, color: C.slate4 }}>N/A (Staff/Faculty)</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {(() => {
                        const roleCfg = getRoleBadgeConfig(u.role);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: roleCfg.bg,
                                color: roleCfg.text,
                                border: `1px solid ${roleCfg.border}`,
                                width: 'fit-content',
                              }}
                            >
                              {roleCfg.label}
                            </span>
                            {u.assigned_functions && u.assigned_functions.length > 0 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#6b21a8',
                                  background: '#faf5ff',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  border: '1px solid #f3e8ff',
                                  width: 'fit-content',
                                  fontWeight: 600,
                                }}
                                title={`Assigned functions: ${u.assigned_functions.join(', ')}`}
                              >
                                {u.assigned_functions.length} custom fns
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: isActive ? '#dcfce7' : '#fee2e2',
                                  color: isActive ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {isActive ? 'Active Login' : 'Suspended'}
                              </span>
                              {isStudent && (
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: isRegistered ? '#15803d' : '#b45309',
                                    background: isRegistered ? '#dcfce7' : '#fef3c7',
                                    border: isRegistered ? '1px solid #bbf7d0' : '1px solid #fde68a',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {isRegistered ? 'Reg' : 'Pending'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {/* Student Academic Lifecycle Actions */}
                        {isStudent && !isArchived && acadStatus !== 'graduated' && acadStatus !== 'withdrawn' && (
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

                        {isStudent && !isArchived && acadStatus === 'withdrawn' && (
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

                        {isStudent && (
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
                        )}

                        {isArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRestore(u)}
                              title="Restore Soft-Deleted Account"
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
                            title="Archive or Delete Account"
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
                            <Trash2 size={12} /> Delete
                          </button>
                        )}

                        {/* Registration Slip Action */}
                        {isStudent && (
                          <button
                            type="button"
                            onClick={() => onViewSlip(u)}
                            title="View Official Registration Record (info.txt)"
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
                        )}

                        {onAssignRole && (
                          <button
                            type="button"
                            onClick={() => onAssignRole(u)}
                            title="Assign Institutional Role & Functions"
                            style={{
                              padding: '4px 8px',
                              background: '#f5f3ff',
                              border: '1px solid #ddd6fe',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <ShieldCheck size={12} /> Role
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEdit(u)}
                          title="Edit User Details"
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

                        <button
                          type="button"
                          onClick={() => onToggleStatus(u)}
                          title={isActive ? 'Suspend Account' : 'Activate Account'}
                          style={{
                            padding: '4px 8px',
                            background: isActive ? '#fef2f2' : '#ecfdf5',
                            border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: isActive ? '#dc2626' : '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onResetPassword(u)}
                          title="Reset User Password"
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
                          <Key size={12} />
                        </button>

                        {isStudent && !isRegistered && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                toast.loading('Dispatching SMS & Email...', { id: 'resend' });
                                await adminApi.resendCredentials(u.id);
                                toast.success(`Welcome SMS & Email sent to ${u.email}`, { id: 'resend' });
                              } catch {
                                toast.error('Failed to send credentials.', { id: 'resend' });
                              }
                            }}
                            title="Resend Welcome SMS & Email"
                            style={{
                              padding: '4px 8px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Mail size={12} />
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
