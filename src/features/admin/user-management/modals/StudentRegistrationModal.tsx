import React from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  Users,
  Building,
  HeartPulse,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../../../api/services';
import { C } from '../../../../utils/theme';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import type { User } from '../../../../types';

interface StudentRegistrationModalProps {
  user: User | null;
  onClose: () => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  user,
  onClose,
}) => {
  const { isMobile } = useBreakpoint();

  if (!user) return null;

  const handleResendCredentials = async () => {
    try {
      toast.loading('Dispatching credentials...', { id: 'modal-resend' });
      await adminApi.resendCredentials(user.id);
      toast.success(`Welcome SMS & Email resent to ${user.email}`, { id: 'modal-resend' });
    } catch {
      toast.error('Failed to resend credentials.', { id: 'modal-resend' });
    }
  };

  return (
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
                  background: user.is_registered ? '#dcfce7' : '#fef3c7',
                  color: user.is_registered ? '#15803d' : '#b45309',
                  border: user.is_registered ? '1px solid #bbf7d0' : '1px solid #fde68a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  {user.is_registered ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {user.is_registered ? 'Registration Completed & Verified' : 'Pending Student Registration'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: C.slate5, marginTop: 3 }}>
                Arch-Bishop Porter College of Health & Allied Sciences (ASDAM)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.slate5, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Identification Banner */}
        <div style={{ background: C.slate0, border: `1px solid ${C.slate2}`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.indigoL, color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.slate9 }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: 12.5, color: C.slate6, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>ID: <strong style={{ fontFamily: 'monospace', color: C.indigo }}>{user.student_id || 'Pending'}</strong></span>
                <span>Program: <strong>{user.program === 'nursing' ? 'Diploma in Nursing' : user.program === 'midwifery' ? 'Diploma in Midwifery' : (user.department || 'Nursing')}</strong></span>
                <span>Level: <strong>{user.class_name || '100'}</strong></span>
              </div>
            </div>
          </div>
          {user.profile?.registration_completed_at && (
            <div style={{ textAlign: 'right', fontSize: 11.5, color: C.slate5 }}>
              Completed On: <strong style={{ color: C.slate7 }}>{new Date(user.profile.registration_completed_at).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* If Pending Banner */}
        {!user.is_registered && (
          <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} className="shrink-0" />
              <div>
                <strong>Registration Incomplete:</strong> The student has received their temporary credentials and portal URL (http://localhost:3000), but has not completed their mandatory profile submission.
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendCredentials}
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
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.first_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Surname</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.last_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Ghana Card ID</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.indigo, marginTop: 2, fontFamily: 'monospace' }}>
                  {user.profile?.ghana_card || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Gender</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.gender || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Date of Birth</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.date_of_birth || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Birth Place (Town/City)</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.birth_place || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Country of Birth</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.country_of_birth || 'Ghana'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Nationality</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.nationality || 'Ghanaian'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Languages Spoken</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.languages_spoken || '—'}</div>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : 'span 3' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Medical Condition / Disability</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.medical_condition || 'None reported'}</div>
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
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.residential_address || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Digital Address (GPS)</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#059669', marginTop: 2, fontFamily: 'monospace' }}>
                  {user.profile?.digital_address || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>City / Town</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.city || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Region</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.region || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>District</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.district || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Primary Mobile Phone</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{user.phone || '—'}</div>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.email}</div>
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
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{user.profile?.guardian_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Contact Number</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate9, marginTop: 2 }}>{user.profile?.guardian_phone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate5, textTransform: 'uppercase' }}>Relationship</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.slate9, marginTop: 2 }}>{user.profile?.guardian_relationship || 'Parent / Guardian'}</div>
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
              onClick={onClose}
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
  );
};
