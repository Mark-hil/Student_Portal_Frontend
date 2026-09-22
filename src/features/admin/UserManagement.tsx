import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  Download,
  Plus,
  Loader2,
  GraduationCap,
  Users,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { User, AcademicProgressionLog, DeletionPrecheckResult } from '../../types';

import { UserFilters } from './user-management/components/UserFilters';
import { BulkActionBar } from './user-management/components/BulkActionBar';
import { UserTable } from './user-management/components/UserTable';

import { CreateUserModal } from './user-management/modals/CreateUserModal';
import { EditUserModal } from './user-management/modals/EditUserModal';
import { ResetPasswordModal } from './user-management/modals/ResetPasswordModal';
import { MOHUploadModal } from './user-management/modals/MOHUploadModal';
import { StudentRegistrationModal } from './user-management/modals/StudentRegistrationModal';
import { PromoteStudentModal } from './user-management/modals/PromoteStudentModal';
import { DemoteStudentModal } from './user-management/modals/DemoteStudentModal';
import { WithdrawStudentModal } from './user-management/modals/WithdrawStudentModal';
import { ReinstateStudentModal } from './user-management/modals/ReinstateStudentModal';
import { ProgressionHistoryModal } from './user-management/modals/ProgressionHistoryModal';
import { DeleteUserModal } from './user-management/modals/DeleteUserModal';
import { BulkPromoteModal } from './user-management/modals/BulkPromoteModal';
import { AssignRoleAndFunctionsModal } from './user-management/modals/AssignRoleAndFunctionsModal';

export interface UserManagementProps {
  initialMode?: 'students' | 'staff';
  user?: User;
}

export function UserManagement({ initialMode = 'students', user }: UserManagementProps) {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();

  // Active Mode: Students vs Staff & Faculty
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [academicStatusFilter, setAcademicStatusFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Bulk Selection State (for students)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  // Modals Open/Target State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<User | null>(null);
  const [isMOHModalOpen, setIsMOHModalOpen] = useState(false);
  const [viewingStudentRegistration, setViewingStudentRegistration] = useState<User | null>(null);

  // Academic Lifecycle Progression Modal State
  const [promoteTarget, setPromoteTarget] = useState<User | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<User | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<User | null>(null);
  const [reinstateTarget, setReinstateTarget] = useState<User | null>(null);
  const [isBulkPromoteOpen, setIsBulkPromoteOpen] = useState(false);

  // Audit & Deletion State
  const [historyTarget, setHistoryTarget] = useState<User | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AcademicProgressionLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletionPrecheckData, setDeletionPrecheckData] = useState<DeletionPrecheckResult | null>(null);
  const [isLoadingPrecheck, setIsLoadingPrecheck] = useState(false);

  // Departmental Head Context
  const isHod =
    user?.role === 'head_of_department' ||
    user?.role === 'head-of-department' ||
    user?.role === 'departmental-head' ||
    user?.role === 'hod';
  const hodDepartment = isHod ? user?.department || '' : '';

  // Roles & Functions Catalog
  const { data: rolesAndFunctionsData } = useQuery({
    queryKey: ['portal-roles-and-functions'],
    queryFn: () => adminApi.getRolesAndFunctions().then((r: { data: { roles: any[]; functions: any[] } }) => r.data),
    staleTime: 5 * 60_000,
  });

  // User List Query filtered strictly by activeTab ('student' vs 'staff')
  const { data, isLoading } = useQuery({
    queryKey: [
      'users',
      'list',
      {
        user_type: activeTab === 'students' ? 'student' : 'staff',
        search,
        role: roleFilter,
        program: activeTab === 'students' ? programFilter : '',
        class_name: activeTab === 'students' ? classFilter : '',
        department: activeTab === 'staff' ? (departmentFilter || hodDepartment) : departmentFilter,
        registration: activeTab === 'students' ? registrationFilter : '',
        academicStatus: activeTab === 'students' ? academicStatusFilter : '',
        includeDeleted,
      },
    ],
    queryFn: () =>
      adminApi
        .listUsers({
          user_type: activeTab === 'students' ? 'student' : 'staff',
          search,
          role: roleFilter,
          program: activeTab === 'students' ? programFilter : '',
          class_name: activeTab === 'students' ? classFilter : '',
          department: activeTab === 'staff' ? (departmentFilter || hodDepartment) : departmentFilter,
          is_registered: activeTab === 'students' ? registrationFilter : '',
          academic_status: activeTab === 'students' ? academicStatusFilter : '',
          include_deleted: includeDeleted ? 'true' : 'false',
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const users: User[] = data?.results ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newUser: any) => adminApi.createUser(newUser),
    onSuccess: () => {
      toast.success(
        activeTab === 'students'
          ? 'Student account created successfully! Credentials dispatched.'
          : 'Staff member account registered successfully!'
      );
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create user account.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('User updated successfully!');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update user.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserStatus(id),
    onSuccess: (res: any) => {
      const active = res.data?.is_active ?? true;
      toast.success(`Account ${active ? 'activated' : 'suspended'} successfully.`);
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update status.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass?: string }) => adminApi.resetUserPassword(id, pass),
    onSuccess: () => {
      toast.success('Password reset successfully!');
      setResetPasswordTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to reset password.');
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ id, academic_year, notes }: { id: string; academic_year?: string; notes?: string }) =>
      adminApi.promoteStudent(id, { academic_year, notes }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Student promoted successfully!');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setPromoteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to promote student.');
    },
  });

  const demoteMutation = useMutation({
    mutationFn: ({ id, target_level, reason }: { id: string; target_level?: string; reason?: string }) =>
      adminApi.demoteStudent(id, { target_level: target_level || '100', reason: reason || 'Academic review' }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Student level adjusted.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setDemoteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to demote student.');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason, category }: { id: string; reason: string; category?: string }) =>
      adminApi.withdrawStudent(id, { reason, withdrawal_category: category }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Student marked as officially withdrawn.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setWithdrawTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to withdraw student.');
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: ({ id, target_level, notes }: { id: string; target_level?: string; notes?: string }) =>
      adminApi.reinstateStudent(id, { target_level: target_level || '100', notes }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Student reinstated to active standing.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setReinstateTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to reinstate student.');
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.softDeleteUser(id, reason),
    onSuccess: (res) => {
      toast.success(res.data.message || 'User archived to trash.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to archive user.');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreUser(id),
    onSuccess: (res) => {
      toast.success(res.data.message || 'User account restored.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to restore user.');
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: ({ id, force, reason }: { id: string; force?: boolean; reason?: string }) =>
      adminApi.permanentDeleteUser(id, force, reason),
    onSuccess: (res) => {
      toast.success(res.data.message || 'User permanently purged from database.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to delete user permanently.');
    },
  });

  const bulkPromoteMutation = useMutation({
    mutationFn: ({ student_ids, academic_year, notes }: { student_ids: string[]; academic_year?: string; notes?: string }) =>
      adminApi.bulkPromote({ student_ids, academic_year, notes }),
    onSuccess: (res) => {
      const { succeeded, failed } = res.data;
      if (failed.length === 0) {
        toast.success(`Successfully promoted all ${succeeded.length} student(s)!`);
      } else {
        toast(`Promoted ${succeeded.length} students. ${failed.length} failed.`, { icon: '⚠️' });
      }
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setSelectedStudentIds([]);
      setIsBulkPromoteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Bulk promotion failed.');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: any; assigned_functions?: string[] } }) =>
      adminApi.assignRoleAndFunctions(id, payload),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Role and capabilities updated successfully!');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setAssignRoleTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to assign role & functions.');
    },
  });

  // Action Handlers
  const handleOpenHistory = async (u: User) => {
    setHistoryTarget(u);
    setIsLoadingHistory(true);
    try {
      const res = await adminApi.getProgressionHistory(u.id);
      setHistoryLogs(res.data || []);
    } catch {
      toast.error('Failed to load progression history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenDelete = async (u: User) => {
    setDeleteTarget(u);
    setDeletionPrecheckData(null);
    setIsLoadingPrecheck(true);
    try {
      const res = await adminApi.deletionPrecheck(u.id);
      setDeletionPrecheckData(res.data);
    } catch {
      // precheck optional or fail gracefully
    } finally {
      setIsLoadingPrecheck(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await adminApi.exportStudentsCsv({
        user_type: activeTab === 'students' ? 'student' : 'staff',
        role: roleFilter,
        search,
        department: activeTab === 'staff' ? (departmentFilter || hodDepartment) : departmentFilter,
      });
      toast.success(
        activeTab === 'students'
          ? 'Student directory exported to CSV'
          : 'Staff directory exported to CSV'
      );
    } catch {
      toast.error('Failed to export CSV directory.');
    } finally {
      setExporting(false);
    }
  };

  const isStudentTab = activeTab === 'students';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      {/* Top Tab Bar: Clean Separation between Students & Staff */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: `1px solid ${C.slate2}`,
          paddingBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 14,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('students');
              setSelectedStudentIds([]);
              setRoleFilter('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: isStudentTab ? '#fff' : 'transparent',
              color: isStudentTab ? '#047857' : C.slate6,
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: isStudentTab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <GraduationCap size={18} />
            Students & Admissions
            {isStudentTab && !isLoading && (
              <span
                style={{
                  fontSize: 11,
                  background: '#ecfdf5',
                  color: '#047857',
                  padding: '1px 7px',
                  borderRadius: 999,
                  border: '1px solid #a7f3d0',
                }}
              >
                {users.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setSelectedStudentIds([]);
              setRoleFilter('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: !isStudentTab ? '#fff' : 'transparent',
              color: !isStudentTab ? C.indigo : C.slate6,
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: !isStudentTab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={18} />
            Staff & Faculty Directory
            {!isStudentTab && !isLoading && (
              <span
                style={{
                  fontSize: 11,
                  background: '#e0e7ff',
                  color: '#3730a3',
                  padding: '1px 7px',
                  borderRadius: 999,
                  border: '1px solid #c7d2fe',
                }}
              >
                {users.length}
              </span>
            )}
          </button>
        </div>

        {/* HOD Department Badge if logged in as HOD */}
        {isHod && hodDepartment && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: 10,
              fontSize: 12.5,
              color: '#7e22ce',
              fontWeight: 700,
            }}
          >
            <Building size={14} />
            Department of {hodDepartment}
          </div>
        )}
      </div>

      {/* Header Bar with Action Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 14,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? 22 : 24,
              fontWeight: 800,
              color: C.slate9,
              letterSpacing: '-0.02em',
            }}
          >
            {isStudentTab ? 'Student Directory & Admissions' : 'Staff & Faculty Access Control'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>
            {isStudentTab
              ? 'Manage enrolled nursing & midwifery students, MOH roster onboarding, academic standing, and progression.'
              : 'Oversee lecturers, departmental heads, academic officers, finance team, and granular RBAC permissions.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* MOH Upload Button (Students Mode Only) */}
          {isStudentTab && (
            <button
              type="button"
              onClick={() => setIsMOHModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 18px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <UploadCloud size={17} /> Upload MOH Students
            </button>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 18px',
              background: '#fff',
              color: isStudentTab ? '#059669' : C.indigo,
              border: `1px solid ${isStudentTab ? '#a7f3d0' : C.indigo}`,
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {exporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
            {isStudentTab ? 'Export Students (CSV)' : 'Export Staff (CSV)'}
          </button>

          {/* Add User Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 20px',
              background: isStudentTab ? '#047857' : C.indigo,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isStudentTab ? '0 4px 12px rgba(4,120,87,0.3)' : '0 4px 12px rgba(79,70,229,0.3)',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Plus size={17} /> {isStudentTab ? 'Register Student' : 'Add Staff Member'}
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <UserFilters
        mode={activeTab}
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        programFilter={programFilter}
        onProgramFilterChange={setProgramFilter}
        classFilter={classFilter}
        onClassFilterChange={setClassFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        registrationFilter={registrationFilter}
        onRegistrationFilterChange={setRegistrationFilter}
        academicStatusFilter={academicStatusFilter}
        onAcademicStatusFilterChange={setAcademicStatusFilter}
        includeDeleted={includeDeleted}
        onIncludeDeletedChange={setIncludeDeleted}
        isMobile={isMobile}
      />

      {/* Bulk Action Controls (Students Only) */}
      {isStudentTab && (
        <BulkActionBar
          selectedCount={selectedStudentIds.length}
          onBulkPromote={() => setIsBulkPromoteOpen(true)}
          onClearSelection={() => setSelectedStudentIds([])}
        />
      )}

      {/* Main Users Table cleanly separated by mode */}
      <UserTable
        mode={activeTab}
        users={users}
        currentUser={user}
        isLoading={isLoading}
        selectedStudentIds={selectedStudentIds}
        onSelectStudent={(id, selected) => {
          if (selected) {
            setSelectedStudentIds((prev) => [...prev, id]);
          } else {
            setSelectedStudentIds((prev) => prev.filter((item) => item !== id));
          }
        }}
        onSelectAllStudents={(selectAll) => {
          const activeStudents = users.filter((u: User) => !u.is_deleted);
          if (selectAll) {
            const idsToAdd = activeStudents.map((u: User) => u.id);
            setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...idsToAdd])));
          } else {
            const activeIds = new Set(activeStudents.map((u: User) => u.id));
            setSelectedStudentIds((prev) => prev.filter((id) => !activeIds.has(id)));
          }
        }}
        onPromote={(u) => setPromoteTarget(u)}
        onDemote={(u) => setDemoteTarget(u)}
        onWithdraw={(u) => setWithdrawTarget(u)}
        onReinstate={(u) => setReinstateTarget(u)}
        onViewHistory={handleOpenHistory}
        onDelete={handleOpenDelete}
        onRestore={(u) => {
          if (window.confirm(`Restore account for ${u.first_name} ${u.last_name}?`)) {
            restoreMutation.mutate(u.id);
          }
        }}
        onViewSlip={(u) => setViewingStudentRegistration(u)}
        onEdit={(u) => setEditingUser(u)}
        onToggleStatus={(u) => {
          const isActive = u.is_active !== false;
          if (
            window.confirm(
              `${isActive ? 'Suspend' : 'Activate'} user account for ${u.first_name} ${u.last_name}?`
            )
          ) {
            toggleStatusMutation.mutate(u.id);
          }
        }}
        onResetPassword={(u) => setResetPasswordTarget(u)}
        onAssignRole={(u) => setAssignRoleTarget(u)}
      />

      {/* ── MODALS ── */}

      {/* Create User Modal (students vs staff) */}
      <CreateUserModal
        mode={activeTab}
        isOpen={isCreateModalOpen}
        currentUser={user}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(userData) => createMutation.mutate(userData)}
        isPending={createMutation.isPending}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          currentUser={user}
          onClose={() => setEditingUser(null)}
          onSave={(payload) => updateMutation.mutate({ id: editingUser.id, payload })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordTarget && (
        <ResetPasswordModal
          target={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onConfirm={(customPass) =>
            resetPasswordMutation.mutate({ id: resetPasswordTarget.id, pass: customPass })
          }
          isPending={resetPasswordMutation.isPending}
        />
      )}

      {/* MOH Student Roster Modal */}
      <MOHUploadModal isOpen={isMOHModalOpen} onClose={() => setIsMOHModalOpen(false)} />

      {/* Student Official Registration Record Modal (info.txt) */}
      <StudentRegistrationModal
        user={viewingStudentRegistration}
        onClose={() => setViewingStudentRegistration(null)}
      />

      {/* Promote Student Modal */}
      {promoteTarget && (
        <PromoteStudentModal
          target={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onConfirm={({ academic_year, notes }) =>
            promoteMutation.mutate({ id: promoteTarget.id, academic_year, notes })
          }
          isPending={promoteMutation.isPending}
        />
      )}

      {/* Demote Student Modal */}
      {demoteTarget && (
        <DemoteStudentModal
          target={demoteTarget}
          onClose={() => setDemoteTarget(null)}
          onConfirm={({ target_level, reason }) =>
            demoteMutation.mutate({ id: demoteTarget.id, target_level, reason })
          }
          isPending={demoteMutation.isPending}
        />
      )}

      {/* Withdraw Student Modal */}
      {withdrawTarget && (
        <WithdrawStudentModal
          target={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onConfirm={({ reason, category }) =>
            withdrawMutation.mutate({ id: withdrawTarget.id, reason, category })
          }
          isPending={withdrawMutation.isPending}
        />
      )}

      {/* Reinstate Student Modal */}
      {reinstateTarget && (
        <ReinstateStudentModal
          target={reinstateTarget}
          onClose={() => setReinstateTarget(null)}
          onConfirm={({ target_level, notes }) =>
            reinstateMutation.mutate({ id: reinstateTarget.id, target_level, notes })
          }
          isPending={reinstateMutation.isPending}
        />
      )}

      {/* Progression History Audit Modal */}
      {historyTarget && (
        <ProgressionHistoryModal
          target={historyTarget}
          logs={historyLogs}
          isLoading={isLoadingHistory}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Soft Archive / Hard Purge Modal */}
      {deleteTarget && (
        <DeleteUserModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSoftDelete={(reason) => softDeleteMutation.mutate({ id: deleteTarget.id, reason })}
          isSoftDeleting={softDeleteMutation.isPending}
          onHardDelete={(force, reason) =>
            hardDeleteMutation.mutate({ id: deleteTarget.id, force, reason })
          }
          isHardDeleting={hardDeleteMutation.isPending}
          precheckData={deletionPrecheckData}
          isLoadingPrecheck={isLoadingPrecheck}
        />
      )}

      {/* Bulk Cohort Promote Modal */}
      {isBulkPromoteOpen && (
        <BulkPromoteModal
          selectedCount={selectedStudentIds.length}
          onClose={() => setIsBulkPromoteOpen(false)}
          onConfirm={({ academic_year, notes }) =>
            bulkPromoteMutation.mutate({
              student_ids: selectedStudentIds,
              academic_year,
              notes,
            })
          }
          isPending={bulkPromoteMutation.isPending}
        />
      )}

      {/* Assign Institutional Role & Functions Modal */}
      {assignRoleTarget && (
        <AssignRoleAndFunctionsModal
          target={assignRoleTarget}
          roles={rolesAndFunctionsData?.roles || []}
          functions={rolesAndFunctionsData?.functions || []}
          currentUser={user}
          onClose={() => setAssignRoleTarget(null)}
          onConfirm={({ role, assigned_functions }) =>
            assignRoleMutation.mutate({
              id: assignRoleTarget.id,
              payload: { role, assigned_functions },
            })
          }
          isPending={assignRoleMutation.isPending}
        />
      )}
    </div>
  );
}
