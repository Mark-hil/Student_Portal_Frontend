import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import { C } from '../../utils/theme';
import { adminApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { GradeBatchList } from '../shared/GradeBatchList';
import { Spinner } from '../../components/ui/Spinner';

export function AdminDashboard({ user }: { user:UserType }) {
  const { data:stats, isLoading } = useQuery({ queryKey:['admin','stats'], queryFn:()=>adminApi.stats().then(r=>r.data), staleTime:30_000 });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.navy2})`,borderRadius:18,padding:'24px 28px',color:'#fff'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,.45)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:5}}>Admin Portal</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:800}}>System Overview, {user.first_name}</h1>
        <p style={{margin:'6px 0 0',color:'rgba(255,255,255,.6)',fontSize:13}}>Manage users, courses, and review academic performance.</p>
      </div>

      {isLoading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {l:'Total Students', v:stats?.total_students??0, a:C.indigo, icon:Users},
            {l:'Total Instructors', v:stats?.total_instructors??0, a:C.green, icon:Users},
            {l:'Active Courses', v:stats?.total_courses??0, a:C.amber, icon:BookOpen},
            {l:'Pending Batches', v:stats?.pending_batches??0, a:C.rose, icon:ClipboardCheck},
          ].map(({l,v,a,icon:Icon})=>(
            <Card key={l} style={{padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:10}}>
              <div style={{background:a+'18',borderRadius:10,padding:8}}><Icon size={17} color={a}/></div>
              <div><div style={{fontSize:10,color:C.slate4,marginBottom:2}}>{l}</div><div style={{fontSize:22,fontWeight:800,color:C.slate9}}>{v}</div></div>
            </Card>
          ))}
        </div>
      )}
      
      <div style={{marginTop:10}}>
        <GradeBatchList role="officer"/>
      </div>
    </div>
  );
}
