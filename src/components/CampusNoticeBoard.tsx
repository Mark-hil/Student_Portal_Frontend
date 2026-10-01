import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  User as UserIcon,
  Paperclip,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  Search,
  X,
  FileText,
  Clock,
  CheckCircle2,
  GraduationCap,
  Coins,
  ShieldAlert,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { announcementsApi } from '../api/services';
import type { Announcement, AnnouncementCategory, AnnouncementTargetAudience } from '../types';
import { useAuthStore } from '../store/authStore';
import { C } from '../utils/theme';

interface CampusNoticeBoardProps {
  compact?: boolean;
  limit?: number;
  user?: any;
}

interface CategoryStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  Icon: React.ElementType;
}

const CATEGORY_MAP: Record<AnnouncementCategory, CategoryStyle> = {
  examination: {
    label: 'Examination Notice',
    bg: '#f5f3ff',
    text: '#6d28d9',
    border: '#ddd6fe',
    Icon: FileText,
  },
  academic: {
    label: 'Academic Circular',
    bg: '#f0fdf4',
    text: '#047857',
    border: '#bbf7d0',
    Icon: GraduationCap,
  },
  financial: {
    label: 'Fees & Bursary',
    bg: '#fefce8',
    text: '#b45309',
    border: '#fef08a',
    Icon: Coins,
  },
  emergency: {
    label: 'Urgent Campus Alert',
    bg: '#fff1f2',
    text: '#be123c',
    border: '#fecdd3',
    Icon: ShieldAlert,
  },
  general: {
    label: 'General Memo',
    bg: '#f8fafc',
    text: '#334155',
    border: '#e2e8f0',
    Icon: Megaphone,
  },
};

export const CampusNoticeBoard: React.FC<CampusNoticeBoardProps> = ({ compact = false, limit, user: propUser }) => {
  const storeUser = useAuthStore().user;
  const activeUser =
    propUser ||
    storeUser ||
    (() => {
      try {
        const s = localStorage.getItem('portal_user');
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    })();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  // Admin Create Notice Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<AnnouncementCategory>('general');
  const [newAudience, setNewAudience] = useState<AnnouncementTargetAudience>('all');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = activeUser?.role ? String(activeUser.role).toLowerCase() : '';
  const canManage =
    Boolean(activeUser?.is_superuser) ||
    Boolean(activeUser?.is_staff) ||
    ['super_admin', 'super-admin', 'admin', 'academic_officer', 'academic-officer', 'staff', 'head_of_department', 'hod'].includes(
      role
    );

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await announcementsApi.getAll({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
      });
      const data = res.data as any;
      const list = Array.isArray(data) ? data : data?.results || [];
      setAnnouncements(list);
    } catch (err: any) {
      console.error('Failed to load notices:', err);
      toast.error('Could not fetch campus announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices();
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await announcementsApi.togglePin(id);
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_pinned: res.data.is_pinned } : item))
      );
      toast.success(res.data.is_pinned ? 'Notice pinned to top.' : 'Notice unpinned.');
    } catch {
      toast.error('Could not toggle pin status.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this official announcement?')) return;
    try {
      await announcementsApi.delete(id);
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      if (selectedNotice?.id === id) setSelectedNotice(null);
      toast.success('Notice deleted.');
    } catch {
      toast.error('Failed to delete notice.');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter both title and content.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await announcementsApi.create({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        target_audience: newAudience,
        attachment_url: newAttachmentUrl.trim(),
        attachment_name: newAttachmentName.trim(),
        is_pinned: newIsPinned,
      });
      toast.success('Notice broadcast successfully!');
      setAnnouncements((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setNewAudience('all');
      setNewAttachmentUrl('');
      setNewAttachmentName('');
      setNewIsPinned(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Edit Notice Modal State
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<AnnouncementCategory>('general');
  const [editAudience, setEditAudience] = useState<AnnouncementTargetAudience>('all');
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
  const [editAttachmentName, setEditAttachmentName] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const displayedList = limit ? announcements.slice(0, limit) : announcements;

  const handleStartEdit = (notice: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditCategory(notice.category);
    setEditAudience(notice.target_audience);
    setEditAttachmentUrl(notice.attachment_url || '');
    setEditAttachmentName(notice.attachment_name || '');
    setEditIsPinned(notice.is_pinned);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Please enter both title and content.');
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await announcementsApi.update(editingNotice.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        target_audience: editAudience,
        attachment_url: editAttachmentUrl.trim(),
        attachment_name: editAttachmentName.trim(),
        is_pinned: editIsPinned,
      });
      const updated = res.data;
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === editingNotice.id ? updated : item))
      );
      if (selectedNotice?.id === editingNotice.id) {
        setSelectedNotice(updated);
      }
      setEditingNotice(null);
      toast.success('Notice updated successfully!');
    } catch (err) {
      console.error('Failed to update notice:', err);
      toast.error('Failed to update notice.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(4, 19, 13, 0.06)',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* ── Institutional Header Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #04130d 0%, #064e3b 55%, #047857 100%)',
          color: '#ffffff',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(250, 204, 21, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15',
              flexShrink: 0,
            }}
          >
            <Megaphone size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                Official Campus Bulletin
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(250, 204, 21, 0.2)',
                  color: '#facc15',
                  border: '1px solid rgba(250, 204, 21, 0.4)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Principal & Academic Affairs
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(240, 253, 244, 0.85)' }}>
              Verified institutional notices, academic memos, and circulars
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 8,
                background: '#facc15',
                color: '#04130d',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(250, 204, 21, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#eab308')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#facc15')}
            >
              <Plus size={15} />
              Post Notice
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar: Category Filters & Search ── */}
      {!compact && (
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'all', label: 'All Notices' },
              { id: 'examination', label: 'Examinations' },
              { id: 'academic', label: 'Academic' },
              { id: 'financial', label: 'Fees & Bursary' },
              { id: 'emergency', label: 'Urgent Alerts' },
              { id: 'general', label: 'General' },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    borderRadius: 9999,
                    border: active ? '1px solid #047857' : '1px solid #e2e8f0',
                    background: active ? '#047857' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', minWidth: 220 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                fontSize: 12,
                padding: '6px 12px 6px 30px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#047857')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </form>
        </div>
      )}

      {/* ── Notices List ── */}
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
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
            Loading circulars...
          </div>
        ) : displayedList.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Megaphone size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              No circulars found in this category.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Check back later for verified administrative updates.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayedList.map((notice) => {
              const catTheme = CATEGORY_MAP[notice.category] || CATEGORY_MAP.general;
              const CategoryIcon = catTheme.Icon;
              const formattedDate = new Date(notice.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  style={{
                    position: 'relative',
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: notice.is_pinned ? '#fffdf0' : '#ffffff',
                    border: notice.is_pinned ? '1px solid #fde047' : '1px solid #e2e8f0',
                    borderLeft: notice.is_pinned ? '4px solid #ca8a04' : '4px solid #047857',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 120, 87, 0.08)';
                    e.currentTarget.style.borderColor = '#047857';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = notice.is_pinned ? '#fde047' : '#e2e8f0';
                    e.currentTarget.style.borderLeft = notice.is_pinned ? '4px solid #ca8a04' : '4px solid #047857';
                  }}
                >
                  {/* Top Badges Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {notice.is_pinned && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#fef08a',
                            color: '#854d0e',
                            border: '1px solid #facc15',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <Pin size={11} />
                          PINNED CIRCULAR
                        </span>
                      )}

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: 9999,
                          background: catTheme.bg,
                          color: catTheme.text,
                          border: `1px solid ${catTheme.border}`,
                        }}
                      >
                        <CategoryIcon size={12} />
                        {catTheme.label}
                      </span>

                      {notice.target_audience !== 'all' && (
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Target: <strong>{notice.target_audience_display}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Calendar size={12} />
                        {formattedDate}
                      </span>

                      {canManage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            title={notice.is_pinned ? 'Unpin' : 'Pin to top'}
                            onClick={(e) => handleTogglePin(notice.id, e)}
                            style={{
                              padding: 4,
                              borderRadius: 6,
                              background: '#f1f5f9',
                              border: 'none',
                              color: notice.is_pinned ? '#ca8a04' : '#64748b',
                              cursor: 'pointer',
                            }}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            title="Edit Notice"
                            onClick={(e) => handleStartEdit(notice, e)}
                            style={{
                              padding: 4,
                              borderRadius: 6,
                              background: '#f0fdf4',
                              border: 'none',
                              color: '#047857',
                              cursor: 'pointer',
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            title="Delete Notice"
                            onClick={(e) => handleDelete(notice.id, e)}
                            style={{
                              padding: 4,
                              borderRadius: 6,
                              background: '#fee2e2',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.35,
                    }}
                  >
                    {notice.title}
                  </h3>

                  {/* Preview Content */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: '#475569',
                      lineHeight: 1.55,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notice.content}
                  </p>

                  {/* Footer Meta */}
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#64748b',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <UserIcon size={12} style={{ color: '#047857' }} />
                      {notice.author_name || 'Academic Registry'}
                      {notice.author_role ? ` • ${notice.author_role}` : ''}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        color: '#047857',
                        fontWeight: 700,
                      }}
                    >
                      Read circular <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Read Full Notice Modal ── */}
      {selectedNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 19, 13, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedNotice(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(4, 19, 13, 0.35)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #04130d 0%, #064e3b 100%)',
                color: '#ffffff',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(250, 204, 21, 0.2)',
                    color: '#facc15',
                    border: '1px solid rgba(250, 204, 21, 0.4)',
                  }}
                >
                  {selectedNotice.category_display || selectedNotice.category.toUpperCase()}
                </span>
                <h3 style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                  {selectedNotice.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: 8,
                  padding: 6,
                  color: '#ffffff',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 22px' }}>
              {/* Meta row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 14,
                  marginBottom: 16,
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserIcon size={14} style={{ color: '#047857' }} />
                  <span>
                    Issued by: <strong>{selectedNotice.author_name || 'Academic Registry'}</strong>
                    {selectedNotice.author_role ? ` (${selectedNotice.author_role})` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} />
                  <span>
                    {new Date(selectedNotice.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Text Body */}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedNotice.content}
              </div>

              {/* Attachment if present */}
              {selectedNotice.attachment_url && (
                <div
                  style={{
                    marginTop: 20,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={16} style={{ color: '#047857' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>
                      {selectedNotice.attachment_name || 'Official Attached Document (PDF)'}
                    </span>
                  </div>

                  <a
                    href={selectedNotice.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: '#047857',
                      color: '#ffffff',
                      textDecoration: 'none',
                    }}
                  >
                    View Document <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 22px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setSelectedNotice(null)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close Memo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Post Notice Modal ── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 19, 13, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(4, 19, 13, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #04130d 0%, #064e3b 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                Publish Official Campus Circular
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Semester Examination Timetable Release"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AnnouncementCategory)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="general">General Notice</option>
                    <option value="academic">Academic Circular</option>
                    <option value="examination">Examination Notice</option>
                    <option value="financial">Fees & Bursary</option>
                    <option value="emergency">Urgent Campus Alert</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as AnnouncementTargetAudience)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="all">All Campus Accounts</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty & Lecturers</option>
                    <option value="staff">Administrative Staff</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Notice Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the full text of the circular..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Attachment Document Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exam_Timetable.pdf"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Attachment URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newIsPinned}
                    onChange={(e) => setNewIsPinned(e.target.checked)}
                    style={{ accentColor: '#047857' }}
                  />
                  <span>Pin this circular to top of bulletin board</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(4, 120, 87, 0.3)',
                  }}
                >
                  {submitting ? 'Publishing...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Notice Modal */}
      {editingNotice && (
        <div
          onClick={() => setEditingNotice(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #04130d 0%, #064e3b 50%, #047857 100%)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                Edit Official Campus Circular
              </h3>
              <button
                onClick={() => setEditingNotice(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as AnnouncementCategory)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="general">General Notice</option>
                    <option value="academic">Academic Circular</option>
                    <option value="examination">Examination Notice</option>
                    <option value="financial">Fees & Bursary</option>
                    <option value="emergency">Urgent Campus Alert</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Target Audience
                  </label>
                  <select
                    value={editAudience}
                    onChange={(e) => setEditAudience(e.target.value as AnnouncementTargetAudience)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="all">All Campus Accounts</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty & Lecturers</option>
                    <option value="staff">Administrative Staff</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Notice Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Attachment Document Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Revised_Timetable.pdf"
                    value={editAttachmentName}
                    onChange={(e) => setEditAttachmentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Attachment URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editAttachmentUrl}
                    onChange={(e) => setEditAttachmentUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    style={{ accentColor: '#047857' }}
                  />
                  <span>Pin this circular to top of bulletin board</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  style={{
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(4, 120, 87, 0.3)',
                  }}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusNoticeBoard;
