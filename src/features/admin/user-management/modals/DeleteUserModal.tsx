import React, { useState } from 'react';
import { Trash2, AlertOctagon, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../../../utils/theme';
import { Spinner } from '../../../../components/ui/Spinner';
import type { User, DeletionPrecheckResult } from '../../../../types';

interface DeleteUserModalProps {
  target: User;
  onClose: () => void;
  onSoftDelete: (reason: string) => void;
  isSoftDeleting: boolean;
  onHardDelete: (force: boolean, reason: string) => void;
  isHardDeleting: boolean;
  precheckData: DeletionPrecheckResult | null;
  isLoadingPrecheck: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  target,
  onClose,
  onSoftDelete,
  isSoftDeleting,
  onHardDelete,
  isHardDeleting,
  precheckData,
  isLoadingPrecheck,
}) => {
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>(target.is_deleted ? 'hard' : 'soft');
  const [deleteReason, setDeleteReason] = useState('');
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState(false);

  const handleSoftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSoftDelete(deleteReason);
  };

  const handleHardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteReason.trim()) {
      toast.error('A reason must be supplied for permanent deletion.');
      return;
    }
    onHardDelete(forceDeleteConfirm, deleteReason);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              User Account Deletion & Archival
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {target.first_name} {target.last_name} ({target.email})
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setDeleteMode('soft')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: deleteMode === 'soft' ? '#fff' : 'transparent',
              color: deleteMode === 'soft' ? C.slate9 : C.slate5,
              boxShadow: deleteMode === 'soft' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Safe Archival (Soft Delete)
          </button>
          <button
            type="button"
            onClick={() => setDeleteMode('hard')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: deleteMode === 'hard' ? '#fee2e2' : 'transparent',
              color: deleteMode === 'hard' ? '#b91c1c' : C.slate5,
              boxShadow: deleteMode === 'hard' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Permanent Purge (Hard Delete)
          </button>
        </div>

        {deleteMode === 'soft' ? (
          <form onSubmit={handleSoftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', border: `1px solid ${C.slate2}`, borderRadius: 12, padding: 14, fontSize: 13, color: C.slate7, lineHeight: 1.5 }}>
              <strong>Safe & Reversible:</strong> Soft-deleting will deactivate login access and hide the account from default directories. All financial statements, payments, course grades, and personal files remain permanently intact and can be fully restored at any time.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
                Archival Reason (Optional)
              </label>
              <input
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. Duplicate account, requested archive"
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: C.slate6, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSoftDeleting}
                style={{ padding: '9px 20px', background: '#475569', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isSoftDeleting && <Loader2 size={16} className="animate-spin" />}
                Archive User Account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleHardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isLoadingPrecheck ? (
              <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>
            ) : precheckData ? (
              <div style={{ background: '#f8fafc', border: `1px solid ${C.slate2}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8, marginBottom: 8 }}>Institutional Pre-Audit Check:</div>
                {precheckData.can_hard_delete ? (
                  <div style={{ padding: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: 12.5, color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} />
                    <span>Eligible for permanent deletion. No financial payments or transcripts blocking deletion.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#991b1b', lineHeight: 1.4 }}>
                      <AlertOctagon size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                      <strong>Guarded by Institutional Policy:</strong> Permanent deletion is restricted to preserve institutional records.
                    </div>
                    {precheckData.blockers.map((b, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6 }}>
                        <span>•</span> {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {!precheckData?.can_hard_delete && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#991b1b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={forceDeleteConfirm}
                  onChange={e => setForceDeleteConfirm(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#b91c1c' }}
                />
                <span>
                  I am an authorized Superadmin and explicitly confirm forced permanent destruction of all associated records.
                </span>
              </label>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
                Purge Reason / Justification <span style={{ color: C.rose }}>*</span>
              </label>
              <input
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="State reason for permanent deletion"
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: C.slate6, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isHardDeleting ||
                  (!precheckData?.can_hard_delete && !forceDeleteConfirm)
                }
                style={{
                  padding: '9px 20px',
                  background: '#b91c1c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: (!precheckData?.can_hard_delete && !forceDeleteConfirm) ? 'not-allowed' : 'pointer',
                  opacity: (!precheckData?.can_hard_delete && !forceDeleteConfirm) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isHardDeleting && <Loader2 size={16} className="animate-spin" />}
                Permanently Purge Record
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
