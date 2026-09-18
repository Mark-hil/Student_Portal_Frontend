/**
 * StudentRegistrationOnboarding.tsx
 * Mandatory First-Time Student Profile Registration Wizard (based on info.txt).
 * Hard gate: Students must complete this registration before gaining access to portal features.
 */
import React, { useState } from 'react';
import {
  GraduationCap, User, MapPin, Users, Lock, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, ShieldCheck, HeartPulse,
  Phone, Mail, Calendar, Globe, Building2, Sparkles, LogOut,
  CreditCard, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/services';
import type { User as UserType, StudentRegistrationPayload } from '../../types';

interface Props {
  user: UserType;
  onComplete: (updatedUser: UserType) => void;
  onLogout: () => void;
}

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Western North', 'Central',
  'Eastern', 'Volta', 'Oti', 'Northern', 'Savannah', 'North East',
  'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo'
];

export function StudentRegistrationOnboarding({ user, onComplete, onLogout }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCelebration, setSuccessCelebration] = useState(false);

  // Form State initialized with any known data from roster
  const [formData, setFormData] = useState<StudentRegistrationPayload>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    ghana_card: user.profile?.ghana_card || '',
    gender: user.profile?.gender || 'Female',
    date_of_birth: user.profile?.date_of_birth || '',
    birth_place: user.profile?.birth_place || '',
    country_of_birth: user.profile?.country_of_birth || 'Ghana',
    nationality: user.profile?.nationality || 'Ghanaian',
    languages_spoken: user.profile?.languages_spoken || 'English, Twi',
    medical_condition: user.profile?.medical_condition || 'None',

    residential_address: user.profile?.residential_address || '',
    city: user.profile?.city || '',
    region: user.profile?.region || 'Ashanti',
    district: user.profile?.district || '',
    digital_address: user.profile?.digital_address || '',
    phone: user.phone || '',
    email: user.email || '',

    guardian_name: user.profile?.guardian_name || '',
    guardian_phone: user.profile?.guardian_phone || '',
    guardian_relationship: user.profile?.guardian_relationship || 'Parent',

    new_password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (k: keyof StudentRegistrationPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [k]: e.target.value }));
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Please provide your First Names and Surname.');
      return false;
    }
    if (!formData.ghana_card.trim()) {
      setError('Ghana Card ID is required (e.g. GHA-712345678-9).');
      return false;
    }
    if (!formData.date_of_birth) {
      setError('Please select your Date of Birth.');
      return false;
    }
    if (!formData.birth_place.trim()) {
      setError('Please provide your Birth Place (Town/City).');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.residential_address.trim() || !formData.city.trim() || !formData.district.trim()) {
      setError('Please fill in Residential Address, City/Town, and District.');
      return false;
    }
    if (!formData.digital_address.trim()) {
      setError('Digital Address (Ghana Post GPS e.g. AK-039-5028) is required.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please provide your Primary Phone Number.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.guardian_name.trim() || !formData.guardian_phone.trim()) {
      setError('Please provide your Parent / Guardian / Next of Kin Full Name and Phone Number.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s => Math.min(s + 1, 4) as any));
  };

  const handlePrev = () => {
    setError('');
    setStep((s => Math.max(s - 1, 1) as any));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.new_password) {
      if (formData.new_password.length < 8) {
        setError('New permanent password must be at least 8 characters.');
        return;
      }
      if (formData.new_password !== confirmPassword) {
        setError('Passwords do not match. Please confirm your password.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await authApi.completeRegistration(formData);
      const updatedUser = res.data.user;
      
      // Update access and refresh tokens if provided
      if (res.data.tokens) {
        localStorage.setItem('portal_access', res.data.tokens.access);
        localStorage.setItem('portal_refresh', res.data.tokens.refresh);
      }
      localStorage.setItem('portal_user', JSON.stringify(updatedUser));

      toast.success('Registration completed successfully! Welcome to ASDAM Portal.');
      setSuccessCelebration(true);

      setTimeout(() => {
        onComplete(updatedUser);
      }, 2200);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to complete registration. Please verify your inputs.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast.error('Validation error. Please review the highlighted fields.');
    } finally {
      setLoading(false);
    }
  };

  const stepProgress = ((step - 1) / 3) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 100%)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 48px',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Top Bar with Sign Out */}
      <header
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)',
            }}
          >
            <GraduationCap size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              ASDAM Student Portal
            </div>
            <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>
              Arch-Bishop Porter College of Health & Allied Sciences
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
            e.currentTarget.style.color = '#fda4af';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </header>

      {/* Main Container Card */}
      <main
        style={{
          width: '100%',
          maxWidth: 960,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '36px 32px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 280,
            height: 280,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Success Celebration Overlay */}
        {successCelebration && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              textAlign: 'center',
              padding: 24,
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)',
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Registration Verified & Completed!
            </h2>
            <p style={{ fontSize: 14.5, color: '#94a3b8', maxWidth: 460, lineHeight: 1.6, marginBottom: 20 }}>
              Your student profile has been submitted and permanently verified.
              Full access to the <strong>{user.program === 'midwifery' ? 'Midwifery' : 'Nursing'}</strong> Student Portal is now unlocked.
            </p>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 14,
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#c7d2fe',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Sparkles size={18} color="#818cf8" /> Entering ASDAM Portal...
            </div>
          </div>
        )}

        {/* Header Title & Badges */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: 11.5,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 99,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={13} /> Mandatory Action Required
            </span>
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#c7d2fe',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 99,
              }}
            >
              ID: {user.student_id || 'ASDAM Student'}
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            First-Time Student Profile Registration
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Welcome to ASDAM. As a newly enrolled student, institutional policies require you to complete your official bio-data, 
            Ghana Card identification, and emergency contact details before accessing courses, semester grades, and academic services.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { num: 1, label: 'Personal Details', icon: User },
              { num: 2, label: 'Contact & Address', icon: MapPin },
              { num: 3, label: 'Guardian / Kin', icon: Users },
              { num: 4, label: 'Security & Finish', icon: Lock },
            ].map(({ num, label, icon: Icon }) => {
              const active = step === num;
              const passed = step > num;
              return (
                <div
                  key={num}
                  onClick={() => {
                    if (passed) setStep(num as any);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: active
                      ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%)'
                      : passed
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${
                      active
                        ? '#6366f1'
                        : passed
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(255, 255, 255, 0.06)'
                    }`,
                    cursor: passed ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: active
                        ? '#4f46e5'
                        : passed
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {passed ? <CheckCircle2 size={16} /> : num}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: active ? '#818cf8' : passed ? '#34d399' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Step 0{num}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : passed ? '#e2e8f0' : '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Line */}
          <div style={{ height: 4, width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stepProgress}%`,
                background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: 13.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div>
                <label style={labelStyle}>First Names *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.first_name}
                  onChange={handleChange('first_name')}
                  placeholder="e.g. Abena Serwaa"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Surname *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.last_name}
                  onChange={handleChange('last_name')}
                  placeholder="e.g. Osei"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Ghana Card ID (National ID) *
                  <span style={{ fontSize: 11, color: '#818cf8', marginLeft: 6 }}>Format: GHA-XXXXXXXXX-X</span>
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.ghana_card}
                  onChange={handleChange('ghana_card')}
                  placeholder="e.g. GHA-726189102-4"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Gender *</label>
                <select
                  style={inputStyle}
                  value={formData.gender}
                  onChange={handleChange('gender')}
                  required
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Date of Birth *</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={formData.date_of_birth}
                  onChange={handleChange('date_of_birth')}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Birth Place (Town / City) *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.birth_place}
                  onChange={handleChange('birth_place')}
                  placeholder="e.g. Kumasi"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Country of Birth</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.country_of_birth}
                  onChange={handleChange('country_of_birth')}
                  placeholder="Ghana"
                />
              </div>

              <div>
                <label style={labelStyle}>Nationality</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                  placeholder="Ghanaian"
                />
              </div>

              <div>
                <label style={labelStyle}>Languages Spoken</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.languages_spoken}
                  onChange={handleChange('languages_spoken')}
                  placeholder="e.g. English, Twi, Ga"
                />
              </div>

              <div>
                <label style={labelStyle}>Medical Condition / Disability (if any)</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.medical_condition}
                  onChange={handleChange('medical_condition')}
                  placeholder="Enter 'None' or describe allergies / conditions"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & ADDRESS */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Residential Address *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.residential_address}
                  onChange={handleChange('residential_address')}
                  placeholder="e.g. House No. 24, Ring Road Central, Near Shell"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>City / Town *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.city}
                  onChange={handleChange('city')}
                  placeholder="e.g. Kumasi / Sunyani"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Region *</label>
                <select
                  style={inputStyle}
                  value={formData.region}
                  onChange={handleChange('region')}
                  required
                >
                  {GHANA_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg} Region</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>District *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.district}
                  onChange={handleChange('district')}
                  placeholder="e.g. Kumasi Metropolitan District"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Digital Address (Ghana Post GPS) *
                  <span style={{ fontSize: 11, color: '#818cf8', marginLeft: 6 }}>e.g. AK-039-5028</span>
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.digital_address}
                  onChange={handleChange('digital_address')}
                  placeholder="e.g. AK-039-5028"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Primary Mobile Phone Number *</label>
                <input
                  type="tel"
                  style={inputStyle}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="e.g. 0241234567"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Personal Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="e.g. student@gmail.com"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PARENT / GUARDIAN / NEXT OF KIN */}
          {step === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1', background: 'rgba(99, 102, 241, 0.08)', padding: 16, borderRadius: 14, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#c7d2fe', fontSize: 13.5, fontWeight: 700 }}>
                  <Info size={18} /> Emergency Contact & Next of Kin Information
                </div>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Please ensure this phone number is active. In case of academic notifications or medical emergencies on campus, 
                  the institution will contact this guardian immediately.
                </p>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Parent / Guardian / Next of Kin Full Name *</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.guardian_name}
                  onChange={handleChange('guardian_name')}
                  placeholder="e.g. Mr. Kwame Mensah"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Guardian Contact Number *</label>
                <input
                  type="tel"
                  style={inputStyle}
                  value={formData.guardian_phone}
                  onChange={handleChange('guardian_phone')}
                  placeholder="e.g. 0209876543"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Relationship to Student</label>
                <select
                  style={inputStyle}
                  value={formData.guardian_relationship}
                  onChange={handleChange('guardian_relationship')}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Legal Guardian</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Next of Kin">Other Next of Kin</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: SECURITY & FINISH */}
          {step === 4 && (
            <div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="#818cf8" /> Profile Verification Summary
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Full Name:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.first_name} {formData.last_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Student ID:</span>{' '}
                    <strong style={{ color: '#818cf8' }}>{user.student_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Ghana Card:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.ghana_card}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Gender / DOB:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.gender} · {formData.date_of_birth}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Residential:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.city}, {formData.region}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Digital GPS:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.digital_address}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Guardian:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.guardian_name} ({formData.guardian_relationship})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Guardian Tel:</span>{' '}
                    <strong style={{ color: '#fff' }}>{formData.guardian_phone}</strong>
                  </div>
                </div>
              </div>

              {/* Set Permanent Password */}
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 16, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#c7d2fe', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                  <Lock size={18} color="#818cf8" /> Set Permanent Account Password
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
                  You logged in with your temporary voucher Serial Number. Create a secure personal password 
                  to protect your portal account going forward. (Minimum 8 characters).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>New Permanent Password</label>
                    <input
                      type="password"
                      style={inputStyle}
                      value={formData.new_password || ''}
                      onChange={handleChange('new_password')}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password"
                      style={inputStyle}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              paddingTop: 20,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> Previous
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 26px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 32px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                }}
              >
                {loading ? 'Submitting Registration...' : 'Complete Registration & Access Portal'}
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 700,
  color: '#cbd5e1',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
};
