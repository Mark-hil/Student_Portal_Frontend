/**
 * StudentPortal.tsx
 * Role-aware portal — renders different dashboards for student / lecturer / officer.
 * All data comes from React Query hooks hitting the real Django API.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, User,
  Plus, GraduationCap, LogOut, Search, ClipboardCheck, Users, Shield
} from 'lucide-react';
import { C } from '../utils/theme';
import { useWebSocket } from '../hooks/useWebSocket';
import { Toaster } from 'react-hot-toast';
import { notificationsApi } from '../api/services';
import type { User as UserType } from '../types';

import { StudentDashboard } from './student/StudentDashboard';
import { StudentGrades } from './student/StudentGrades';
import { CourseRegistration } from './student/CourseRegistration';
import { LecturerDashboard } from './lecturer/LecturerDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { UserManagement } from './admin/UserManagement';
import { CourseManagement } from './admin/CourseManagement';
import { GradeBatchList } from './shared/GradeBatchList';
import { NotificationsView } from './shared/NotificationsView';
import { ProfileView } from './shared/ProfileView';
import { Empty } from '../components/ui/Empty';

interface Props { user: UserType; onLogout: () => void; }

export default function StudentPortal({ user, onLogout }: Props) {
  useWebSocket();
  const [view, setView] = useState('dashboard');
  const { data:notifData } = useQuery({ queryKey:['notifications'], queryFn:()=>notificationsApi.list().then(r=>r.data), staleTime:30_000, refetchInterval:60_000 });
  const unread = (notifData?.results??[]).filter((n:any)=>!n.read).length;

  const isStudent    = user.role === 'student';
  const isLecturer   = user.role === 'instructor';
  const isOfficer    = user.role === 'staff' || user.role === 'admin';

  const NAV_STUDENT = [
    {id:'dashboard',   label:'Dashboard',          Icon:LayoutDashboard},
    {id:'courses',     label:'My Courses',          Icon:BookOpen},
    {id:'register',    label:'Course Registration', Icon:Plus},
    {id:'grades',      label:'Grades & GPA',        Icon:BarChart2},
    {id:'notifications',label:'Notifications',      Icon:Bell},
    {id:'profile',     label:'Profile',             Icon:User},
  ];
  const NAV_LECTURER = [
    {id:'dashboard',   label:'Dashboard',    Icon:LayoutDashboard},
    {id:'batches',     label:'Grade Batches',Icon:ClipboardCheck},
    {id:'notifications',label:'Notifications',Icon:Bell},
    {id:'profile',     label:'Profile',      Icon:User},
  ];
  const NAV_OFFICER = [
    {id:'dashboard',   label:'Dashboard',    Icon:LayoutDashboard},
    {id:'users',       label:'User Management', Icon:Users},
    {id:'courses_admin',label:'Course Management', Icon:BookOpen},
    {id:'review',      label:'Review Queue', Icon:ClipboardCheck},
    {id:'notifications',label:'Notifications',Icon:Bell},
    {id:'profile',     label:'Profile',      Icon:User},
  ];

  const NAV = isLecturer ? NAV_LECTURER : isOfficer ? NAV_OFFICER : NAV_STUDENT;

  const TITLES: Record<string,string> = {
    dashboard:'Dashboard', courses:'My Courses', register:'Course Registration',
    grades:'Grades & GPA', batches:'Grade Batches', review:'Review Queue',
    notifications:'Notifications', profile:'My Profile',
    users:'User Management', courses_admin:'Course Management'
  };

  function renderView() {
    switch(view) {
      case 'dashboard':     return isLecturer ? <LecturerDashboard user={user}/> : isOfficer ? <AdminDashboard user={user}/> : <StudentDashboard user={user} onNav={setView}/>;
      case 'users':         return <UserManagement/>;
      case 'courses_admin': return <CourseManagement/>;
      case 'courses':       return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}><Empty icon={BookOpen} title="My courses" sub="Showing enrolled courses."/></div>;
      case 'register':      return <CourseRegistration/>;
      case 'grades':        return <StudentGrades/>;
      case 'batches':       return <GradeBatchList role="lecturer"/>;
      case 'review':        return <GradeBatchList role="officer"/>;
      case 'notifications': return <NotificationsView/>;
      case 'profile':       return <ProfileView user={user}/>;
      default:              return <StudentDashboard user={user} onNav={setView}/>;
    }
  }

  const initials = (user.first_name?.[0]??'')+(user.last_name?.[0]??'');

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Sora','Inter',system-ui,sans-serif}`}</style>
      <div style={{display:'flex',height:'100vh',fontFamily:"'Sora','Inter',system-ui,sans-serif",fontSize:13,background:C.slate0,overflow:'hidden'}}>
        <Toaster position="top-right" />

        {/* Sidebar */}
        <aside style={{width:228,background:C.navy,display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:C.indigo,borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <GraduationCap size={18} color="#fff"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:'#fff',letterSpacing:'-.01em'}}>UniPortal</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:'.09em',textTransform:'uppercase'}}>
                {isOfficer?'Academic Office':isLecturer?'Lecturer':'Student Hub'}
              </div>
            </div>
          </div>
          <div style={{margin:'12px 10px 0',background:'rgba(255,255,255,.05)',borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:C.indigo,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.full_name}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.35)',textTransform:'capitalize'}}>{user.role}</div>
            </div>
          </div>
          <nav style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.22)',letterSpacing:'.1em',textTransform:'uppercase',padding:'0 8px 8px'}}>Menu</div>
            {NAV.map(({id,label,Icon})=>{
              const active=view===id;
              return (
                <button key={id} onClick={()=>setView(id)} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:9,border:'none',cursor:'pointer',background:active?'rgba(99,102,241,.22)':'transparent',color:active?'#a5b4fc':'rgba(255,255,255,.42)',fontFamily:'inherit',fontSize:12,fontWeight:active?600:400,marginBottom:2,position:'relative',transition:'all .15s'}}>
                  {active&&<div style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:3,borderRadius:'0 2px 2px 0',background:C.indigo}}/>}
                  <Icon size={15}/>
                  <span style={{flex:1,textAlign:'left'}}>{label}</span>
                  {id==='notifications'&&unread>0&&<span style={{background:C.rose,color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99}}>{unread}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:10,borderTop:'1px solid rgba(255,255,255,.06)'}}>
            <button onClick={onLogout} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:9,border:'none',cursor:'pointer',background:'transparent',color:'rgba(255,255,255,.28)',fontFamily:'inherit',fontSize:12}}>
              <LogOut size={14}/> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <header style={{height:52,background:'#fff',borderBottom:`1px solid ${C.slate2}`,display:'flex',alignItems:'center',padding:'0 24px',gap:14,flexShrink:0}}>
            <span style={{fontSize:15,fontWeight:700,color:C.slate9,flex:1}}>{TITLES[view]}</span>
            <div style={{position:'relative'}}>
              <Search size={13} color={C.slate4} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/>
              <input placeholder="Search…" style={{padding:'6px 12px 6px 28px',border:`1px solid ${C.slate2}`,borderRadius:8,fontSize:12,outline:'none',width:170,color:C.slate7,background:C.slate0,fontFamily:'inherit'}}/>
            </div>
            <button onClick={()=>setView('notifications')} style={{position:'relative',background:'none',border:'none',cursor:'pointer',display:'flex',color:C.slate5}}>
              <Bell size={19}/>
              {unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:15,height:15,background:C.rose,borderRadius:'50%',border:'2px solid #fff',fontSize:8,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
            </button>
          </header>
          <main style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>{renderView()}</main>
        </div>
      </div>
    </>
  );
}
