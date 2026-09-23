/**
 * LoginPage — State-of-the-art enterprise academic authentication portal.
 * Features live glass preview cards, seamless role autofill switcher,
 * high-contrast accessible inputs, and zero-scroll viewport fitting.
 * Styled via enterprise CSS design system (auth.css & components.css).
 */
import React, { useState, useEffect, FormEvent } from 'react';
import {
  GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle,
  ShieldCheck, Calendar, Award, Clock, ArrowRight,
  BookOpen, Shield, Coins, KeyRound, CheckCircle2, HeartPulse, Phone,
  Building2, ArrowLeft, Smartphone
} from 'lucide-react';
import client from '../api/client';
import { authApi } from '../api/services';
import type { MOHVerificationResult } from '../types';

interface Props {
  onSuccess: (user: any, tokens: any) => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'Student',
    label: 'Student Portal',
    email: 'student@uniportal.edu',
    icon: GraduationCap,
    color: 'var(--emerald-500)',
    bg: 'var(--emerald-50)',
    border: '#a7f3d0',
  },
  {
    role: 'Lecturer',
    label: 'Faculty Portal',
    email: 'lecturer@uniportal.edu',
    icon: BookOpen,
    color: 'var(--violet-500)',
    bg: 'var(--violet-50)',
    border: '#ddd6fe',
  },
  {
    role: 'Head of Department',
    label: 'Departmental Directorate',
    email: 'hod@uniportal.edu',
    icon: Building2,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    role: 'Academic Officer',
    label: 'Admissions & Registrar',
    email: 'academic@uniportal.edu',
    icon: Calendar,
    color: 'var(--rose-500)',
    bg: 'var(--rose-50)',
    border: '#fbcfe8',
  },
  {
    role: 'Finance Officer',
    label: 'Finance & Treasury',
    email: 'finance@uniportal.edu',
    icon: Coins,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    role: 'Super Admin',
    label: 'System Administration',
    email: 'admin@uniportal.edu',
    icon: Shield,
    color: 'var(--primary-600)',
    bg: 'var(--primary-50)',
    border: '#c7d2fe',
  },
];

export default function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [registerType, setRegisterType] = useState<'moh' | 'custom'>('moh');
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Standard form
  const [form, setForm] = useState({
    email: 'student@uniportal.edu',
    password: 'password123',
    confirm_password: 'password123',
    first_name: '',
    last_name: '',
    role: 'student',
  });

  // MOH Activation form
  const [mohForm, setMohForm] = useState({
    moh_pin: '',
    serial_number: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
  });
  const [mohVerifiedData, setMohVerifiedData] = useState<MOHVerificationResult | null>(null);
  const [verifyingMoh, setVerifyingMoh] = useState(false);

  // Password Reset state
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetChannel, setResetChannel] = useState<'sms' | 'email'>('sms');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetMaskedDestination, setResetMaskedDestination] = useState('');
  const [resetCountdown, setResetCountdown] = useState(0);
  const [resetSuccess, setResetSuccess] = useState('');

  // Countdown effect for OTP resend
  useEffect(() => {
    let timer: any;
    if (resetCountdown > 0) {
      timer = setInterval(() => {
        setResetCountdown(c => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resetCountdown]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const setMoh = (k: keyof typeof mohForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMohForm(f => ({ ...f, [k]: e.target.value }));

  const selectDemoAccount = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedDemoRole(demo.role);
    setForm(f => ({ ...f, email: demo.email, password: 'password123' }));
    setError('');
  };

  const handleVerifyMoh = async () => {
    if (!mohForm.moh_pin.trim() || !mohForm.serial_number.trim()) {
      setError('Please enter both your MOH PIN and Serial Number.');
      return;
    }
    setError('');
    setVerifyingMoh(true);
    try {
      const res = await authApi.verifyMOH({
        moh_pin: mohForm.moh_pin.trim(),
        serial_number: mohForm.serial_number.trim(),
      });
      setMohVerifiedData(res.data);
      if (res.data.email && !res.data.email.includes('@student.asdam.edu.gh')) {
        setMohForm(f => ({ ...f, email: res.data.email }));
      }
    } catch (err: any) {
      setMohVerifiedData(null);
      setError(err.response?.data?.detail || 'Verification failed. Please check your MOH PIN and Serial Number.');
    } finally {
      setVerifyingMoh(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authApi.login(form.email, form.password);
        const tokens = {
          access: res.data.tokens?.access || (res.data as any).access,
          refresh: res.data.tokens?.refresh || (res.data as any).refresh,
        };
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        const user = res.data.user || (await client.get('/users/me/')).data;
        onSuccess(user, tokens);
      } else if (registerType === 'moh') {
        if (!mohVerifiedData) {
          setError('Please verify your MOH PIN and Serial Number first.');
          setLoading(false);
          return;
        }
        if (!mohForm.password || mohForm.password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        if (!mohForm.confirm_password) {
          setError('Please confirm your password before continuing.');
          setLoading(false);
          return;
        }
        if (mohForm.password !== mohForm.confirm_password) {
          setError('Passwords do not match. Please ensure both passwords match.');
          setLoading(false);
          return;
        }
        const res = await authApi.registerMOH({
          moh_pin: mohForm.moh_pin.trim(),
          serial_number: mohForm.serial_number.trim(),
          password: mohForm.password,
          confirm_password: mohForm.confirm_password,
          email: mohForm.email.trim() || undefined,
          phone: mohForm.phone.trim() || undefined,
        });
        const { user, tokens } = res.data;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        onSuccess(user, tokens);
      } else {
        if (!form.password || form.password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        if (!form.confirm_password) {
          setError('Please confirm your password before continuing.');
          setLoading(false);
          return;
        }
        if (form.password !== form.confirm_password) {
          setError('Passwords do not match. Please ensure both passwords match.');
          setLoading(false);
          return;
        }
        const res = await client.post('/auth/register/', {
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        });
        const { user, tokens } = res.data;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        onSuccess(user, tokens);
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data) {
        const firstKey = Object.keys(err.response.data)[0];
        const firstError = err.response.data[firstKey];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError('Unable to authenticate. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!resetIdentifier.trim()) {
      setError('Please enter your Student ID, Email, Phone, or MOH PIN.');
      return;
    }
    setError('');
    setResetSuccess('');
    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset({
        identifier: resetIdentifier.trim(),
        channel: resetChannel,
      });
      setResetMaskedDestination(res.data.masked_destination);
      setResetStep(2);
      setResetCountdown(60);
      setResetSuccess(res.data.message || `Verification code dispatched via ${res.data.channel.toUpperCase()}.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send reset code. Please check your identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!resetConfirmPassword) {
      setError('Please confirm your new password.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await authApi.confirmPasswordReset({
        identifier: resetIdentifier.trim(),
        code: resetCode.trim(),
        new_password: resetNewPassword,
        confirm_password: resetConfirmPassword,
      });
      const tokens = {
        access: res.data.tokens?.access,
        refresh: res.data.tokens?.refresh,
      };
      if (tokens.access) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      onSuccess(res.data.user, tokens);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      {/* Ambient Glows */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-emerald" />

      {/* Main Glass Shell */}
      <div className="auth-shell">
        {/* ── Left Showcase Panel ── */}
        <div className="showcase-panel">
          <div>
            {/* Header Branding */}
            <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
              <div className="brand-crest">
                <GraduationCap size={22} color="#ffffff" />
              </div>
              <div>
                <div className="brand-title">UniPortal</div>
                <div className="brand-subtitle">Institutional Cloud Suite</div>
              </div>
            </div>

            {/* Headline & Subtitle */}
            <h1 className="showcase-heading">
              Unified Intelligence for Higher Education
            </h1>
            <p className="showcase-lead">
              Access real-time schedules, interactive timetable grids, verified GPA analytics, and flexible course registration in one unified portal.
            </p>

            {/* Live Showcase Feature Cards */}
            <div className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
              <div className="feature-card">
                <div className="feature-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-400)' }}>
                  <Calendar size={17} />
                </div>
                <div className="flex-1">
                  <div className="feature-title">Dynamic Visual Timetable</div>
                  <div className="feature-desc">Auto-generated weekly schedule blocks with classroom locations & instructors</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Award size={17} />
                </div>
                <div className="flex-1">
                  <div className="feature-title">Verified Transcripts & GPA Engine</div>
                  <div className="feature-desc">Institutional grading scale calculations and official watermarked PDF exports</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                  <Clock size={17} />
                </div>
                <div className="flex-1">
                  <div className="feature-title">Flexible Registration Windows</div>
                  <div className="feature-desc">Real-time seat reservations, deadline countdowns, and CSV cohort auditing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="auth-security-badge">
            <ShieldCheck size={15} color="#34d399" />
            <span>FERPA Compliant · 256-Bit SSL Encryption · Enterprise Cloud</span>
          </div>
        </div>

        {/* ── Right Auth Panel ── */}
        <div className="auth-panel">
          <div style={{ marginBottom: 14 }}>
            <h2 className="auth-header-title">
              {mode === 'login'
                ? 'Sign in to your account'
                : mode === 'forgot_password'
                ? 'Reset your password'
                : 'Create an Account'}
            </h2>
            <p className="auth-header-sub">
              {mode === 'login'
                ? 'Select a portal role or enter your credentials below'
                : mode === 'forgot_password'
                ? 'Recover access to your student or institutional portal account'
                : 'Enter your institutional details to register'}
            </p>
          </div>

          {/* Mode Switcher */}
          {mode === 'forgot_password' ? (
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setResetSuccess('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--primary-600)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          ) : (
            <div className="mode-segmented-tabs">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  className={`mode-tab-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Register / Activate'}
                </button>
              ))}
            </div>
          )}

          {/* Registration Type Sub-tabs */}
          {mode === 'register' && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: '3px', background: 'var(--slate-100)', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => { setRegisterType('moh'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: registerType === 'moh' ? '#ffffff' : 'transparent',
                  color: registerType === 'moh' ? 'var(--primary-700)' : 'var(--slate-600)',
                  fontWeight: registerType === 'moh' ? 700 : 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  boxShadow: registerType === 'moh' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <HeartPulse size={13} color="var(--emerald-600)" />
                MOH Student Activation
              </button>
              <button
                type="button"
                onClick={() => { setRegisterType('custom'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: registerType === 'custom' ? '#ffffff' : 'transparent',
                  color: registerType === 'custom' ? 'var(--primary-700)' : 'var(--slate-600)',
                  fontWeight: registerType === 'custom' ? 700 : 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  boxShadow: registerType === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Faculty / Other
              </button>
            </div>
          )}

          {/* Demo Role Switcher */}
          {mode === 'login' && (
            <div style={{ marginBottom: 14 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Instant Demo Login
                </span>
                <span style={{ fontSize: '0.65625rem', color: 'var(--slate-400)', fontWeight: 500 }}>
                  Click to select
                </span>
              </div>
              <div className="demo-role-grid">
                {DEMO_ACCOUNTS.map(demo => {
                  const Icon = demo.icon;
                  const isSelected = selectedDemoRole === demo.role && form.email === demo.email;
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => selectDemoAccount(demo)}
                      className="demo-role-btn"
                      style={{
                        borderColor: isSelected ? demo.color : 'var(--border-subtle)',
                        background: isSelected ? demo.bg : 'var(--slate-50)',
                        boxShadow: isSelected ? `0 2px 6px ${demo.color}20` : 'none',
                      }}
                    >
                      <div
                        className="demo-role-icon"
                        style={{
                          background: isSelected ? demo.color : '#ffffff',
                          color: isSelected ? '#ffffff' : demo.color,
                          border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <Icon size={13} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-900)', whiteSpace: 'nowrap' }}>
                          {demo.role}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {demo.email.split('@')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success Notice for Password Reset */}
          {resetSuccess && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 12,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--emerald-800)',
              }}
            >
              <CheckCircle2 size={15} color="var(--emerald-600)" className="shrink-0" />
              <span style={{ fontSize: '0.78125rem', fontWeight: 600 }}>{resetSuccess}</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="flex items-center gap-2 badge-danger" style={{ padding: '9px 12px', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
              <AlertCircle size={15} color="var(--rose-500)" className="shrink-0" />
              <span style={{ fontSize: '0.78125rem', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          {mode === 'forgot_password' ? (
            <div className="flex flex-col gap-3">
              {resetStep === 1 ? (
                /* Step 1: Request Code */
                <form onSubmit={handleRequestReset} className="flex flex-col gap-3">
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e40af', fontWeight: 700, fontSize: '0.8125rem' }}>
                      <KeyRound size={15} color="#2563eb" />
                      Account Self-Service Recovery
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: 3, lineHeight: 1.4 }}>
                      Enter your official Student ID (e.g. ASDAM/NUR/26/001), Registered Email, Phone Number, or MOH PIN to receive an OTP verification code.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student ID, Email, Phone, or MOH PIN</label>
                    <div className="input-wrap">
                      <User size={15} className="input-icon" />
                      <input
                        type="text"
                        className="form-input has-icon"
                        value={resetIdentifier}
                        onChange={e => setResetIdentifier(e.target.value)}
                        required
                        placeholder="e.g. ASDAM/NUR/26/001, 0241234567, or email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Channel</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setResetChannel('sms')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: resetChannel === 'sms' ? '1.5px solid var(--primary-600)' : '1px solid var(--border-light)',
                          background: resetChannel === 'sms' ? 'var(--primary-50)' : '#ffffff',
                          color: resetChannel === 'sms' ? 'var(--primary-700)' : 'var(--slate-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          cursor: 'pointer',
                          fontWeight: resetChannel === 'sms' ? 700 : 500,
                          fontSize: '0.75rem',
                          textAlign: 'left',
                        }}
                      >
                        <Smartphone size={15} color={resetChannel === 'sms' ? 'var(--primary-600)' : 'var(--slate-400)'} />
                        <div>
                          <div>SMS Text</div>
                          <div style={{ fontSize: '0.65625rem', color: resetChannel === 'sms' ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 400 }}>
                            Instant Mobile
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResetChannel('email')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: resetChannel === 'email' ? '1.5px solid var(--primary-600)' : '1px solid var(--border-light)',
                          background: resetChannel === 'email' ? 'var(--primary-50)' : '#ffffff',
                          color: resetChannel === 'email' ? 'var(--primary-700)' : 'var(--slate-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          cursor: 'pointer',
                          fontWeight: resetChannel === 'email' ? 700 : 500,
                          fontSize: '0.75rem',
                          textAlign: 'left',
                        }}
                      >
                        <Mail size={15} color={resetChannel === 'email' ? 'var(--primary-600)' : 'var(--slate-400)'} />
                        <div>
                          <div>Email</div>
                          <div style={{ fontSize: '0.65625rem', color: resetChannel === 'email' ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 400 }}>
                            Inbox Notification
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetIdentifier.trim()}
                    className="btn btn-primary"
                    style={{ marginTop: 4 }}
                  >
                    {loading ? 'Dispatching Verification Code…' : (
                      <>
                        Send Reset Code <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP & Set New Password */
                <form onSubmit={handleConfirmReset} className="flex flex-col gap-3">
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={16} color="#16a34a" className="shrink-0" />
                      <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: 1.3 }}>
                        Code sent to <strong>{resetMaskedDestination}</strong> via {resetChannel.toUpperCase()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep(1);
                        setError('');
                        setResetSuccess('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.71875rem',
                        color: 'var(--slate-600)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* 6-Digit OTP */}
                  <div className="form-group">
                    <div className="flex items-center justify-between">
                      <label className="form-label">6-Digit Verification Code</label>
                      {resetCountdown > 0 ? (
                        <span style={{ fontSize: '0.71875rem', color: 'var(--slate-400)', fontWeight: 500 }}>
                          Resend in {resetCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestReset()}
                          disabled={loading}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.71875rem',
                            color: 'var(--primary-600)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <div className="input-wrap">
                      <KeyRound size={15} className="input-icon" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="form-input has-icon"
                        value={resetCode}
                        onChange={e => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="123456"
                        required
                        style={{
                          letterSpacing: '0.35em',
                          fontSize: '1.0625rem',
                          fontWeight: 700,
                        }}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrap">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        className="form-input has-icon"
                        value={resetNewPassword}
                        onChange={e => setResetNewPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--slate-400)',
                          display: 'flex',
                          padding: 4,
                        }}
                      >
                        {showResetNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-wrap">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        className="form-input has-icon"
                        value={resetConfirmPassword}
                        onChange={e => setResetConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--slate-400)',
                          display: 'flex',
                          padding: 4,
                        }}
                      >
                        {showResetConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Live Match Feedback */}
                    {resetConfirmPassword && (
                      <div style={{ marginTop: 4, fontSize: '0.71875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {resetNewPassword === resetConfirmPassword ? (
                          <>
                            <CheckCircle2 size={13} color="#16a34a" />
                            <span style={{ color: '#16a34a' }}>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} color="#dc2626" />
                            <span style={{ color: '#dc2626' }}>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || resetCode.length !== 6 || !resetNewPassword || resetNewPassword !== resetConfirmPassword}
                    className="btn btn-primary"
                    style={{ marginTop: 4 }}
                  >
                    {loading ? 'Updating Password & Signing In…' : (
                      <>
                        Reset Password & Sign In <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : mode === 'login' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Email, Student ID, or MOH PIN</label>
                <div className="input-wrap">
                  <User size={15} className="input-icon" />
                  <input
                    type="text"
                    className="form-input has-icon"
                    value={form.email}
                    onChange={e => {
                      setSelectedDemoRole(null);
                      set('email')(e);
                    }}
                    required
                    placeholder="student@uniportal.edu or ASDAM/NUR/... or MOH-PIN"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label">Password</label>
                  <span style={{ fontSize: '0.71875rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                    Default: password123 (or Serial No.)
                  </span>
                </div>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-icon"
                    value={form.password}
                    onChange={set('password')}
                    required
                    placeholder="Enter password or Serial Number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-400)',
                      display: 'flex',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: -2, marginBottom: 2 }}>
                <div />
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setResetStep(1);
                    setError('');
                    setResetSuccess('');
                    if (form.email && !form.email.includes('@uniportal.edu')) {
                      setResetIdentifier(form.email);
                    }
                  }}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--primary-600)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
                {loading ? 'Signing in…' : (
                  <>
                    Sign in to Portal <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : registerType === 'moh' ? (
            /* MOH Student Activation Workflow */
            <div className="flex flex-col gap-3">
              {!mohVerifiedData ? (
                /* Step 1: MOH Verification */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#065f46', fontWeight: 700, fontSize: '0.8125rem' }}>
                      Admitted Students Activation
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 3 }}>
                      Enter your official Ministry of Health (MOH) PIN and Voucher Serial Number to verify your admission and retrieve your ASDAM Student ID.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">MOH PIN / Index Number</label>
                    <div className="input-wrap">
                      <KeyRound size={15} className="input-icon" />
                      <input
                        className="form-input has-icon"
                        value={mohForm.moh_pin}
                        onChange={setMoh('moh_pin')}
                        placeholder="e.g. MOH-NUR-2026-001"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Voucher Serial Number</label>
                    <div className="input-wrap">
                      <ShieldCheck size={15} className="input-icon" />
                      <input
                        className="form-input has-icon"
                        value={mohForm.serial_number}
                        onChange={setMoh('serial_number')}
                        placeholder="e.g. SN-882194"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyMoh}
                    disabled={verifyingMoh}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderColor: '#059669' }}
                  >
                    {verifyingMoh ? 'Verifying Admission Record…' : (
                      <>
                        Verify Admission Credentials <CheckCircle2 size={15} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Step 2: Verified Details & Account Activation */
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* Verified Student Badge Card */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                        <CheckCircle2 size={14} color="#16a34a" />
                        ADMISSION VERIFIED
                      </span>
                      <button
                        type="button"
                        onClick={() => { setMohVerifiedData(null); }}
                        style={{ background: 'none', border: 'none', fontSize: '0.71875rem', color: 'var(--slate-500)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>

                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {mohVerifiedData.full_name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: '0.71875rem',
                        fontWeight: 700,
                        background: mohVerifiedData.program === 'nursing' ? '#dcfce7' : '#f3e8ff',
                        color: mohVerifiedData.program === 'nursing' ? '#166534' : '#6b21a8',
                        border: mohVerifiedData.program === 'nursing' ? '1px solid #bbf7d0' : '1px solid #e9d5ff',
                      }}>
                        <HeartPulse size={12} />
                        {mohVerifiedData.program_label}
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: '0.71875rem',
                        fontWeight: 700,
                        background: '#e0e7ff',
                        color: '#3730a3',
                        border: '1px solid #c7d2fe',
                        fontFamily: 'monospace',
                      }}>
                        {mohVerifiedData.student_id}
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: '0.71875rem',
                        fontWeight: 600,
                        background: 'var(--slate-100)',
                        color: 'var(--slate-700)',
                      }}>
                        Level {mohVerifiedData.class_name} · {mohVerifiedData.admission_year}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Portal Email Address</label>
                    <div className="input-wrap">
                      <Mail size={15} className="input-icon" />
                      <input
                        type="email"
                        className="form-input has-icon"
                        value={mohForm.email}
                        onChange={setMoh('email')}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <div className="input-wrap">
                      <Phone size={15} className="input-icon" />
                      <input
                        type="tel"
                        className="form-input has-icon"
                        value={mohForm.phone}
                        onChange={setMoh('phone')}
                        placeholder="e.g. 0241234567"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Create Portal Password (min. 8 characters)</label>
                    <div className="input-wrap">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input has-icon"
                        value={mohForm.password}
                        onChange={setMoh('password')}
                        required
                        minLength={8}
                        placeholder="Choose a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--slate-400)',
                          display: 'flex',
                          padding: 4,
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Portal Password</label>
                    <div className="input-wrap">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input has-icon"
                        value={mohForm.confirm_password}
                        onChange={setMoh('confirm_password')}
                        required
                        minLength={8}
                        placeholder="Re-enter your password"
                      />
                    </div>
                    {mohForm.password && mohForm.confirm_password && (
                      <div style={{
                        fontSize: '0.75rem',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: mohForm.password === mohForm.confirm_password ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                      }}>
                        {mohForm.password === mohForm.confirm_password ? (
                          <>
                            <CheckCircle2 size={13} color="#16a34a" /> Passwords match
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} color="#dc2626" /> Passwords do not match
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (Boolean(mohForm.password) && (!mohForm.confirm_password || mohForm.password !== mohForm.confirm_password))}
                    className="btn btn-primary"
                    style={{ marginTop: 4, background: 'linear-gradient(135deg, #059669, #10b981)', borderColor: '#059669' }}
                  >
                    {loading ? 'Activating Account…' : (
                      <>
                        Activate Portal & Sign In <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Custom / Faculty registration */
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <div className="input-wrap">
                    <User size={15} className="input-icon" />
                    <input
                      className="form-input has-icon"
                      value={form.first_name}
                      onChange={set('first_name')}
                      required
                      placeholder="e.g. John"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <div className="input-wrap">
                    <User size={15} className="input-icon" />
                    <input
                      className="form-input has-icon"
                      value={form.last_name}
                      onChange={set('last_name')}
                      required
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Email</label>
                <div className="input-wrap">
                  <Mail size={15} className="input-icon" />
                  <input
                    type="email"
                    className="form-input has-icon"
                    value={form.email}
                    onChange={e => {
                      setSelectedDemoRole(null);
                      set('email')(e);
                    }}
                    required
                    placeholder="name@uniportal.edu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-icon"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-400)',
                      display: 'flex',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-icon"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    required
                    minLength={8}
                    placeholder="Re-enter your password"
                  />
                </div>
                {form.password && form.confirm_password && (
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: form.password === form.confirm_password ? '#16a34a' : '#dc2626',
                    fontWeight: 600,
                  }}>
                    {form.password === form.confirm_password ? (
                      <>
                        <CheckCircle2 size={13} color="#16a34a" /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} color="#dc2626" /> Passwords do not match
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-select" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="instructor">Faculty Instructor / Lecturer</option>
                  <option value="staff">Academic Staff Officer</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* SSO Footer */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center',
              fontSize: '0.6875rem',
              color: 'var(--slate-400)',
            }}
          >
            Protected by institutional Single Sign-On (SSO) & Multi-Factor Auth.
          </div>
        </div>
      </div>
    </div>
  );
}
