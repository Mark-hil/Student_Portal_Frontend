import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Search, Shield, Key, UserCheck, UserX,
  Edit2, X, Check, Loader2, Mail, Building, Camera, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';
import type { User } from '../../types';

export function UserManagement() {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [isUploadingUserAvatar, setIsUploadingUserAvatar] = useState(false);
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleAdminAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setIsUploadingUserAvatar(true);
    try {
      const res = await adminApi.uploadUserAvatar(editingUser.id, file);
      setEditingUser({ ...editingUser, avatar: res.data.avatar });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User profile photo updated to Cloudinary (uniportal-profile picture)!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingUserAvatar(false);
      if (adminAvatarInputRef.current) adminAvatarInputRef.current.value = '';
    }
  };

  const [newUser, setNewUser] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'student', department: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list', { search, roleFilter }],
    queryFn: () => adminApi.listUsers({ search, role: roleFilter }).then(r => r.data),
    staleTime: 30_000
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser(newUser),
    onSuccess: () => {
      toast.success('User created successfully!');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setIsCreateModalOpen(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'student', department: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create user.');
    }
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
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserStatus(id),
    onSuccess: (res) => {
      toast.success(`User account is now ${res.data.is_active ? 'Active' : 'Suspended'}`);
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to toggle account status.');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass?: string }) => adminApi.resetUserPassword(id, pass),
    onSuccess: (res) => {
      toast.success(res.data.detail || 'Password reset successfully!');
      setResetPasswordTarget(null);
      setCustomPassword('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to reset password.');
    }
  });

  const users = data?.results ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>
            User Directory & Access Control
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>
            Manage portal accounts, roles, departmental assignments, passwords, and active/suspension status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                setExporting(true);
                await adminApi.exportStudentsCsv({ role: roleFilter, search });
                toast.success('Student directory exported to CSV');
              } catch (err) {
                toast.error('Failed to export students CSV');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 18px',
              background: '#fff',
              color: C.indigo,
              border: `1px solid ${C.indigo}`,
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
            Export Student Directory (CSV)
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 20px',
              background: C.indigo,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Plus size={17} /> Add New User
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 260 }}>
          <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or institutional ID…"
            style={{ width: '100%', padding: '11px 16px 11px 40px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '11px 16px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: C.slate7, background: '#fff', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
        >
          <option value="">All Portal Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Faculty Instructors</option>
          <option value="staff">Staff Officers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : users.length === 0 ? (
          <Empty icon={Users} title="No users found" sub="Try adjusting your search or role filters." />
        ) : (
          <ScrollableTable minWidth={750}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.slate0 }}>
                  {['Name & Profile', 'Email Address', 'System Role', 'Department', 'Status', 'Account Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const isActive = u.is_active !== false;
                  return (
                    <tr key={u.id} style={{ borderTop: `1px solid ${C.slate1}` }}>
                      <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.indigoL, color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                            {u.avatar ? (
                              <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <div>{u.first_name} {u.last_name}</div>
                            {u.student_id && <div style={{ fontSize: 11, color: C.slate4 }}>ID: {u.student_id}</div>}
                          </div>
                          {u.role === 'admin' && <Shield size={14} color={C.rose} />}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.slate7 }}>{u.email}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <Badge label={u.role} color={u.role === 'student' ? C.slate1 : u.role === 'instructor' ? C.indigoL : C.roseL} text={u.role === 'student' ? C.slate7 : u.role === 'instructor' ? C.indigo : C.rose} />
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.slate6 }}>{u.department || '—'}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setEditingUser(u)}
                            title="Edit User Details"
                            style={{
                              padding: '5px 10px',
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
                          <button
                            onClick={() => {
                              if (window.confirm(`${isActive ? 'Suspend' : 'Activate'} user account for ${u.first_name} ${u.last_name}?`)) {
                                toggleStatusMutation.mutate(u.id);
                              }
                            }}
                            title={isActive ? 'Suspend Account' : 'Activate Account'}
                            style={{
                              padding: '5px 10px',
                              background: isActive ? '#fef2f2' : '#ecfdf5',
                              border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: isActive ? '#dc2626' : '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setResetPasswordTarget(u)}
                            title="Reset User Password"
                            style={{
                              padding: '5px 10px',
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
                            <Key size={13} /> Reset Pass
                          </button>
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

      {/* ── CREATE USER MODAL ────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 460, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>Create New User Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
                <input placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
                <input placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              <input type="email" placeholder="Institutional Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <input type="password" placeholder="Temporary Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <input placeholder="Department (e.g. Computer Science)" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.slate7 }}>Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} style={{ padding: '10px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{createMutation.isPending ? 'Creating...' : 'Create Account'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ──────────────────────────────────────── */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 460, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>Edit User Account</h3>
            <p style={{ margin: '4px 0 18px', fontSize: 13, color: C.slate5 }}>{editingUser.email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Profile Photo Uploader Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: C.slate0, borderRadius: 12, border: `1px solid ${C.slate2}` }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.indigoL, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.indigo, fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                  {editingUser.avatar ? (
                    <img src={editingUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    `${editingUser.first_name?.[0] || ''}${editingUser.last_name?.[0] || ''}`
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.slate9 }}>User Avatar</div>
                  <div style={{ fontSize: 11, color: C.slate5 }}>Folder: uniportal-profile picture</div>
                </div>
                <button
                  type="button"
                  onClick={() => adminAvatarInputRef.current?.click()}
                  disabled={isUploadingUserAvatar}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    background: '#fff',
                    border: `1px solid ${C.slate3}`,
                    cursor: isUploadingUserAvatar ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.indigo,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {isUploadingUserAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                  {isUploadingUserAvatar ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                  type="file"
                  ref={adminAvatarInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAdminAvatarUpload}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>First Name</label>
                  <input
                    value={editingUser.first_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Last Name</label>
                  <input
                    value={editingUser.last_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Department</label>
                <input
                  value={editingUser.department || ''}
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Role</label>
                <select
                  value={editingUser.role || 'student'}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, background: '#fff' }}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="staff">Staff Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditingUser(null)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}>Cancel</button>
              <button
                onClick={() => updateMutation.mutate({
                  id: editingUser.id,
                  payload: {
                    first_name: editingUser.first_name,
                    last_name: editingUser.last_name,
                    department: editingUser.department,
                    role: editingUser.role,
                  }
                })}
                disabled={updateMutation.isPending}
                style={{ padding: '9px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ─────────────────────────────────── */}
      {resetPasswordTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 26, width: 440, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.indigoL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={18} color={C.indigo} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>Reset Account Password</h3>
                <div style={{ fontSize: 12, color: C.slate5 }}>{resetPasswordTarget.email}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: C.slate7, lineHeight: 1.5, margin: '0 0 14px' }}>
              You can set an explicit temporary password or leave it blank to automatically reset it to <strong>Student@123</strong>.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>
                New Password (Optional)
              </label>
              <input
                type="text"
                value={customPassword}
                onChange={e => setCustomPassword(e.target.value)}
                placeholder="Leave blank for Student@123"
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => { setResetPasswordTarget(null); setCustomPassword(''); }} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}>Cancel</button>
              <button
                onClick={() => resetPasswordMutation.mutate({ id: resetPasswordTarget.id, pass: customPassword || undefined })}
                disabled={resetPasswordMutation.isPending}
                style={{ padding: '9px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
