import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Search, BookOpen } from 'lucide-react';
import { C } from '../../utils/theme';
import { coursesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { Empty } from '../../components/ui/Empty';

const COLORS = [C.indigo,C.green,C.amber,'#ec4899','#8b5cf6','#06b6d4'];

export function CourseRegistration() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data:catalogData, isLoading } = useQuery({ queryKey:['courses','list',{}], queryFn:()=>coursesApi.list().then(r=>r.data), staleTime:180_000 });
  const { data:myEnrollments } = useQuery({ queryKey:['enrollments'], queryFn:()=>coursesApi.enrollments().then(r=>r.data), staleTime:60_000 });
  const enrolledIds = new Set((myEnrollments?.results??[]).filter((e:any)=>e.status!=='dropped').map((e:any)=>e.course.id));
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const bulkMut = useMutation({ mutationFn:(ids:string[])=>coursesApi.bulkRegister(ids).then(r=>r.data), onSuccess:(data)=>{ setDoneIds(prev=>new Set([...prev,...data.registered.map((e:any)=>e.course.id)])); setSelected(new Set()); qc.invalidateQueries({queryKey:['courses']}); qc.invalidateQueries({queryKey:['enrollments']}); } });
  const singleMut = useMutation({ mutationFn:(id:string)=>coursesApi.register(id).then(r=>r.data), onSuccess:(data)=>{ setDoneIds(prev=>new Set([...prev,data.course.id])); qc.invalidateQueries({queryKey:['courses']}); qc.invalidateQueries({queryKey:['enrollments']}); } });

  const catalog = catalogData?.results ?? [];
  const filtered = catalog.filter((c:any)=>c.title.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase()));
  const selCredits = [...selected].reduce((s,id)=>{const c=catalog.find((x:any)=>x.id===id);return s+(c?.credits??0);},0);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>Course Registration</h2>
          <p style={{margin:'4px 0 0',fontSize:12,color:C.slate4}}>Max 18 credits per semester</p>
        </div>
        {selected.size>0 && (
          <button onClick={()=>bulkMut.mutate([...selected])} disabled={bulkMut.isPending} style={{display:'flex',alignItems:'center',gap:7,padding:'10px 20px',background:C.indigo,color:'#fff',border:'none',borderRadius:10,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {bulkMut.isPending?<Spinner/>:<Check size={15}/>}
            Register {selected.size} course{selected.size>1?'s':''} · {selCredits} credits
          </button>
        )}
      </div>
      {bulkMut.isSuccess && (
        <div style={{background:C.greenL,border:`1px solid #6ee7b7`,borderRadius:12,padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:10}}>
          <Check size={16} color={C.green}/>
          <span style={{fontSize:13,color:'#065f46',fontWeight:600}}>Registered {bulkMut.data?.summary.registered_count} course(s) · {bulkMut.data?.summary.total_credits} credits</span>
        </div>
      )}
      <div style={{position:'relative',marginBottom:18}}>
        <Search size={14} color={C.slate4} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by code or title…" style={{width:'100%',padding:'9px 14px 9px 34px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
      </div>
      {isLoading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div>
        : filtered.length===0 ? <Empty icon={BookOpen} title="No courses found" sub="Try a different search term."/>
        : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {filtered.map((c:any,i:number)=>{
              const col=COLORS[i%COLORS.length];
              const done=enrolledIds.has(c.id)||doneIds.has(c.id);
              const sel=selected.has(c.id);
              const pct=Math.round((c.enrollment_count/c.max_students)*100);
              return (
                <Card key={c.id} style={{overflow:'hidden',border:`1.5px solid ${sel?C.indigo:done?'#6ee7b7':C.slate2}`,boxShadow:sel?`0 0 0 3px ${C.indigoL}`:undefined}}>
                  <div style={{background:col,padding:'16px 18px 14px',color:'#fff',position:'relative'}}>
                    <div style={{fontSize:10,fontWeight:700,opacity:.75,marginBottom:3}}>{c.code} · {c.credits} credits</div>
                    <div style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{c.title}</div>
                    {done&&<div style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,.25)',padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700}}>✓ Enrolled</div>}
                  </div>
                  <div style={{padding:'14px 18px 16px'}}>
                    {c.schedules?.length>0&&<div style={{fontSize:11,color:C.slate5,marginBottom:8}}>{c.schedules.map((s:any)=>`${s.day_name} ${s.start_time}–${s.end_time}`).join(' · ')}</div>}
                    {c.prerequisites?.length>0&&<div style={{fontSize:11,color:C.slate4,marginBottom:8}}>Prereq: {c.prerequisites.map((p:any)=>p.code).join(', ')}</div>}
                    <div style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.slate4,marginBottom:4}}>
                        <span>{c.is_full?'⚠️ Full':`${c.available_seats} seats left`}</span><span>{c.enrollment_count}/{c.max_students}</span>
                      </div>
                      <ProgressBar value={pct} color={pct>85?C.amber:C.green}/>
                    </div>
                    {done
                      ? <div style={{padding:8,background:C.greenL,borderRadius:9,textAlign:'center',fontSize:12,fontWeight:700,color:C.green}}>✓ Registered</div>
                      : (
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>setSelected(prev=>{const n=new Set(prev);n.has(c.id)?n.delete(c.id):n.add(c.id);return n;})} style={{flex:1,padding:8,borderRadius:9,border:`1.5px solid ${sel?C.indigo:C.slate2}`,background:sel?C.indigoL:'#fff',color:sel?C.indigo:C.slate5,fontFamily:'inherit',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                            {sel?'✓ Selected':'+ Select'}
                          </button>
                          <button onClick={()=>singleMut.mutate(c.id)} disabled={c.is_full} style={{flex:1,padding:8,borderRadius:9,border:'none',background:c.is_full?C.slate1:C.indigo,color:c.is_full?C.slate4:'#fff',fontFamily:'inherit',fontSize:12,fontWeight:700,cursor:c.is_full?'not-allowed':'pointer'}}>
                            {c.is_full?'Full':'Enroll Now'}
                          </button>
                        </div>
                      )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
