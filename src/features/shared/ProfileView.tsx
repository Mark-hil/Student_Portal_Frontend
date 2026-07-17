import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Award, Bell, GraduationCap, BookMarked, ChevronRight } from 'lucide-react';
import { C, gpaColor } from '../../utils/theme';
import { gradesApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';

export function ProfileView({ user }: { user:UserType }) {
  const { data:gpa } = useQuery({ queryKey:['gpa-summary'], queryFn:()=>gradesApi.gpaSummary().then(r=>r.data), staleTime:600_000 });
  const semGPA = gpa?.semester_gpa  ? parseFloat(gpa.semester_gpa)  : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  return (
    <div style={{maxWidth:560}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.navy2})`,borderRadius:18,padding:26,color:'#fff',marginBottom:20,display:'flex',alignItems:'center',gap:20}}>
        <div style={{width:66,height:66,borderRadius:'50%',background:C.indigo,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
          {(user.first_name?.[0]??'')+(user.last_name?.[0]??'')}
        </div>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:'-.02em'}}>{user.full_name}</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.55)',marginTop:3}}>{user.email}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2}}>ID: {user.student_id??'—'} · {user.role} · {user.department}</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
        {[
          ['Major',         user.profile?.major||user.department||'—'],
          ['Role',          user.role.charAt(0).toUpperCase()+user.role.slice(1)],
          ['Semester GPA',  semGPA?.toFixed(2)??'—'],
          ['Cumulative GPA',cumGPA?.toFixed(2)??'—'],
          ['Credits Done',  String(gpa?.credits_completed??user.profile?.total_credits??0)],
          ['Email',         user.email_verified?'Verified':'Unverified'],
        ].map(([l,v])=>(
          <Card key={l} style={{padding:'13px 16px'}}>
            <div style={{fontSize:10,color:C.slate4,marginBottom:3}}>{l}</div>
            <div style={{fontSize:15,fontWeight:700,color:l.includes('GPA')&&v!=='—'?gpaColor(parseFloat(v)):C.slate9}}>{v}</div>
          </Card>
        ))}
      </div>
      <Card style={{overflow:'hidden'}}>
        {[['Edit Profile',User],['Change Password',Award],['Notification Preferences',Bell],['Download Transcript',GraduationCap],['Manage Enrollments',BookMarked]].map(([l,Icon]:any)=>(
          <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${C.slate1}`,cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background=C.slate0)} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
            <div style={{display:'flex',alignItems:'center',gap:11,fontSize:13,fontWeight:500,color:C.slate7}}><Icon size={16} color={C.indigo}/> {l}</div>
            <ChevronRight size={14} color={C.slate3}/>
          </div>
        ))}
      </Card>
    </div>
  );
}
