import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, Edit3, Key, Shield, CheckCircle2, Building, Mail,
  FileText, Users, ClipboardCheck, X, Check, Loader2, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import { C, gpaColor } from '../../utils/theme';
import { gradesApi, usersApi, adminApi, batchesApi, coursesApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

interface Props {
  user: UserType;
  onUserUpdate?: (user: UserType) => void;
  onNav?: (view: string) => void;
}

export function ProfileView({ user, onUserUpdate, onNav }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    department: user.department || '',
    bio: user.bio || '',
    major: user.profile?.major || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const isStudent = user.role === 'student';
  const isLecturer = user.role === 'instructor';
  const isOfficer = user.role === 'staff' || user.role === 'admin';

  // Role-specific Queries
  const { data: gpa } = useQuery({
    queryKey: ['gpa-summary'],
    queryFn: () => gradesApi.gpaSummary().then(r => r.data),
    enabled: isStudent,
    staleTime: 600_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    enabled: isOfficer,
    staleTime: 60_000,
  });

  const { data: lecturerBatches } = useQuery({
    queryKey: ['lecturer-batches-count'],
    queryFn: () => batchesApi.list({ role: 'lecturer' }).then(r => r.data),
    enabled: isLecturer,
    staleTime: 60_000,
  });

  const { data: taughtCourses } = useQuery({
    queryKey: ['lecturer-courses'],
    queryFn: () => coursesApi.list({ max_students: 100 }).then(r => r.data.results),
    enabled: isLecturer,
    staleTime: 60_000,
  });

  const semGPA = gpa?.semester_gpa ? parseFloat(gpa.semester_gpa) : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  const handleDownloadTranscript = async () => {
    setIsDownloadingPdf(true);
    const toastId = toast.loading('Generating Official PDF Transcript…');
    try {
      await gradesApi.downloadTranscriptPdf();
      toast.success('Transcript downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate transcript PDF. Please try again.', { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const payload: any = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        department: editForm.department,
        bio: editForm.bio,
      };
      if (isStudent) {
        payload.profile = { major: editForm.major };
      }
      const res = await usersApi.updateMe(payload);
      toast.success('Profile updated successfully!');
      setShowEditModal(false);
      if (onUserUpdate) onUserUpdate(res.data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await usersApi.changePassword(passwordForm.current_password, passwordForm.new_password);
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.current_password?.[0] || err.response?.data?.detail || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      useAuthStore.getState().setUser(res.data);
      if (onUserUpdate) onUserUpdate(res.data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile picture updated to Cloudinary (uniportal-profile picture)!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Theming based on role
  const roleTheme = isStudent
    ? { gradient: `linear-gradient(135deg, ${C.navy}, #1e1b4b)`, accent: C.indigo, label: 'Undergraduate Student', badgeBg: 'rgba(99, 102, 241, 0.25)', badgeText: '#c7d2fe' }
    : isLecturer
    ? { gradient: 'linear-gradient(135deg, #064e3b, #0f172a)', accent: C.emerald, label: 'Faculty & Lecturer', badgeBg: 'rgba(160, 240, 200, 0.25)', badgeText: '#a7f3d0' }
    : { gradient: 'linear-gradient(135deg, #4c1d95, #0f172a)', accent: C.purple, label: 'Academic Officer & Administrator', badgeBg: 'rgba(168, 85, 247, 0.25)', badgeText: '#e9d5ff' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ── Banner Header ────────────────────────────────────────── */}
      <div
        style={{
          background: roleTheme.gradient,
          borderRadius: 20,
          padding: '30px 36px',
          color: '#fff',
          marginBottom: 26,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                title="Click to upload profile photo to Cloudinary"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: roleTheme.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.4)',
                }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')
                )}
                
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isUploadingAvatar ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!isUploadingAvatar) e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { if (!isUploadingAvatar) e.currentTarget.style.opacity = '0'; }}
                >
                  {isUploadingAvatar ? (
                    <Loader2 size={24} className="animate-spin" color="#fff" />
                  ) : (
                    <Camera size={22} color="#fff" />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: isUploadingAvatar ? 'not-allowed' : 'pointer',
                  backdropFilter: 'blur(6px)',
                  transition: 'background 0.2s',
                }}
              >
                {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: '#fff', margin: 0 }}>
                  {user.full_name}
                </h1>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    padding: '4px 12px',
                    borderRadius: 99,
                    background: roleTheme.badgeBg,
                    color: roleTheme.badgeText,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {roleTheme.label}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={15} /> {user.email}</span>
                {user.student_id && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={15} /> ID: <strong>{user.student_id}</strong>
                  </span>
                )}
                {user.department && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={15} /> {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                setEditForm({
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  phone: user.phone || '',
                  department: user.department || '',
                  bio: user.bio || '',
                  major: user.profile?.major || '',
                });
                setShowEditModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: 11,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: 11,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <Key size={15} /> Password
            </button>
          </div>
        </div>

        {user.bio && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 13.5, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.5 }}>
            "{user.bio}"
          </div>
        )}
      </div>

      {/* ── ROLE SPECIFIC CONTENT ─────────────────────────────────── */}

      {/* 1. STUDENT PROFILE */}
      {isStudent && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 26 }}>
            <Card style={{ padding: '18px 22px', borderLeft: `4px solid ${C.indigo}` }}>
              <div style={{ fontSize: 12, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Declared Major</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {user.profile?.major || user.department || 'Computer Science'}
              </div>
              <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>Faculty of Engineering & Sciences</div>
            </Card>

            <Card style={{ padding: '18px 22px', borderLeft: `4px solid ${semGPA ? gpaColor(semGPA) : C.slate3}` }}>
              <div style={{ fontSize: 12, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Semester GPA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: semGPA ? gpaColor(semGPA) : C.slate9, marginTop: 4 }}>
                {semGPA ? semGPA.toFixed(2) : '—'}
              </div>
              <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>{gpa?.current_semester_label || 'Current Semester'}</div>
            </Card>

            <Card style={{ padding: '18px 22px', borderLeft: `4px solid ${cumGPA ? gpaColor(cumGPA) : C.slate3}` }}>
              <div style={{ fontSize: 12, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Cumulative GPA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cumGPA ? gpaColor(cumGPA) : C.slate9, marginTop: 4 }}>
                {cumGPA ? cumGPA.toFixed(2) : '—'}
              </div>
              <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>Career Academic Standing</div>
            </Card>

            <Card style={{ padding: '18px 22px', borderLeft: `4px solid ${C.emerald}` }}>
              <div style={{ fontSize: 12, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Earned Credits</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {gpa?.credits_completed ?? user.profile?.total_credits ?? 0} <span style={{ fontSize: 13, fontWeight: 500, color: C.slate4 }}>/ 120 Total</span>
              </div>
              <div style={{ fontSize: 12, color: C.emerald, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <CheckCircle2 size={14} /> On track for graduation
              </div>
            </Card>
          </div>

          {/* Academic Records & Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, marginBottom: 26 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.slate9, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 9 }}>
                <GraduationCap size={20} color={C.indigo} /> Academic Status & Credentials
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 13.5, color: C.slate5 }}>Academic Standing</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: (cumGPA && cumGPA >= 3.5) ? C.indigo : C.emerald }}>
                    {cumGPA && cumGPA >= 3.5 ? 'Dean’s Honour Roll' : 'Good Standing'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 13.5, color: C.slate5 }}>Student ID</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.slate8 }}>{user.student_id || 'STU-2024-8891'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 13.5, color: C.slate5 }}>Contact Phone</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.slate8 }}>{user.phone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 13.5, color: C.slate5 }}>Institutional Email</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.slate8 }}>{user.email}</span>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.slate9, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <FileText size={20} color={C.indigo} /> Official Documents
                </div>
                <p style={{ fontSize: 13.5, color: C.slate5, lineHeight: 1.55, marginBottom: 18 }}>
                  Generate and download your cryptographically stamped unofficial transcript with semester quality points and GPA breakdown.
                </p>
              </div>

              <button
                onClick={handleDownloadTranscript}
                disabled={isDownloadingPdf}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: C.indigo,
                  color: '#fff',
                  border: 'none',
                  padding: '13px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isDownloadingPdf ? 'not-allowed' : 'pointer',
                  opacity: isDownloadingPdf ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                }}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF…
                  </>
                ) : (
                  <>
                    <GraduationCap size={17} /> Download Unofficial Transcript (PDF)
                  </>
                )}
              </button>
            </Card>
          </div>
        </>
      )}

      {/* 2. LECTURER / INSTRUCTOR PROFILE */}
      {isLecturer && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.emerald}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Academic Department</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.slate9, marginTop: 4 }}>
                {user.department || 'Computer Science'}
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>School of Computing & Engineering</div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.indigo}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Teaching Assignments</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {taughtCourses?.length ?? 2} <span style={{ fontSize: 12, fontWeight: 400, color: C.slate4 }}>Active Courses</span>
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Spring 2025 Semester</div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.amber}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Grade Batches</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {lecturerBatches?.length ?? 0} <span style={{ fontSize: 12, fontWeight: 400, color: C.slate4 }}>Batches</span>
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Submissions & Grading Queue</div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.purple}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Faculty Status</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.emerald, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Active Instructor
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Verified Academic Staff</div>
            </Card>
          </div>

          {/* Instructor Quick Navigation & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.slate9, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={18} color={C.emerald} /> Faculty Contact & Office
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Faculty ID</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{user.student_id || 'FAC-CS-109'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Office Location</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>Turing Hall, Room 402</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Office Hours</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>Mon & Thu 2:00 PM – 4:00 PM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Phone Extension</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{user.phone || '+1 (555) 019-2834'}</span>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.slate9, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardCheck size={18} color={C.emerald} /> Instructor Workflows
                </div>
                <p style={{ fontSize: 12, color: C.slate5, lineHeight: 1.5, marginBottom: 16 }}>
                  Manage course assignments, enter grades, upload CSV batch rosters, and submit grades for approval.
                </p>
              </div>

              {onNav && (
                <button
                  onClick={() => onNav('batches')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: C.emerald,
                    color: '#fff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                  }}
                >
                  <ClipboardCheck size={16} /> Open Grade Batches
                </button>
              )}
            </Card>
          </div>
        </>
      )}

      {/* 3. ACADEMIC OFFICER / ADMIN PROFILE */}
      {isOfficer && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.purple}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>System Privileges</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.slate9, marginTop: 4 }}>
                {user.role === 'admin' ? 'Super Administrator' : 'Academic Officer'}
              </div>
              <div style={{ fontSize: 11, color: C.purple, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} /> Full Institutional Authority
              </div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.indigo}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Total Enrolled Students</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {stats?.total_students ?? '—'} <span style={{ fontSize: 12, fontWeight: 400, color: C.slate4 }}>Students</span>
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Across all faculties</div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.emerald}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Active Course Catalog</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.slate9, marginTop: 4 }}>
                {stats?.total_courses ?? '—'} <span style={{ fontSize: 12, fontWeight: 400, color: C.slate4 }}>Courses</span>
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>{stats?.total_instructors ?? '—'} Faculty Members</div>
            </Card>

            <Card style={{ padding: '16px 20px', borderLeft: `4px solid ${C.rose}` }}>
              <div style={{ fontSize: 11, color: C.slate4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Pending Review Queue</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stats?.pending_batches ? C.rose : C.slate9, marginTop: 4 }}>
                {stats?.pending_batches ?? 0} <span style={{ fontSize: 12, fontWeight: 400, color: C.slate4 }}>Batches</span>
              </div>
              <div style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Awaiting approval & publication</div>
            </Card>
          </div>

          {/* Admin Shortcuts & Records */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.slate9, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color={C.purple} /> Administrative Authority
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Officer ID</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{user.student_id || 'ADM-REG-01'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Department</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{user.department || 'Academic Registrar & Records'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.slate1}` }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>Grade Audit Authority</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.emerald }}>Approved Auditor</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: C.slate5 }}>System Email</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{user.email}</span>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.slate9, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color={C.purple} /> Quick Admin Shortcuts
                </div>
                <p style={{ fontSize: 12, color: C.slate5, lineHeight: 1.5, marginBottom: 16 }}>
                  Directly access user provisioning, review grade batches, and manage active courses.
                </p>
              </div>

              {onNav && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onNav('users')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: C.purple,
                      color: '#fff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Users size={14} /> Users
                  </button>
                  <button
                    onClick={() => onNav('review')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: C.navy,
                      color: '#fff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <ClipboardCheck size={14} /> Review Queue
                  </button>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ── EDIT PROFILE MODAL ────────────────────────────────────── */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 26px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.slate9, display: 'flex', alignItems: 'center', gap: 9 }}>
                <Edit3 size={20} color={C.indigo} /> Edit Profile Details
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: 26 }}>
              {/* Profile Photo Uploader Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: C.slate0, borderRadius: 12, marginBottom: 18, border: `1px solid ${C.slate2}` }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.indigo, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0, border: `2px solid ${C.indigoL}` }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9, marginBottom: 2 }}>Profile Photo</div>
                  <div style={{ fontSize: 11.5, color: C.slate5 }}>Stored in Cloudinary: <strong style={{ color: C.indigo }}>uniportal-profile picture</strong></div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#fff',
                    border: `1px solid ${C.slate3}`,
                    cursor: isUploadingAvatar ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.indigo,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {isUploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>First Name</label>
                  <input
                    required
                    value={editForm.first_name}
                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Last Name</label>
                  <input
                    required
                    value={editForm.last_name}
                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                </div>
              </div>

              {isStudent && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Major / Academic Concentration</label>
                  <input
                    value={editForm.major}
                    onChange={e => setEditForm({ ...editForm, major: e.target.value })}
                    placeholder="e.g. Computer Science, Software Engineering"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Department</label>
                  <input
                    value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Phone Number</label>
                  <input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Bio & Academic Interests</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Share a short bio or academic background…"
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 18px', background: C.slate1, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: C.slate7, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  style={{
                    padding: '10px 22px',
                    background: C.indigo,
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                  }}
                >
                  {isSavingProfile ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ─────────────────────────────────── */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 460,
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 26px', borderBottom: `1px solid ${C.slate2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.slate9, display: 'flex', alignItems: 'center', gap: 9 }}>
                <Key size={20} color={C.indigo} /> Change Account Password
              </div>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ padding: 26 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>New Password (minimum 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Enter new strong password"
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="Re-enter new password"
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate3}`, borderRadius: 10, fontSize: 14, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '10px 18px', background: C.slate1, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: C.slate7, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  style={{
                    padding: '10px 22px',
                    background: C.indigo,
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: isSavingPassword ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                  }}
                >
                  {isSavingPassword ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={16} />} Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

