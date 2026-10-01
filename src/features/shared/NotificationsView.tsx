import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Inbox,
  Filter,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { C } from '../../utils/theme';
import { notificationsApi } from '../../api/services';
import { CampusNoticeBoard } from '../../components/CampusNoticeBoard';
import toast from 'react-hot-toast';

interface NotifConfig {
  Icon: React.ElementType;
  bg: string;
  color: string;
  border: string;
  category: 'academic' | 'financial' | 'system' | 'general';
}

const NOTIF_CONFIGS: Record<string, NotifConfig> = {
  grade_posted: {
    Icon: FileText,
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    category: 'academic',
  },
  enrollment_confirmed: {
    Icon: GraduationCap,
    bg: '#f0fdf4',
    color: '#065f46',
    border: '#bbf7d0',
    category: 'academic',
  },
  assignment_due: {
    Icon: Clock,
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
    category: 'academic',
  },
  grade_batch_approved: {
    Icon: CheckCircle2,
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    category: 'academic',
  },
  grade_batch_rejected: {
    Icon: ShieldAlert,
    bg: '#fff1f2',
    color: '#e11d48',
    border: '#fecdd3',
    category: 'academic',
  },
  grade_review_requested: {
    Icon: FileText,
    bg: '#f5f3ff',
    color: '#7c3aed',
    border: '#ddd6fe',
    category: 'academic',
  },
  announcement: {
    Icon: Megaphone,
    bg: '#fefce8',
    color: '#ca8a04',
    border: '#fef08a',
    category: 'general',
  },
  system: {
    Icon: ShieldCheck,
    bg: '#f8fafc',
    color: '#475569',
    border: '#e2e8f0',
    category: 'system',
  },
};

interface NotificationsViewProps {
  user?: any;
}

export function NotificationsView({ user }: NotificationsViewProps = {}) {
  const qc = useQueryClient();
  const [activeMainTab, setActiveMainTab] = useState<'bulletins' | 'personal'>('bulletins');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'academic' | 'system'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    staleTime: 30_000,
  });

  const notifs = data?.results ?? [];
  const unreadCount = notifs.filter((n: any) => !n.read).length;

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All personal alerts marked as read.');
    },
  });

  const filteredNotifs = notifs.filter((n: any) => {
    if (activeFilter === 'unread') return !n.read;
    const cfg = NOTIF_CONFIGS[n.notif_type] || NOTIF_CONFIGS.system;
    if (activeFilter === 'academic') return cfg.category === 'academic';
    if (activeFilter === 'system') return cfg.category === 'system' || cfg.category === 'general';
    return true;
  });

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 40 }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Notification & Bulletin Hub
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: 9999,
                  background: '#fef08a',
                  color: '#854d0e',
                  border: '1px solid #facc15',
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Official memos, academic circulars, exam notices, and personal account alerts.
          </p>
        </div>

        {unreadCount > 0 && activeMainTab === 'personal' && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              background: '#f0fdf4',
              color: '#047857',
              border: '1px solid #bbf7d0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#dcfce7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f0fdf4')}
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Main Tab Switcher ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '2px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveMainTab('bulletins')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: activeMainTab === 'bulletins' ? 800 : 600,
            color: activeMainTab === 'bulletins' ? '#047857' : '#64748b',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'bulletins' ? '3px solid #047857' : '3px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Megaphone size={16} />
          Campus Circulars & Bulletins
        </button>

        <button
          onClick={() => setActiveMainTab('personal')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: activeMainTab === 'personal' ? 800 : 600,
            color: activeMainTab === 'personal' ? '#047857' : '#64748b',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'personal' ? '3px solid #047857' : '3px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bell size={16} />
          Personal Alerts & Activity
          {unreadCount > 0 && (
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ca8a04',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeMainTab === 'bulletins' ? (
        <div>
          <CampusNoticeBoard user={user} />
        </div>
      ) : (
        <div>
          {/* Sub Filters Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'academic', label: 'Academics & Grades' },
              { id: 'system', label: 'System & Registry' },
            ].map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  style={{
                    padding: '5px 13px',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    borderRadius: 9999,
                    border: active ? '1px solid #047857' : '1px solid #e2e8f0',
                    background: active ? '#047857' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 2px 6px rgba(4, 120, 87, 0.2)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Personal Alerts Feed */}
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid #047857',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 10px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Loading alerts...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '48px 20px',
                textAlign: 'center',
              }}
            >
              <Inbox size={42} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                All caught up!
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                No notifications matching this filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredNotifs.map((n: any) => {
                const cfg = NOTIF_CONFIGS[n.notif_type] || NOTIF_CONFIGS.system;
                const IconComponent = cfg.Icon;
                const isUnread = !n.read;

                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && markOne.mutate(n.id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 18px',
                      borderRadius: 12,
                      background: isUnread ? '#fafffd' : '#ffffff',
                      border: isUnread ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      borderLeft: isUnread ? '4px solid #047857' : '4px solid #cbd5e1',
                      boxShadow: isUnread
                        ? '0 2px 8px rgba(4, 120, 87, 0.06)'
                        : '0 1px 2px rgba(0, 0, 0, 0.02)',
                      cursor: isUnread ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (isUnread) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(4, 120, 87, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isUnread) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(4, 120, 87, 0.06)';
                      }
                    }}
                  >
                    {/* Icon Badge */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cfg.color,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <IconComponent size={18} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isUnread ? 800 : 600,
                              color: isUnread ? '#0f172a' : '#334155',
                            }}
                          >
                            {n.title}
                          </span>
                          {isUnread && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#047857',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>

                        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(n.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {n.body}
                      </div>

                      {isUnread && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markOne.mutate(n.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#047857',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsView;
