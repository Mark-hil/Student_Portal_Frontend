import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Layers, AlertCircle } from 'lucide-react';
import { C, gradeColor } from '../../utils/theme';
import { coursesApi, gradesApi } from '../../api/services';
import type { User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SectionHead } from '../../components/ui/SectionHead';
import { Empty } from '../../components/ui/Empty';

const COLORS = [C.indigo,C.green,C.amber,'#ec4899','#8b5cf6','#06b6d4'];

export function StudentDashboard({ user, onNav }: { user:UserType; onNav:(v:string)=>void }) {
  const { data:gpa }     = useQuery({ queryKey:['gpa-summary'],  queryFn:()=>gradesApi.gpaSummary().then(r=>r.data),   staleTime:600_000 });
  const { data:courses } = useQuery({ queryKey:['courses','mine'],queryFn:()=>coursesApi.myCourses().then(r=>r.data),  staleTime:60_000 });
  const my = courses ?? [];
  const semGPA = gpa?.semester_gpa  ? parseFloat(gpa.semester_gpa)  : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.navy2})`,borderRadius:18,padding:'24px 28px',color:'#fff',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-50,right:-50,width:180,height:180,borderRadius:'50%',background:'rgba(99,102,241,.18)'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,.45)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:5}}>{gpa?.current_semester_label ?? 'Spring 2025'}</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,letterSpacing:'-.02em'}}>Good morning, {user.first_name} 👋</h1>
          <p style={{margin:'6px 0 0',color:'rgba(255,255,255,.6)',fontSize:13}}>{my.length} active courses · {gpa?.credits_this_semester ?? 0} credits this semester</p>
        </div>
      </div>

      {/* Semester GPA + Cumulative GPA */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {[
          {label:'Semester GPA',  val:semGPA, sub:`${gpa?.current_semester_label??'Current'} · In progress`, badge:'This term',    grad:`${C.indigo}, #818cf8`},
          {label:'Cumulative GPA',val:cumGPA, sub:`All semesters · ${gpa?.credits_completed??0} credits done`, badge:`${(gpa?.semester_history??[]).length} semesters`, grad:`${C.navy},${C.navy2}`},
        ].map((g,i) => (
          <div key={i} style={{background:`linear-gradient(135deg,${g.grad})`,borderRadius:16,padding:'18px 22px',color:'#fff',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',bottom:-20,right:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
            <div style={{fontSize:10,color:'rgba(255,255,255,.5)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:5}}>{g.label}</div>
            <div style={{fontSize:38,fontWeight:800,letterSpacing:'-.03em',lineHeight:1}}>{g.val!=null?g.val.toFixed(2):'—'}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.55)',marginTop:6}}>{g.sub}</div>
            <div style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,.18)',padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:600}}>{g.badge}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[
          {l:'Credits Done', v:gpa?.credits_completed??0, s:'120 to graduate',   icon:Award,        a:C.green},
          {l:'This Semester',v:gpa?.credits_this_semester??0, s:`${my.length} courses`, icon:BookOpen, a:C.indigo},
          {l:'Assignments',  v:3,                          s:'Due this week',    icon:Layers,       a:C.amber},
          {l:'Due Today',    v:1,                          s:'CS401 P.Set 4',   icon:AlertCircle,  a:C.rose},
        ].map(({l,v,s,icon:Icon,a})=>(
          <Card key={l} style={{padding:'13px 15px',display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{background:a+'18',borderRadius:10,padding:8}}><Icon size={17} color={a}/></div>
            <div>
              <div style={{fontSize:10,color:C.slate4,marginBottom:2}}>{l}</div>
              <div style={{fontSize:20,fontWeight:800,color:C.slate9,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:C.slate4,marginTop:3}}>{s}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Current courses */}
      <div>
        <SectionHead title="My Courses" action={<button onClick={()=>onNav('courses')} style={{background:'none',border:'none',color:C.indigo,fontSize:11,fontWeight:700,cursor:'pointer'}}>View all →</button>}/>
        {my.length===0
          ? <Empty icon={BookOpen} title="No courses yet" sub="Register for courses to see them here."/>
          : my.map((c:any,i:number)=>{
            const col=COLORS[i%COLORS.length];
            const pct=parseFloat(c.progress_pct??'0');
            return (
              <Card key={c.id} style={{padding:'13px 15px',display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
                <div style={{width:4,height:44,borderRadius:99,background:col,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                    <span style={{fontSize:10,fontWeight:700,color:col,background:col+'18',padding:'2px 7px',borderRadius:99}}>{c.code}</span>
                    <span style={{fontSize:12,fontWeight:600,color:C.slate9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</span>
                  </div>
                  <div style={{fontSize:11,color:C.slate4,marginBottom:8}}>{c.instructors?.[0]?.full_name??'Instructor'} · {c.credits} cr</div>
                  <ProgressBar value={pct} color={col}/>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:800,color:c.final_grade?gradeColor(c.final_grade):C.slate4}}>{c.final_grade||'—'}</div>
                  <div style={{fontSize:10,color:C.slate4}}>{pct.toFixed(0)}%</div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
