import React from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Building,
  Key,
  Edit2,
  Trash2,
  RotateCcw,
  UserX,
  UserCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { C } from '../../../../utils/theme';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import { Empty } from '../../../../components/ui/Empty';
import { ScrollableTable } from '../../../../components/ui/Responsive';
import type { User } from '../../../../types';

export interface StaffTableProps {
  staff: User[];
  isLoading: boolean;
  currentUser?: User;
  onEdit: (user: User) => void;
  onAssignRole: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staff,
  isLoading,
  currentUser,
  onEdit,
  onAssignRole,
  onResetPassword,
  onToggleStatus,
  onDelete,
  onRestore,
}) => {
  const isActorSuperAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'super-admin' ||
    currentUser?.role === 'admin' ||
    (currentUser as any)?.is_superuser;

  const isTargetSuperAdmin = (targetUser: User) =>
    targetUser.role === 'super_admin' ||
    targetUser.role === 'super-admin' ||
    targetUser.role === 'admin' ||
    (targetUser as any)?.is_superuser;
  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case 'super-admin':
      case 'super_admin':
      case 'admin':
        return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3', label: 'Super Admin' };
      case 'academic-officer':
      case 'academic_officer':
      case 'staff':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: 'Academic Officer' };
      case 'departmental-head':
      case 'head_of_department':
      case 'head-of-department':
      case 'hod':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', label: 'Head of Department' };
      case 'finance-officer':
      case 'finance_officer':
      case 'finance':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Finance Officer' };
      case 'lecturer':
      case 'instructor':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Lecturer' };
      default:
        return { bg: C.slate1, text: C.slate7, border: C.slate2, label: role || 'Staff' };
    }
  };

  return (
    <Card style={{ overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : staff.length === 0 ? (
        <Empty
          icon={Users}
          title="No staff or faculty members found"
          sub="No records matched your search, role, or department filters."
        />
      ) : (
        <ScrollableTable minWidth={1000}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.slate0, borderBottom: `1px solid ${C.slate2}` }}>
                {[
                  'Staff Member Details',
                  'Institutional Role',
                  'Department / Faculty',
                  'Capabilities & RBAC',
                  'Account Status',
                  'Administrative Actions',
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
              {staff.map((u: User) => {
                const isActive = u.is_active !== false;
                const isArchived = Boolean(u.is_deleted);
                const roleCfg = getRoleBadgeConfig(u.role);
                const hasAssignedFunctions = u.assigned_functions && u.assigned_functions.length > 0;

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
                    {/* Staff Details */}
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: isArchived ? C.slate2 : '#e0e7ff',
                            color: isArchived ? C.slate6 : '#3730a3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 800,
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `1px solid ${isArchived ? C.slate3 : '#c7d2fe'}`,
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

                    {/* Institutional Role */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 6,
                            background: roleCfg.bg,
                            color: roleCfg.text,
                            border: `1px solid ${roleCfg.border}`,
                            width: 'fit-content',
                          }}
                        >
                          <Shield size={13} />
                          {roleCfg.label}
                        </span>
                        {u.is_superuser && (
                          <span style={{ fontSize: 10.5, color: '#be123c', fontWeight: 700 }}>
                            ★ Root Superuser
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Department / Faculty */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building size={14} color={C.slate4} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.slate7 }}>
                          {u.department || 'Academic Affairs / Central'}
                        </span>
                      </div>
                    </td>

                    {/* Capabilities & RBAC */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {hasAssignedFunctions ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: '#6b21a8',
                              background: '#faf5ff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #f3e8ff',
                              width: 'fit-content',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={`Custom assigned capabilities: ${(u.assigned_functions ?? []).join(', ')}`}
                          >
                            <ShieldCheck size={13} />
                            {(u.assigned_functions ?? []).length} Custom Capabilities
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: C.slate5,
                              background: '#f8fafc',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: `1px solid ${C.slate2}`,
                              width: 'fit-content',
                              fontWeight: 600,
                            }}
                          >
                            Standard Role Defaults
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
                            width: 'fit-content',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16a34a' : '#dc2626' }} />
                          {isActive ? 'Active Login' : 'Suspended'}
                        </span>
                        {u.email_verified && (
                          <span style={{ fontSize: 10.5, color: '#047857', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      {isTargetSuperAdmin(u) && !isActorSuperAdmin ? (
                        <div
                          style={{
                            padding: '6px 11px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                          title="Super Administrator credentials and privileges can only be viewed or modified by Super Administrators."
                        >
                          <Lock size={12} color="#94a3b8" /> Protected Executive
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {/* Assign Role & Functions */}
                          <button
                            type="button"
                            onClick={() => onAssignRole(u)}
                            title="Assign Institutional Role & Granular Permissions"
                            style={{
                              padding: '5px 10px',
                              background: '#f5f3ff',
                              border: '1px solid #ddd6fe',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <ShieldCheck size={13} /> Role & RBAC
                          </button>

                          {/* Edit Profile */}
                          <button
                            type="button"
                            onClick={() => onEdit(u)}
                            title="Edit Staff Member Details"
                            style={{
                              padding: '5px 9px',
                              background: C.slate1,
                              border: `1px solid ${C.slate2}`,
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: C.slate7,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => onResetPassword(u)}
                            title="Reset Password"
                            style={{
                              padding: '5px 9px',
                              background: '#f8fafc',
                              border: `1px solid ${C.slate2}`,
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: C.slate6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Key size={13} /> Key
                          </button>

                          {/* Toggle Account Status */}
                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => onToggleStatus(u)}
                              title={isActive ? 'Suspend Staff Access' : 'Activate Staff Access'}
                              style={{
                                padding: '5px 9px',
                                background: isActive ? '#fef2f2' : '#ecfdf5',
                                border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: isActive ? '#b91c1c' : '#047857',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                              {isActive ? 'Suspend' : 'Activate'}
                            </button>
                          )}

                          {/* Archive / Restore */}
                          {isArchived ? (
                            <button
                              type="button"
                              onClick={() => onRestore(u)}
                              title="Restore Staff Account"
                              style={{
                                padding: '5px 9px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#047857',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <RotateCcw size={13} /> Restore
                            </button>
                          ) : (
                            u.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => onDelete(u)}
                                title="Archive Staff Account"
                                style={{
                                  padding: '5px 9px',
                                  background: '#f8fafc',
                                  border: `1px solid ${C.slate2}`,
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Trash2 size={13} /> Archive
                              </button>
                            )
                          )}
                        </div>
                      )}
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
