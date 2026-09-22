import React from 'react';
import { StudentTable } from './StudentTable';
import { StaffTable } from './StaffTable';
import type { User } from '../../../../types';

export interface UserTableProps {
  mode?: 'students' | 'staff';
  users: User[];
  isLoading: boolean;
  selectedStudentIds?: string[];
  onSelectStudent?: (id: string, selected: boolean) => void;
  onSelectAllStudents?: (selected: boolean) => void;
  onPromote?: (user: User) => void;
  onDemote?: (user: User) => void;
  onWithdraw?: (user: User) => void;
  onReinstate?: (user: User) => void;
  onViewHistory?: (user: User) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
  currentUser?: User;
  onViewSlip?: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
  onAssignRole?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  mode = 'students',
  users,
  isLoading,
  currentUser,
  selectedStudentIds = [],
  onSelectStudent = () => {},
  onSelectAllStudents = () => {},
  onPromote = () => {},
  onDemote = () => {},
  onWithdraw = () => {},
  onReinstate = () => {},
  onViewHistory = () => {},
  onDelete,
  onRestore,
  onViewSlip = () => {},
  onEdit,
  onToggleStatus,
  onResetPassword,
  onAssignRole = () => {},
}) => {
  if (mode === 'staff') {
    return (
      <StaffTable
        staff={users}
        isLoading={isLoading}
        currentUser={currentUser}
        onEdit={onEdit}
        onAssignRole={onAssignRole}
        onResetPassword={onResetPassword}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        onRestore={onRestore}
      />
    );
  }

  return (
    <StudentTable
      students={users}
      isLoading={isLoading}
      selectedStudentIds={selectedStudentIds}
      onSelectStudent={onSelectStudent}
      onSelectAllStudents={onSelectAllStudents}
      onPromote={onPromote}
      onDemote={onDemote}
      onWithdraw={onWithdraw}
      onReinstate={onReinstate}
      onViewHistory={onViewHistory}
      onDelete={onDelete}
      onRestore={onRestore}
      onViewSlip={onViewSlip}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      onResetPassword={onResetPassword}
    />
  );
};
