import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../../api/services';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (payload: {
    first_name: string;
    last_name: string;
    department: string;
    role: string;
  }) => void;
  isPending: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSave,
  isPending,
}) => {
  const qc = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [department, setDepartment] = useState(user.department || '');
  const [role, setRole] = useState(user.role || 'student');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const res = await adminApi.uploadUserAvatar(user.id, file);
      setAvatar(res.data.avatar || '');
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User profile photo updated to Cloudinary (uniportal-profile picture)!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSave({
      first_name: firstName,
      last_name: lastName,
      department,
      role,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 460, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>Edit User Account</h3>
        <p style={{ margin: '4px 0 18px', fontSize: 13, color: C.slate5 }}>{user.email}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Profile Photo Uploader Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: C.slate0, borderRadius: 12, border: `1px solid ${C.slate2}` }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.indigoL, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.indigo, fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
              {avatar ? (
                <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                `${firstName?.[0] || ''}${lastName?.[0] || ''}`
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.slate9 }}>User Avatar</div>
              <div style={{ fontSize: 11, color: C.slate5 }}>Folder: uniportal-profile picture</div>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                background: '#fff',
                border: `1px solid ${C.slate3}`,
                cursor: isUploadingAvatar ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: C.indigo,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>First Name</label>
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Last Name</label>
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Department</label>
            <input
              value={department}
              onChange={e => setDepartment(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
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
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{ padding: '9px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
