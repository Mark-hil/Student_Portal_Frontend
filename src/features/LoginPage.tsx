/**
 * LoginPage — clean, accessible login/register form.
 * Handles JWT storage, error display, and redirect on success.
 */
import { useState, FormEvent } from 'react';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import client from '../api/client';

interface Props {
  onSuccess: (user: any, tokens: any) => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const res = await client.post('/auth/login/', {
          email: form.email,
          password: form.password
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
          role: form.role
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
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px 11px 40px',
    border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14,
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' as const,
    background: '#f8fafc', color: '#0f172a',
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };
  const iconStyle = { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: "'Sora', 'Inter', system-ui, sans-serif",
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.12)' }} />
        <div style={{ position: 'absolute', bottom: 60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(16,185,129,0.1)' }} />
        <div style={{ position: 'absolute', top: '40%', right: 40, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ background: '#6366f1', borderRadius: 14, padding: '10px 12px' }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>UniPortal</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Student Hub</div>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px' }}>
            Your academic life,<br />
            <span style={{ color: '#818cf8' }}>all in one place.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
            Track courses, grades, assignments, and notifications — built for students who mean business.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📚', label: 'Enroll in courses and track progress' },
              { icon: '📊', label: 'Real-time grade updates and GPA tracking' },
              { icon: '🔔', label: 'Smart deadline reminders and notifications' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 480, background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 52px',
      }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {mode === 'login' ? 'Sign in to access your student portal.' : 'Join your university portal today.'}
          </p>
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#0f172a' : '#94a3b8',
              fontSize: 13, fontWeight: mode === m ? 600 : 400,
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 20,
          }}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['first_name', 'First name'], ['last_name', 'Last name']].map(([k, label]) => (
                <div key={k}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={iconStyle} />
                    <input value={form[k as keyof typeof form]} onChange={set(k as keyof typeof form)}
                      required placeholder={label} style={inputStyle} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label style={labelStyle}>Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle} />
              <input type="email" value={form.email} onChange={set('email')} required
                placeholder="you@university.edu" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle} />
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={set('password')} required minLength={8}
                placeholder={mode === 'login' ? '••••••••' : 'Min. 8 characters'}
                style={{ ...inputStyle, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label style={labelStyle}>I am a...</label>
              <select value={form.role} onChange={set('role')} style={{ ...inputStyle, paddingLeft: 14, appearance: 'none' }}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#c7d2fe' : '#6366f1', color: '#fff',
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            transition: 'background 0.2s, transform 0.1s',
            transform: loading ? 'none' : undefined,
          }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 28 }}>
          By signing in you agree to our{' '}
          <span style={{ color: '#6366f1', cursor: 'pointer' }}>Terms of Service</span>{' '}
          and{' '}
          <span style={{ color: '#6366f1', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
