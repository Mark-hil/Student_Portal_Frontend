import React from 'react';
import { Search } from 'lucide-react';
import { C } from '../../../../utils/theme';

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  programFilter: string;
  onProgramFilterChange: (value: string) => void;
  registrationFilter: string;
  onRegistrationFilterChange: (value: string) => void;
  academicStatusFilter: string;
  onAcademicStatusFilterChange: (value: string) => void;
  includeDeleted: boolean;
  onIncludeDeletedChange: (value: boolean) => void;
  isMobile?: boolean;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  programFilter,
  onProgramFilterChange,
  registrationFilter,
  onRegistrationFilterChange,
  academicStatusFilter,
  onAcademicStatusFilterChange,
  includeDeleted,
  onIncludeDeletedChange,
  isMobile,
}) => {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 260 }}>
        <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by name, email, student ID, or MOH PIN…"
          style={{
            width: '100%',
            padding: '11px 16px 11px 40px',
            border: `1px solid ${C.slate2}`,
            borderRadius: 12,
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <select
        value={roleFilter}
        onChange={e => onRoleFilterChange(e.target.value)}
        style={{
          padding: '11px 16px',
          border: `1px solid ${C.slate2}`,
          borderRadius: 12,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          color: C.slate7,
          background: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        <option value="">All Portal Roles</option>
        <option value="student">Students</option>
        <option value="instructor">Faculty Instructors</option>
        <option value="staff">Staff Officers</option>
        <option value="admin">Administrators</option>
      </select>

      <select
        value={programFilter}
        onChange={e => onProgramFilterChange(e.target.value)}
        style={{
          padding: '11px 16px',
          border: `1px solid ${C.slate2}`,
          borderRadius: 12,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          color: C.slate7,
          background: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        <option value="">All Programs</option>
        <option value="nursing">Nursing (NUR)</option>
        <option value="midwifery">Midwifery (MID)</option>
      </select>

      <select
        value={registrationFilter}
        onChange={e => onRegistrationFilterChange(e.target.value)}
        style={{
          padding: '11px 16px',
          border: `1px solid ${C.slate2}`,
          borderRadius: 12,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          color: C.slate7,
          background: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        <option value="">All Activation States</option>
        <option value="true">Registered / Activated</option>
        <option value="false">Pending Activation</option>
      </select>

      <select
        value={academicStatusFilter}
        onChange={e => onAcademicStatusFilterChange(e.target.value)}
        style={{
          padding: '11px 16px',
          border: `1px solid ${C.slate2}`,
          borderRadius: 12,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          color: C.slate7,
          background: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        <option value="">All Academic Statuses</option>
        <option value="active">Active (Good Standing)</option>
        <option value="probation">Academic Probation</option>
        <option value="repeating">Repeating / Retained</option>
        <option value="withdrawn">Withdrawn</option>
        <option value="graduated">Graduated (Alumni)</option>
        <option value="suspended">Suspended</option>
        <option value="deleted">Archived / Deleted</option>
      </select>

      <label style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: includeDeleted ? '#f1f5f9' : '#fff',
        border: `1px solid ${includeDeleted ? C.slate4 : C.slate2}`,
        borderRadius: 12,
        fontSize: 13.5,
        fontWeight: 600,
        color: C.slate7,
        cursor: 'pointer',
        userSelect: 'none'
      }}>
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={e => onIncludeDeletedChange(e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.indigo }}
        />
        Include Archived
      </label>
    </div>
  );
};
