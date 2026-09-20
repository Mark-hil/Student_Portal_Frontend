import React from 'react';
import { History, X, Info } from 'lucide-react';
import { C } from '../../../../utils/theme';
import { Spinner } from '../../../../components/ui/Spinner';
import type { User, AcademicProgressionLog } from '../../../../types';

interface ProgressionHistoryModalProps {
  target: User;
  logs: AcademicProgressionLog[];
  isLoading: boolean;
  onClose: () => void;
}

export const ProgressionHistoryModal: React.FC<ProgressionHistoryModalProps> = ({
  target,
  logs,
  isLoading,
  onClose,
}) => {
  const actionColors: Record<string, { bg: string; text: string }> = {
    promotion: { bg: '#e0e7ff', text: '#3730a3' },
    demotion: { bg: '#fef3c7', text: '#92400e' },
    withdrawal: { bg: '#fee2e2', text: '#991b1b' },
    reinstatement: { bg: '#dcfce7', text: '#166534' },
    graduation: { bg: '#ede9fe', text: '#5b21b6' },
    soft_delete: { bg: '#f1f5f9', text: '#475569' },
    restore: { bg: '#dcfce7', text: '#166534' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f1f5f9', color: C.slate7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
                Progression & Audit History
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
                {target.first_name} {target.last_name} ({target.student_id || 'ID: Pending'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: C.slate5 }}>
            <Info size={28} style={{ margin: '0 auto 8px', color: C.slate4 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No progression events recorded yet for this student.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {logs.map(log => {
              const color = actionColors[log.action] || { bg: '#f1f5f9', text: '#475569' };

              return (
                <div key={log.id} style={{ border: `1px solid ${C.slate2}`, borderRadius: 12, padding: 14, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: color.bg, color: color.text }}>
                        {log.action_display || log.action}
                      </span>
                      {log.from_level && log.to_level && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.slate7 }}>
                          Level {log.from_level} ➔ Level {log.to_level}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11.5, color: C.slate4 }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  {log.reason && (
                    <p style={{ margin: '6px 0', fontSize: 12.5, color: C.slate8, background: '#fff', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.slate1}` }}>
                      {log.reason}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: C.slate5, marginTop: 6, flexWrap: 'wrap' }}>
                    {log.academic_year && <span>Academic Year: <strong>{log.academic_year}</strong></span>}
                    {log.performed_by_name && <span>Authorized by: <strong>{log.performed_by_name}</strong></span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '9px 20px', background: C.slate8, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
