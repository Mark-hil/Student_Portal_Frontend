import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Search, Shield, Key, UserCheck, UserX,
  Edit2, X, Check, Loader2, Mail, Building, Camera, Download,
  UploadCloud, FileSpreadsheet, HeartPulse, Sparkles, CheckCircle2,
  AlertTriangle, FileText, Phone, Award
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
import type { User, MOHUploadResult } from '../../types';

export function UserManagement() {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [isUploadingUserAvatar, setIsUploadingUserAvatar] = useState(false);
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);

  // MOH Roster Upload State
  const [isMOHModalOpen, setIsMOHModalOpen] = useState(false);
  const [mohFile, setMohFile] = useState<File | null>(null);
  const [defaultProgram, setDefaultProgram] = useState<'nursing' | 'midwifery' | ''>('');
  const [defaultClass, setDefaultClass] = useState('100');
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear().toString());
  const [isDryRun, setIsDryRun] = useState(false);
  const [mohUploadResult, setMohUploadResult] = useState<MOHUploadResult | null>(null);
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [viewingStudentRegistration, setViewingStudentRegistration] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
    program: 'nursing',
    class_name: '100',
    department: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list', { search, roleFilter, programFilter, registrationFilter }],
    queryFn: () => adminApi.listUsers({
      search,
      role: roleFilter,
      program: programFilter,
      is_registered: registrationFilter,
    }).then(r => r.data),
    staleTime: 30_000
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser(newUser),
    onSuccess: () => {
      toast.success('User account created successfully! Credentials dispatched.');
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setIsCreateModalOpen(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'student',
        program: 'nursing',
        class_name: '100',
        department: '',
      });
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

  const handleUploadRoster = async () => {
    if (!mohFile) {
      toast.error('Please select an MOH roster CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', mohFile);
    if (defaultProgram) formData.append('default_program', defaultProgram);
    if (defaultClass) formData.append('default_class', defaultClass);
    if (defaultYear) formData.append('default_year', defaultYear);
    if (isDryRun) formData.append('dry_run', 'true');

    setIsUploadingRoster(true);
    try {
      const res = await adminApi.uploadMOHRoster(formData);
      setMohUploadResult(res.data);
      if (!isDryRun) {
        qc.invalidateQueries({ queryKey: ['users'] });
        toast.success(`Successfully provisioned ${res.data.imported_count} student(s) with official ASDAM IDs!`);
      } else {
        toast.success(`Dry run complete: ${res.data.imported_count} valid records checked.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process student roster.');
    } finally {
      setIsUploadingRoster(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await adminApi.downloadMOHTemplate();
      toast.success('Downloaded MOH student template CSV');
    } catch (err) {
      toast.error('Failed to download CSV template');
    }
  };

  const users = data?.results ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>
            User Directory & Access Control
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>
            Manage portal accounts, roles, MOH student onboarding, passwords, and active/suspension status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* MOH Upload Button */}
          <button
            onClick={() => { setIsMOHModalOpen(true); setMohUploadResult(null); setMohFile(null); }}
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
            Export Directory (CSV)
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
            placeholder="Search by name, email, student ID, or MOH PIN…"
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

        <select
          value={programFilter}
          onChange={e => setProgramFilter(e.target.value)}
          style={{ padding: '11px 16px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: C.slate7, background: '#fff', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
        >
          <option value="">All Programs</option>
          <option value="nursing">Nursing (NUR)</option>
          <option value="midwifery">Midwifery (MID)</option>
        </select>

        <select
          value={registrationFilter}
          onChange={e => setRegistrationFilter(e.target.value)}
          style={{ padding: '11px 16px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: C.slate7, background: '#fff', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
        >
          <option value="">All Account Statuses</option>
          <option value="true">Registered / Activated</option>
          <option value="false">Pending Activation</option>
        </select>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : users.length === 0 ? (
          <Empty icon={Users} title="No users found" sub="Try adjusting your search or role filters." />
        ) : (
          <ScrollableTable minWidth={850}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.slate0 }}>
                  {['Student / User', 'Institutional ID & MOH PIN', 'Program & Class', 'System Role', 'Status', 'Account Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const isActive = u.is_active !== false;
                  const isNursing = u.program === 'nursing' || u.department?.toLowerCase()?.includes('nurs');
                  const isMidwifery = u.program === 'midwifery' || u.department?.toLowerCase()?.includes('midwi');
                  const isRegistered = u.is_registered !== false;

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
                            <div style={{ fontSize: 12, color: C.slate5, fontWeight: 400 }}>{u.email}</div>
                          </div>
                          {u.role === 'admin' && <Shield size={14} color={C.rose} />}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {u.student_id ? (
                          <div>
                            <span style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '2px 7px',
                              borderRadius: 5,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1'
                            }}>
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

                      <td style={{ padding: '14px 18px' }}>
                        {isNursing || isMidwifery ? (
                          <div>
                            <span style={{
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
                            }}>
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

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Badge label={u.role} color={u.role === 'student' ? C.slate1 : u.role === 'instructor' ? C.indigoL : C.roseL} text={u.role === 'student' ? C.slate7 : u.role === 'instructor' ? C.indigo : C.rose} />
                          {u.role === 'student' && (
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: isRegistered ? '#15803d' : '#b45309',
                              background: isRegistered ? '#dcfce7' : '#fef3c7',
                              border: isRegistered ? '1px solid #bbf7d0' : '1px solid #fde68a',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              {isRegistered ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                              {isRegistered ? 'Registered' : 'Pending Profile Reg'}
                            </span>
                          )}
                        </div>
                      </td>

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {u.role === 'student' && (
                            <button
                              onClick={() => setViewingStudentRegistration(u)}
                              title="View Official Registration Record (info.txt)"
                              style={{
                                padding: '5px 10px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#15803d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <FileText size={13} /> Registration
                            </button>
                          )}
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
                          {u.role === 'student' && !isRegistered && (
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading('Dispatching SMS & Email...', { id: 'resend' });
                                  await adminApi.resendCredentials(u.id);
                                  toast.success(`Welcome SMS & Email sent to ${u.email}`, { id: 'resend' });
                                } catch (err: any) {
                                  toast.error('Failed to send credentials.', { id: 'resend' });
                                }
                              }}
                              title="Resend Welcome SMS & Email"
                              style={{
                                padding: '5px 10px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#1d4ed8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Mail size={13} /> Resend SMS/Email
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

      {/* ── CREATE USER MODAL ────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.indigoL, color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.slate9 }}>
                  {newUser.role === 'student' ? 'Register New Student Account' : 'Create User Account'}
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
                  {newUser.role === 'student' ? 'Provisions institutional ASDAM Student ID and dispatches credentials via SMS/Email' : 'Add an instructor or staff officer to the portal'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Account Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, background: '#fff', fontWeight: 600 }}
                >
                  <option value="student">Student (Nursing / Midwifery)</option>
                  <option value="instructor">Instructor / Lecturer</option>
                  <option value="staff">Staff / Academic Officer</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {newUser.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Program of Study</label>
                    <select
                      value={newUser.program}
                      onChange={e => setNewUser({ ...newUser, program: e.target.value, department: e.target.value === 'nursing' ? 'Nursing' : 'Midwifery' })}
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, background: '#fff' }}
                    >
                      <option value="nursing">Diploma in Nursing</option>
                      <option value="midwifery">Diploma in Midwifery</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Academic Class / Level</label>
                    <select
                      value={newUser.class_name}
                      onChange={e => setNewUser({ ...newUser, class_name: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, background: '#fff' }}
                    >
                      <option value="100">Level 100 (Freshman)</option>
                      <option value="200">Level 200</option>
                      <option value="300">Level 300</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>First Name</label>
                  <input
                    placeholder="e.g. Ama"
                    value={newUser.first_name}
                    onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Last Name / Surname</label>
                  <input
                    placeholder="e.g. Mensah"
                    value={newUser.last_name}
                    onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ama.mensah@gmail.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>
                  Primary Phone Number (SMS Gateway Recipient)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="e.g. 0241234567 or 0506141054"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px 10px 38px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                  <Phone size={15} color={C.slate5} style={{ position: 'absolute', left: 13, top: 13 }} />
                </div>
                <div style={{ fontSize: 11.5, color: C.slate5, marginTop: 4 }}>
                  Login credentials and portal link will be dispatched via Arkesel SMS to this number.
                </div>
              </div>

              {newUser.role !== 'student' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Department</label>
                  <input
                    placeholder="e.g. Department of Nursing Sciences"
                    value={newUser.department}
                    onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>
                  Temporary Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate serial code (e.g. SN-XXXXXX)"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              {newUser.role === 'student' && (
                <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Sparkles size={14} /> Automatic ASDAM ID & Profile Registration Gate
                  </div>
                  Upon account creation, the student is assigned an official Student ID (e.g. <code>ASDAM/NUR/26/001</code>). They will receive an SMS and Email with their credentials and the Portal URL (<code>http://localhost:3000</code>). Upon logging in, they will be hard-gated to complete the 4-step registration wizard (Ghana Card, Bio, Residential & Digital Address GPS, Guardian details) before accessing portal services.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: `1px solid ${C.slate1}`, paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: C.slate7 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newUser.first_name.trim() || !newUser.last_name.trim()) {
                    toast.error('First Name and Last Name are required.');
                    return;
                  }
                  if (!newUser.email.trim()) {
                    toast.error('Email address is required.');
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                style={{ padding: '10px 22px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {createMutation.isPending ? 'Registering...' : 'Register User'}
              </button>
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
              <button
                onClick={() => { setResetPasswordTarget(null); setCustomPassword(''); }}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: C.slate7 }}
              >
                Cancel
              </button>
              <button
                onClick={() => resetPasswordMutation.mutate({ id: resetPasswordTarget.id, pass: customPassword || undefined })}
                disabled={resetPasswordMutation.isPending}
                style={{ padding: '8px 16px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOH STUDENT ROSTER UPLOAD MODAL ───────────────────────── */}
      {isMOHModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 720, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>
                    MOH Student Roster & ASDAM ID Generator
                  </h3>
                  <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 2 }}>
                    Upload Ministry of Health admission lists to provision accounts with unique IDs for Nursing (NUR) & Midwifery (MID).
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setIsMOHModalOpen(false); setMohUploadResult(null); setMohFile(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {!mohUploadResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Template Download Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--slate-50)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={18} color="var(--primary-600)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8 }}>Need the standard CSV format?</div>
                      <div style={{ fontSize: 11.5, color: C.slate5 }}>Includes example columns: MOH PIN, Serial Number, Program, Class, Year</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      background: '#fff',
                      border: `1px solid ${C.slate3}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.slate7,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} /> Download Sample Template
                  </button>
                </div>

                {/* Batch Metadata Options */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                      Default Program
                    </label>
                    <select
                      value={defaultProgram}
                      onChange={e => setDefaultProgram(e.target.value as any)}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, background: '#fff' }}
                    >
                      <option value="">Auto-detect from CSV</option>
                      <option value="nursing">Nursing (Code: NUR)</option>
                      <option value="midwifery">Midwifery (Code: MID)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                      Academic Class
                    </label>
                    <input
                      value={defaultClass}
                      onChange={e => setDefaultClass(e.target.value)}
                      placeholder="e.g. 100"
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                      Admission Year
                    </label>
                    <input
                      value={defaultYear}
                      onChange={e => setDefaultYear(e.target.value)}
                      placeholder="e.g. 2026"
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Drag-and-Drop Dropzone */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,text/csv"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setMohFile(f);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${mohFile ? '#059669' : C.slate3}`,
                      background: mohFile ? '#f0fdf4' : '#fafafa',
                      borderRadius: 14,
                      padding: '28px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: mohFile ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mohFile ? '#059669' : C.slate5 }}>
                        <UploadCloud size={22} />
                      </div>
                      {mohFile ? (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>
                            {mohFile.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                            {(mohFile.size / 1024).toFixed(1)} KB · Ready to process
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.slate8 }}>
                            Click to browse or drop student roster CSV here
                          </div>
                          <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>
                            Accepts CSV files with UTF-8 or standard encoding
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dry Run Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.slate7, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={e => setIsDryRun(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>
                    <strong>Dry Run Validation Only</strong> — Preview generated Student IDs without writing to database.
                  </span>
                </label>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setIsMOHModalOpen(false); setMohFile(null); }}
                    style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadRoster}
                    disabled={!mohFile || isUploadingRoster}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 22px',
                      background: !mohFile ? C.slate3 : '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor: !mohFile || isUploadingRoster ? 'not-allowed' : 'pointer',
                      fontSize: 13.5,
                      fontWeight: 700,
                      boxShadow: !mohFile ? 'none' : '0 4px 12px rgba(5,150,105,0.3)'
                    }}
                  >
                    {isUploadingRoster ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Processing Roster & IDs…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> {isDryRun ? 'Validate Roster (Dry Run)' : 'Import & Generate Student IDs'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Results Summary View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Result Status Banner */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: mohUploadResult.errors.length === 0 ? '#ecfdf5' : '#fffbeb',
                  border: `1.5px solid ${mohUploadResult.errors.length === 0 ? '#86efac' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {mohUploadResult.errors.length === 0 ? (
                    <CheckCircle2 size={24} color="#16a34a" className="shrink-0" />
                  ) : (
                    <AlertTriangle size={24} color="#d97706" className="shrink-0" />
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: mohUploadResult.errors.length === 0 ? '#15803d' : '#b45309' }}>
                      {mohUploadResult.dry_run ? 'Dry Run Validation Completed' : 'Roster Processing Complete'}
                    </div>
                    <div style={{ fontSize: 13, color: mohUploadResult.errors.length === 0 ? '#166534' : '#92400e', marginTop: 2 }}>
                      {mohUploadResult.imported_count} student(s) successfully {mohUploadResult.dry_run ? 'validated' : 'provisioned'} with ASDAM IDs.
                      {mohUploadResult.skipped_count > 0 && ` ${mohUploadResult.skipped_count} row(s) skipped due to validation errors.`}
                      {!mohUploadResult.dry_run && mohUploadResult.imported_count > 0 && (
                        <div style={{ marginTop: 6, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                          <Mail size={14} /> Automated Welcome SMS & Email credentials dispatched to {mohUploadResult.imported_count} student(s) for mandatory registration.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generated Student IDs Table Preview */}
                {mohUploadResult.students.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8, marginBottom: 8 }}>
                      Generated ASDAM Student IDs ({mohUploadResult.students.length}):
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${C.slate2}`, borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: C.slate0, borderBottom: `1px solid ${C.slate2}` }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Generated Student ID</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Student Name</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>MOH PIN</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Program</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mohUploadResult.students.map((st, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.slate1}` }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                                <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                                  {st.student_id}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: C.slate9 }}>{st.full_name}</td>
                              <td style={{ padding: '8px 12px', color: C.slate7 }}>{st.moh_pin}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: st.program === 'nursing' ? '#dcfce7' : '#f3e8ff',
                                  color: st.program === 'nursing' ? '#15803d' : '#7e22ce',
                                }}>
                                  {st.program_label}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Validation Errors List (if any) */}
                {mohUploadResult.errors.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>
                      Validation Issues ({mohUploadResult.errors.length}):
                    </div>
                    <div style={{ maxHeight: 120, overflowY: 'auto', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10 }}>
                      {mohUploadResult.errors.map((err, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: '#991b1b', marginBottom: 3 }}>
                          <strong>Row {err.row}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setMohUploadResult(null); setMohFile(null); }}
                    style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}
                  >
                    Upload Another Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsMOHModalOpen(false); setMohUploadResult(null); setMohFile(null); }}
                    style={{ padding: '9px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW STUDENT REGISTRATION DETAILS MODAL (info.txt) ─── */}
      {viewingStudentRegistration && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 800, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${C.slate2}`, paddingBottom: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.indigo }}>
                  <Award size={26} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>
                      Official Student Registration Record
                    </h3>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: viewingStudentRegistration.is_registered ? '#dcfce7' : '#fef3c7',
                      color: viewingStudentRegistration.is_registered ? '#15803d' : '#b45309',
                      border: viewingStudentRegistration.is_registered ? '1px solid #bbf7d0' : '1px solid #fde68a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      {viewingStudentRegistration.is_registered ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {viewingStudentRegistration.is_registered ? 'Registration Completed & Verified' : 'Pending Student Registration'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.slate5, marginTop: 3 }}>
                    Arch-Bishop Porter College of Health & Allied Sciences (ASDAM)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingStudentRegistration(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.slate5, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Identification Banner */}
            <div style={{ background: C.slate0, border: `1px solid ${C.slate2}`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.indigoL, color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
                  {viewingStudentRegistration.avatar ? (
                    <img src={viewingStudentRegistration.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    `${viewingStudentRegistration.first_name?.[0] || ''}${viewingStudentRegistration.last_name?.[0] || ''}`
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.slate9 }}>
                    {viewingStudentRegistration.first_name} {viewingStudentRegistration.last_name}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.slate6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>ID: <strong style={{ fontFamily: 'monospace', color: C.indigo }}>{viewingStudentRegistration.student_id || 'Pending'}</strong></span>
                    <span>Program: <strong>{viewingStudentRegistration.program === 'nursing' ? 'Diploma in Nursing' : viewingStudentRegistration.program === 'midwifery' ? 'Diploma in Midwifery' : (viewingStudentRegistration.department || 'Nursing')}</strong></span>
                    <span>Level: <strong>{viewingStudentRegistration.class_name || '100'}</strong></span>
                  </div>
                </div>
              </div>
              {viewingStudentRegistration.profile?.registration_completed_at && (
                <div style={{ textAlign: 'right', fontSize: 11.5, color: C.slate5 }}>
                  Completed On: <strong style={{ color: C.slate7 }}>{new Date(viewingStudentRegistration.profile.registration_completed_at).toLocaleString()}</strong>
                </div>
              )}
            </div>

            {/* If Pending Banner */}
            {!viewingStudentRegistration.is_registered && (
              <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} className="shrink-0" />
                  <div>
                    <strong>Registration Incomplete:</strong> The student has received their temporary credentials and portal URL (http://localhost:3000), but has not completed their mandatory profile submission.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      toast.loading('Dispatching credentials...', { id: 'modal-resend' });
                      await adminApi.resendCredentials(viewingStudentRegistration.id);
                      toast.success(`Welcome SMS & Email resent to ${viewingStudentRegistration.email}`, { id: 'modal-resend' });
                    } catch {
                      toast.error('Failed to resend credentials.', { id: 'modal-resend' });
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#d97706',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Mail size={13} /> Resend SMS/Email
                </button>
              </div>
            )}

            {/* Registration Data Sections from info.txt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Personal Details */}
              <div style={{ border: `1px solid ${C.slate2}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: `1px solid ${C.slate2}`, fontSize: 13, fontWeight: 800, color: C.slate8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} color={C.indigo} /> 1. Personal Details (info.txt)
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>First Names</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.first_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Surname</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.last_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Ghana Card ID</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: C.indigo, marginTop: 2, fontFamily: 'monospace' }}>
                      {viewingStudentRegistration.profile?.ghana_card || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Gender</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.gender || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Date of Birth</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.date_of_birth || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Birth Place (Town/City)</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.birth_place || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Country of Birth</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.country_of_birth || 'Ghana'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Nationality</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.nationality || 'Ghanaian'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Languages Spoken</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.languages_spoken || '—'}</div>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 3' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Medical Condition / Disability</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.medical_condition || 'None reported'}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Residential Details */}
              <div style={{ border: `1px solid ${C.slate2}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: `1px solid ${C.slate2}`, fontSize: 13, fontWeight: 800, color: C.slate8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building size={15} color={C.indigo} /> 2. Contact Information & Residential Address (info.txt)
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Residential Address</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.residential_address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Digital Address (GPS)</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#059669', marginTop: 2, fontFamily: 'monospace' }}>
                      {viewingStudentRegistration.profile?.digital_address || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>City / Town</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.city || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Region</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.region || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>District</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.district || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Primary Mobile Phone</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.phone || '—'}</div>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Email Address</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.email}</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Parent / Guardian Details */}
              <div style={{ border: `1px solid ${C.slate2}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: `1px solid ${C.slate2}`, fontSize: 13, fontWeight: 800, color: C.slate8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HeartPulse size={15} color={C.rose} /> 3. Parent / Guardian / Next of Kin (info.txt)
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Full Name</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.guardian_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Contact Number</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.guardian_phone || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Relationship</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{viewingStudentRegistration.profile?.guardian_relationship || 'Parent / Guardian'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, borderTop: `1px solid ${C.slate1}`, paddingTop: 16, flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '9px 18px',
                  background: '#f1f5f9',
                  border: `1px solid ${C.slate3}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.slate8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={15} /> Print Registration Slip
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setViewingStudentRegistration(null)}
                  style={{
                    padding: '9px 20px',
                    background: C.indigo,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
