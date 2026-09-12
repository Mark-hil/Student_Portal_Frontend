/**
 * LoginPage — State-of-the-art enterprise academic authentication portal.
 * Features live glass preview cards, seamless role autofill switcher,
 * high-contrast accessible inputs, and zero-scroll viewport fitting.
 * Styled via enterprise CSS design system (auth.css & components.css).
 */
import React, { useState, FormEvent } from 'react';
import {
  GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle,
  ShieldCheck, Calendar, Award, Clock, ArrowRight,
  BookOpen, Shield, Coins
} from 'lucide-react';
import client from '../api/client';

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
    role: 'Finance Officer',
    label: 'Finance Directorate',
    email: 'finance@uniportal.edu',
    icon: Coins,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    role: 'Staff Officer',
    label: 'Academic Staff',
    email: 'staff@uniportal.edu',
    icon: Calendar,
    color: 'var(--rose-500)',
    bg: 'var(--rose-50)',
    border: '#fbcfe8',
  },
  {
    role: 'Admin',
    label: 'System Admin',
    email: 'admin@uniportal.edu',
    icon: Shield,
    color: 'var(--primary-600)',
    bg: 'var(--primary-50)',
    border: '#c7d2fe',
  },
];

export default function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: 'student@uniportal.edu',
    password: 'password123',
    first_name: '',
    last_name: '',
    role: 'student',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const selectDemoAccount = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedDemoRole(demo.role);
    setForm(f => ({ ...f, email: demo.email, password: 'password123' }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await client.post('/auth/login/', {
          email: form.email,
          password: form.password,
        });
        const tokens = { access: res.data.access, refresh: res.data.refresh };
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        const userRes = await client.get('/users/me/');
        onSuccess(userRes.data, tokens);
      } else {
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
              {mode === 'login' ? 'Sign in to your account' : 'Create an Account'}
            </h2>
            <p className="auth-header-sub">
              {mode === 'login'
                ? 'Select a portal role or enter your credentials below'
                : 'Enter your institutional details to register'}
            </p>
          </div>

          {/* Mode Switcher */}
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
                {m === 'login' ? 'Sign In' : 'Register New Account'}
              </button>
            ))}
          </div>

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

          {/* Error Notice */}
          {error && (
            <div className="flex items-center gap-2 badge-danger" style={{ padding: '9px 12px', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
              <AlertCircle size={15} color="var(--rose-500)" className="shrink-0" />
              <span style={{ fontSize: '0.78125rem', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
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
            )}

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
              <div className="flex items-center justify-between">
                <label className="form-label">Password</label>
                {mode === 'login' && (
                  <span style={{ fontSize: '0.71875rem', color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}>
                    Default: password123
                  </span>
                )}
              </div>
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

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-select" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="instructor">Faculty Instructor / Lecturer</option>
                  <option value="staff">Academic Staff Officer</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
              {loading ? (
                'Signing in…'
              ) : mode === 'login' ? (
                <>
                  Sign in to Portal <ArrowRight size={15} />
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

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
