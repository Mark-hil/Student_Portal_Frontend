import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Shield } from 'lucide-react';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';

export function UserManagement() {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'student'
  });

  const { data, isLoading } = useQuery({ 
    queryKey:['users','list', {search, roleFilter}], 
    queryFn:()=>adminApi.listUsers({ search, role: roleFilter }).then(r=>r.data), 
    staleTime:30_000 
  });
  
  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser(newUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
      setIsModalOpen(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'student' });
    }
  });

  const users = data?.results ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>User Directory & Permissions</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.slate5 }}>Manage portal accounts, roles, departmental assignments, and authentication status.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 20px',
            background: C.indigo,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Plus size={17} /> Add New User
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 260 }}>
          <Search size={16} color={C.slate4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or institutional ID…"
            style={{ width: '100%', padding: '11px 16px 11px 40px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '11px 16px', border: `1px solid ${C.slate2}`, borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: C.slate7, background: '#fff', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
        >
          <option value="">All Portal Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Faculty Instructors</option>
          <option value="staff">Staff Officers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : users.length === 0 ? (
          <Empty icon={Users} title="No users found" sub="Try adjusting your search or role filters." />
        ) : (
          <ScrollableTable minWidth={650}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.slate0 }}>
                  {['Name', 'Email Address', 'System Role', 'Department', 'Joined Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.slate5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} style={{ borderTop: `1px solid ${C.slate1}` }}>
                    <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: C.slate9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.indigoL, color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        {u.first_name} {u.last_name}
                        {u.role === 'admin' && <Shield size={14} color={C.rose} />}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.slate7 }}>{u.email}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <Badge label={u.role} color={u.role === 'student' ? C.slate1 : u.role === 'instructor' ? C.indigoL : C.roseL} text={u.role === 'student' ? C.slate7 : u.role === 'instructor' ? C.indigo : C.rose} />
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.slate6 }}>{u.department || '—'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: C.slate5 }}>{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 18px' }}><Badge label="Active" color={C.greenL} text={C.green} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </Card>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 440, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate9 }}>Create New User Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22 }}>
              <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
                <input placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
                <input placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              <input type="email" placeholder="Institutional Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <input type="password" placeholder="Temporary Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none' }} />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 26 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.slate7 }}>Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} style={{ padding: '10px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{createMutation.isPending ? 'Creating...' : 'Create Account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
