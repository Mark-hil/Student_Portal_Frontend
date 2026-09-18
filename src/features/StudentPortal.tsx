/**
 * StudentPortal.tsx
 * Role-aware portal — renders different dashboards for student / lecturer / officer.
 * Fully responsive across mobile, tablet, and desktop viewports.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, User,
  Plus, GraduationCap, LogOut, Search, ClipboardCheck, Users, Shield,
  Menu, X, Wallet, Coins
} from 'lucide-react';
import { C } from '../utils/theme';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileDrawer } from '../components/ui/Responsive';
import { Toaster } from 'react-hot-toast';
import { notificationsApi, authApi } from '../api/services';
import type { User as UserType } from '../types';

import { StudentDashboard } from './student/StudentDashboard';
import { StudentCourses } from './student/StudentCourses';
import { StudentGrades } from './student/StudentGrades';
import { CourseRegistration } from './student/CourseRegistration';
import { StudentFinancials } from './student/StudentFinancials';
import { LecturerDashboard } from './lecturer/LecturerDashboard';
import { LecturerCoursesView } from './lecturer/LecturerCoursesView';
import { AdminDashboard } from './admin/AdminDashboard';
import { FinanceDashboard } from './finance/FinanceDashboard';
import { BursarManagement } from './admin/BursarManagement';
import { UserManagement } from './admin/UserManagement';
import { CourseManagement } from './admin/CourseManagement';
import { GradeBatchList } from './shared/GradeBatchList';
import { NotificationsView } from './shared/NotificationsView';
import { ProfileView } from './shared/ProfileView';
import { StudentRegistrationOnboarding } from './student/StudentRegistrationOnboarding';

interface Props { user: UserType; onLogout: () => void; }

export default function StudentPortal({ user: initialUser, onLogout }: Props) {
  useWebSocket();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [userState, setUserState] = useState<UserType>(initialUser);
  const [view, setView] = useState(initialUser.role === 'finance' ? 'bursar' : 'dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Always fetch fresh user profile from backend
  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then(r => r.data),
    staleTime: 15_000,
  });

  const currentUser: UserType = freshUser || userState;

  const handleUserUpdate = (updated: UserType) => {
    setUserState(updated);
    try {
      localStorage.setItem('portal_user', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  // Hard gate: Mandatory Student Profile Registration before accessing portal features
  if (currentUser.role === 'student' && !currentUser.is_registered) {
    return (
      <StudentRegistrationOnboarding
        user={currentUser}
        onComplete={(updated) => {
          handleUserUpdate(updated);
        }}
        onLogout={onLogout}
      />
    );
  }

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unread = (notifData?.results ?? []).filter((n: any) => !n.read).length;

  const isStudent = currentUser.role === 'student';
  const isLecturer = currentUser.role === 'instructor';
  const isFinance = currentUser.role === 'finance';
  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isOfficer = isStaff || isAdmin;

  const NAV_STUDENT = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', Icon: BookOpen },
    { id: 'register', label: 'Course Registration', Icon: Plus },
    { id: 'grades', label: 'Grades & GPA', Icon: BarChart2 },
    { id: 'financials', label: 'Fees & Financials', Icon: Wallet },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];
  const NAV_LECTURER = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'courses_lecturer', label: 'Manage Courses', Icon: BookOpen },
    { id: 'batches', label: 'Grade Batches', Icon: ClipboardCheck },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];
  const NAV_FINANCE = [
    { id: 'dashboard', label: 'Financial Overview', Icon: LayoutDashboard },
    { id: 'bursar', label: 'Bursar & Accounts', Icon: Coins },
    { id: 'users', label: 'Student Directory', Icon: Users },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];
  const NAV_STAFF = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'users', label: 'User Management', Icon: Users },
    { id: 'courses_admin', label: 'Course Management', Icon: BookOpen },
    { id: 'review', label: 'Review Queue', Icon: ClipboardCheck },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];
  const NAV_ADMIN = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'bursar', label: 'Bursar & Accounts', Icon: Coins },
    { id: 'users', label: 'User Management', Icon: Users },
    { id: 'courses_admin', label: 'Course Management', Icon: BookOpen },
    { id: 'review', label: 'Review Queue', Icon: ClipboardCheck },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];

  const NAV = isFinance
    ? NAV_FINANCE
    : isLecturer
    ? NAV_LECTURER
    : isAdmin
    ? NAV_ADMIN
    : isStaff
    ? NAV_STAFF
    : NAV_STUDENT;

  const TITLES: Record<string, string> = {
    dashboard: isFinance ? 'Financial Overview & Treasury' : 'Dashboard',
    courses_lecturer: 'Manage Courses & Teaching',
    courses: 'My Courses', register: 'Course Registration',
    grades: 'Grades & GPA', batches: 'Grade Batches', review: 'Review Queue',
    notifications: 'Notifications', profile: 'My Profile',
    users: isFinance ? 'Student Directory' : 'User Management',
    courses_admin: 'Course Management',
    financials: 'Fees & Financials', bursar: 'Bursar & Accounts'
  };

  const handleNavClick = (navId: string) => {
    setView(navId);
    if (!isDesktop) {
      setMobileMenuOpen(false);
    }
  };

  function renderView() {
    switch (view) {
      case 'dashboard':
        if (isFinance) return <FinanceDashboard user={currentUser} onNav={setView} />;
        if (isLecturer) return <LecturerDashboard user={currentUser} />;
        if (isOfficer) return <AdminDashboard user={currentUser} />;
        return <StudentDashboard user={currentUser} onNav={setView} />;
      case 'courses_lecturer': return <LecturerCoursesView user={currentUser} />;
      case 'users': return <UserManagement />;
      case 'courses_admin': return <CourseManagement />;
      case 'bursar':
        if (isStaff) return <AdminDashboard user={currentUser} />;
        return <BursarManagement />;
      case 'courses': return <StudentCourses onNav={setView} />;
      case 'register': return <CourseRegistration />;
      case 'grades': return <StudentGrades />;
      case 'financials': return <StudentFinancials user={currentUser} />;
      case 'batches': return <GradeBatchList role="lecturer" />;
      case 'review': return <GradeBatchList role="officer" />;
      case 'notifications': return <NotificationsView />;
      case 'profile': return <ProfileView user={currentUser} onUserUpdate={handleUserUpdate} onNav={setView} />;
      default: return isFinance ? <FinanceDashboard user={currentUser} onNav={setView} /> : <StudentDashboard user={currentUser} onNav={setView} />;
    }
  }

  const initials = (currentUser.first_name?.[0] ?? '') + (currentUser.last_name?.[0] ?? '');
  const roleLabel = isFinance
    ? 'Finance Directorate'
    : isAdmin
    ? 'System Admin'
    : isStaff
    ? 'Academic Office'
    : isLecturer
    ? 'Faculty Portal'
    : 'Student Hub';
  const roleColor = isFinance
    ? '#d97706'
    : isAdmin
    ? '#6366f1'
    : isStaff
    ? '#ec4899'
    : isLecturer
    ? '#8b5cf6'
    : '#10b981';

  // Sidebar content (shared between desktop sidebar and mobile drawer)
  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#090d16', color: '#fff' }}>
      {/* Brand Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: 14,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
            }}
          >
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              UniPortal
            </div>
            <div style={{ fontSize: 11, color: roleColor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {!isDesktop && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 8,
              padding: 6,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div
        onClick={() => handleNavClick('profile')}
        style={{
          margin: '16px 14px 8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser.full_name}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize', marginTop: 2 }}>
            {currentUser.role} {currentUser.student_id ? `· ${currentUser.student_id}` : ''}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ padding: '12px 14px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 10px 10px' }}>
          MAIN NAVIGATION
        </div>
        {NAV.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 11,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'linear-gradient(90deg, rgba(79, 70, 229, 0.22) 0%, rgba(79, 70, 229, 0.06) 100%)' : 'transparent',
                color: active ? '#c7d2fe' : 'rgba(255,255,255,0.55)',
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                marginBottom: 4,
                position: 'relative',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    bottom: '15%',
                    width: 3.5,
                    borderRadius: '0 4px 4px 0',
                    background: '#6366f1',
                    boxShadow: '0 0 10px #6366f1',
                  }}
                />
              )}
              <Icon size={18} color={active ? '#818cf8' : 'currentColor'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
              {id === 'notifications' && unread > 0 && (
                <span
                  style={{
                    background: '#f43f5e',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 99,
                    boxShadow: '0 2px 5px rgba(244, 63, 94, 0.4)',
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Signout */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  // Quick Mobile Bottom Bar Items
  const mobileNavItems = isStudent
    ? [
        { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
        { id: 'courses', label: 'Courses', Icon: BookOpen },
        { id: 'register', label: 'Register', Icon: Plus },
        { id: 'grades', label: 'Grades', Icon: BarChart2 },
        { id: 'profile', label: 'Profile', Icon: User },
      ]
    : isLecturer
    ? [
        { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
        { id: 'batches', label: 'Batches', Icon: ClipboardCheck },
        { id: 'notifications', label: 'Alerts', Icon: Bell },
        { id: 'profile', label: 'Profile', Icon: User },
      ]
    : [
        { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
        { id: 'users', label: 'Users', Icon: Users },
        { id: 'courses_admin', label: 'Courses', Icon: BookOpen },
        { id: 'review', label: 'Review', Icon: ClipboardCheck },
        { id: 'profile', label: 'Profile', Icon: User },
      ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
        @keyframes drawerSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.45); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.65); }
        button, input, select, textarea { font-family: inherit; }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", fontSize: 14.5, background: '#f8fafc', overflow: 'hidden' }}>
        <Toaster position="top-right" />

        {/* ── Desktop Sidebar ────────────────────────────────── */}
        {isDesktop && (
          <aside style={{ width: 264, background: '#090d16', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            {sidebarContent}
          </aside>
        )}

        {/* ── Mobile/Tablet Slide-over Drawer ─────────────────── */}
        {!isDesktop && (
          <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} width={280}>
            {sidebarContent}
          </MobileDrawer>
        )}

        {/* ── Main View Area ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
          {/* Top Glass Header */}
          <header
            style={{
              height: 64,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
              display: 'flex',
              alignItems: 'center',
              padding: isMobile ? '0 14px' : isTablet ? '0 20px' : '0 32px',
              gap: isMobile ? 10 : 16,
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            {/* Hamburger Button for Mobile / Tablet */}
            {!isDesktop && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: '#fff',
                  border: `1px solid ${C.slate2}`,
                  borderRadius: 10,
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: C.slate7,
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                aria-label="Open Navigation Menu"
              >
                <Menu size={20} />
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 800,
                  color: C.slate9,
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {TITLES[view]}
              </span>
              {!isMobile && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.indigo,
                    background: C.indigoL,
                    border: `1px solid ${C.indigoBorder}`,
                    padding: '3px 10px',
                    borderRadius: 99,
                    flexShrink: 0,
                  }}
                >
                  Spring 2025
                </span>
              )}
            </div>

            {/* Search Bar (Desktop full, Mobile collapsible toggle) */}
            {isDesktop ? (
              <div style={{ position: 'relative' }}>
                <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  placeholder="Quick search courses, faculty…"
                  style={{
                    padding: '8px 36px 8px 36px',
                    border: `1px solid ${C.slate2}`,
                    borderRadius: 10,
                    fontSize: 13.5,
                    outline: 'none',
                    width: 230,
                    color: C.slate8,
                    background: '#f8fafc',
                    transition: 'all 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = C.indigo;
                    e.currentTarget.style.width = '270px';
                    e.currentTarget.style.background = '#fff';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = C.slate2;
                    e.currentTarget.style.width = '230px';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                />
                <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.slate4, background: C.slate2, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  ⌘K
                </span>
              </div>
            ) : null}

            {/* Notifications Icon */}
            <button
              onClick={() => setView('notifications')}
              style={{
                position: 'relative',
                background: '#fff',
                border: `1px solid ${C.slate2}`,
                borderRadius: 10,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: C.slate6,
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 17,
                    height: 17,
                    background: '#f43f5e',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulseGlow 2s infinite',
                  }}
                >
                  {unread}
                </span>
              )}
            </button>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => setView('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '4px' : '5px 12px 5px 5px',
                borderRadius: 99,
                background: '#fff',
                border: `1px solid ${C.slate2}`,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initials}
              </div>
              {!isMobile && (
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.slate8 }}>
                  {currentUser.first_name}
                </span>
              )}
            </div>
          </header>

          {/* Main View Container */}
          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '16px 14px 76px' : isTablet ? '22px 22px' : '28px 34px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
              {renderView()}
            </div>
          </main>

          {/* ── Mobile Bottom Navigation Bar (Phones < 768px) ─── */}
          {isMobile && (
            <nav
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background: '#ffffff',
                borderTop: '1px solid rgba(226, 232, 240, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 100,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              {mobileNavItems.map(({ id, label, Icon }) => {
                const active = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      padding: '6px 10px',
                      color: active ? C.indigo : C.slate4,
                      cursor: 'pointer',
                      flex: 1,
                      position: 'relative',
                    }}
                  >
                    <Icon size={20} color={active ? C.indigo : 'currentColor'} />
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>
                      {label}
                    </span>
                    {id === 'notifications' && unread > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: '28%',
                          width: 8,
                          height: 8,
                          background: '#f43f5e',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

