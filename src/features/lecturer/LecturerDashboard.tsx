import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, XCircle, CheckCircle } from 'lucide-react';
import { C } from '../../utils/theme';
import { batchesApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { GradeBatchList } from '../shared/GradeBatchList';
import { CourseList } from './CourseList';
import { CourseDetail } from './CourseDetail';

export function LecturerDashboard({ user }: { user:UserType }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data:batches } = useQuery({ queryKey:['batches','lecturer'], queryFn:()=>batchesApi.list({role:'lecturer'}).then(r=>r.data), staleTime:30_000 });
  const pending  = (batches??[]).filter((b:any)=>b.status==='pending_review').length;
  const rejected = (batches??[]).filter((b:any)=>b.status==='rejected').length;
  const published= (batches??[]).filter((b:any)=>b.status==='published').length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.navy2})`,borderRadius:18,padding:'24px 28px',color:'#fff'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,.45)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:5}}>Lecturer Portal</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:800}}>Welcome back, {user.first_name}</h1>
        <p style={{margin:'6px 0 0',color:'rgba(255,255,255,.6)',fontSize:13}}>Manage your assignments and submit grades for review.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {l:'Pending Review', v:pending,   a:C.amber, icon:Clock},
          {l:'Rejected',       v:rejected,  a:C.rose,  icon:XCircle},
          {l:'Published',      v:published, a:C.green, icon:CheckCircle},
        ].map(({l,v,a,icon:Icon})=>(
          <Card key={l} style={{padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{background:a+'18',borderRadius:10,padding:8}}><Icon size={17} color={a}/></div>
            <div><div style={{fontSize:10,color:C.slate4,marginBottom:2}}>{l}</div><div style={{fontSize:22,fontWeight:800,color:C.slate9}}>{v}</div></div>
          </Card>
        ))}
      </div>
      
      {selectedCourse ? (
        <CourseDetail courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div>
            <h2 style={{margin:'0 0 16px',fontSize:18,fontWeight:700}}>My Courses</h2>
            <CourseList onSelect={setSelectedCourse} />
          </div>
          <div>
            <h2 style={{margin:'0 0 16px',fontSize:18,fontWeight:700}}>Grade Batches</h2>
            <GradeBatchList role="lecturer"/>
          </div>
        </div>
      )}
    </div>
  );
}
