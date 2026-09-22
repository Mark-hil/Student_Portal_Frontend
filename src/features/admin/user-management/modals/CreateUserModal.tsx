import React, { useState, useEffect } from 'react';
import { Users, Phone, Sparkles, Check, Loader2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { C } from '../../../../utils/theme';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import type { User } from '../../../../types';

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  program: string;
  class_name: string;
  department: string;
}

interface CreateUserModalProps {
  mode?: 'students' | 'staff';
  isOpen: boolean;
  currentUser?: User;
  onClose: () => void;
  onCreate: (userData: CreateUserData) => void;
  isPending: boolean;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  mode = 'students',
  isOpen,
  currentUser,
  onClose,
  onCreate,
  isPending,
}) => {
  const { isMobile } = useBreakpoint();
  const isActorSuperAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'super-admin' ||
    currentUser?.role === 'admin' ||
    (currentUser as any)?.is_superuser;

  const [newUser, setNewUser] = useState<CreateUserData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: mode === 'students' ? 'student' : 'lecturer',
    program: 'nursing',
    class_name: '100',
    department: mode === 'students' ? 'Nursing' : '',
  });

  useEffect(() => {
    if (isOpen) {
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: mode === 'students' ? 'student' : 'lecturer',
        program: 'nursing',
        class_name: '100',
        department: mode === 'students' ? 'Nursing' : '',
      });
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.first_name.trim() || !newUser.last_name.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }
    if (!newUser.email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    onCreate(newUser);
  };

  const isStudentCreation = newUser.role === 'student';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isStudentCreation ? '#ecfdf5' : '#e0e7ff',
              color: isStudentCreation ? '#047857' : '#3730a3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isStudentCreation ? <Users size={22} /> : <Shield size={22} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.slate9 }}>
              {isStudentCreation ? 'Register New Student Account' : 'Add Staff / Faculty Member'}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {isStudentCreation
                ? 'Provisions institutional ASDAM Student ID and dispatches credentials via SMS/Email'
                : 'Assign institutional staff role, department, and portal credentials'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Role selector */}
          {mode === 'staff' ? (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>
                Staff Institutional Role
              </label>
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, background: '#fff', fontWeight: 600 }}
              >
                <option value="lecturer">Lecturer / Faculty</option>
                <option value="head_of_department">Head of Department (HOD)</option>
                <option value="academic_officer">Academic Officer</option>
                <option value="finance">Finance Officer</option>
                {isActorSuperAdmin && (
                  <option value="super_admin">Super Administrator</option>
                )}
              </select>
            </div>
          ) : (
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

          {/* First & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>First Name</label>
              <input
                placeholder={isStudentCreation ? 'e.g. Ama' : 'e.g. Kwesi'}
                value={newUser.first_name}
                onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Last Name / Surname</label>
              <input
                placeholder={isStudentCreation ? 'e.g. Mensah' : 'e.g. Appiah'}
                value={newUser.last_name}
                onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Email Address</label>
            <input
              type="email"
              placeholder={isStudentCreation ? 'e.g. ama.mensah@gmail.com' : 'e.g. kwesi.appiah@uniportal.edu'}
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
            />
          </div>

          {/* Phone Number */}
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

          {/* Department field for Staff */}
          {!isStudentCreation && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>Department / Faculty</label>
              <input
                placeholder="e.g. Computer Science, Nursing Sciences, or General Sciences"
                value={newUser.department}
                onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Temporary Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 5 }}>
              Temporary Password (Optional)
            </label>
            <input
              type="text"
              placeholder={isStudentCreation ? 'Leave blank to auto-generate serial code (e.g. SN-XXXXXX)' : 'Leave blank for default: TempPass123!'}
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, boxSizing: 'border-box' }}
            />
          </div>

          {isStudentCreation && (
            <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={14} /> Automatic ASDAM ID & Profile Registration Gate
              </div>
              Upon account creation, the student is assigned an official Student ID (e.g. <code>ASDAM/NUR/26/001</code>). They will receive an SMS and Email with their credentials and the Portal URL.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14, borderTop: `1px solid ${C.slate1}`, paddingTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: C.slate7 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{ padding: '10px 22px', background: isStudentCreation ? '#059669' : C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isPending ? 'Registering...' : isStudentCreation ? 'Register Student' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
