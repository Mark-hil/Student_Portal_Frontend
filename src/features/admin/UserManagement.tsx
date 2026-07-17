import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Shield } from 'lucide-react';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';

export function UserManagement() {
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
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>User Management</h2>
          <p style={{margin:'4px 0 0',fontSize:12,color:C.slate4}}>Add, edit, or remove users from the system.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:C.indigo,color:'#fff',border:'none',borderRadius:10,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          <Plus size={15}/> Add User
        </button>
      </div>

      <div style={{display:'flex',gap:12}}>
        <div style={{position:'relative',flex:1}}>
          <Search size={14} color={C.slate4} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, or ID…" style={{width:'100%',padding:'9px 14px 9px 34px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
        </div>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit',color:C.slate7,background:'#fff',cursor:'pointer'}}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card style={{overflow:'hidden'}}>
        {isLoading ? <div style={{padding:40,display:'flex',justifyContent:'center'}}><Spinner/></div> :
         users.length===0 ? <Empty icon={Users} title="No users found" sub="Try adjusting your search or filters."/> :
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:C.slate0}}>
              {['Name','Email','Role','Department','Joined','Status'].map(h=>(
                <th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slate4,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map((u:any)=>(
                <tr key={u.id} style={{borderTop:`1px solid ${C.slate1}`}}>
                  <td style={{padding:'11px 16px',fontSize:13,fontWeight:600,color:C.slate9}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:C.indigoL,color:C.indigo,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{u.first_name[0]}{u.last_name[0]}</div>
                      {u.first_name} {u.last_name}
                      {u.role==='admin'&&<Shield size={12} color={C.rose}/>}
                    </div>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,color:C.slate7}}>{u.email}</td>
                  <td style={{padding:'11px 16px'}}>
                    <Badge label={u.role} color={u.role==='student'?C.slate1:u.role==='instructor'?C.indigoL:C.roseL} text={u.role==='student'?C.slate7:u.role==='instructor'?C.indigo:C.rose}/>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,color:C.slate6}}>{u.department||'—'}</td>
                  <td style={{padding:'11px 16px',fontSize:11,color:C.slate4}}>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td style={{padding:'11px 16px'}}><Badge label="Active" color={C.greenL} text={C.green}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </Card>

      {isModalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:400,maxWidth:'90%',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>Add New User</h3>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
              <div style={{display:'flex',gap:12}}>
                <input placeholder="First Name" value={newUser.first_name} onChange={e=>setNewUser({...newUser, first_name: e.target.value})} style={{flex:1,padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
                <input placeholder="Last Name" value={newUser.last_name} onChange={e=>setNewUser({...newUser, last_name: e.target.value})} style={{flex:1,padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
              </div>
              <input type="email" placeholder="Email Address" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
              <input type="password" placeholder="Temporary Password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',background:'#fff'}}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:24}}>
              <button onClick={()=>setIsModalOpen(false)} style={{padding:'9px 16px',background:'transparent',border:`1px solid ${C.slate2}`,borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,color:C.slate7}}>Cancel</button>
              <button onClick={()=>createMutation.mutate()} disabled={createMutation.isPending} style={{padding:'9px 16px',background:C.indigo,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:700}}>{createMutation.isPending ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
