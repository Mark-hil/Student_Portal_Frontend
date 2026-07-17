import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { C, gpaColor, gradeColor } from '../../utils/theme';
import { gradesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';

export function StudentGrades() {
  const { data:gpa }        = useQuery({ queryKey:['gpa-summary'], queryFn:()=>gradesApi.gpaSummary().then(r=>r.data), staleTime:600_000 });
  const { data:gradeData }  = useQuery({ queryKey:['grades',{}],   queryFn:()=>gradesApi.list().then(r=>r.data),        staleTime:300_000 });
  const { data:transcript } = useQuery({ queryKey:['transcript'],  queryFn:()=>gradesApi.transcript().then(r=>r.data),  staleTime:900_000 });
  const qc = useQueryClient();
  const recompute = useMutation({ mutationFn:()=>gradesApi.recompute(), onSuccess:()=>{ qc.invalidateQueries({queryKey:['gpa-summary']}); qc.invalidateQueries({queryKey:['transcript']}); } });
  const grades   = gradeData?.results ?? [];
  const semGPA   = gpa?.semester_gpa  ? parseFloat(gpa.semester_gpa)  : null;
  const cumGPA   = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:22}}>
      {/* GPA Cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {[
          {label:'Semester GPA',   val:semGPA, desc:`${gpa?.current_semester_label??'Current'} · In progress`, sub:`${gpa?.credits_this_semester??0} credits enrolled`, grad:`${C.indigo},#818cf8`},
          {label:'Cumulative GPA', val:cumGPA, desc:`All ${(gpa?.semester_history??[]).length} semesters`, sub:`${gpa?.credits_completed??0} total credits`, grad:`${C.navy},${C.navy2}`},
        ].map((g,i)=>(
          <div key={i} style={{background:`linear-gradient(135deg,${g.grad})`,borderRadius:16,padding:'22px 26px',color:'#fff',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',bottom:-25,right:-25,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
            <div style={{fontSize:10,color:'rgba(255,255,255,.5)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:5}}>{g.label}</div>
            <div style={{fontSize:42,fontWeight:800,letterSpacing:'-.03em',lineHeight:1}}>{g.val!=null?g.val.toFixed(2):'—'}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.6)',marginTop:6}}>{g.desc}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.45)',marginTop:3}}>{g.sub}</div>
          </div>
        ))}
      </div>

      {/* Semester history */}
      {(gpa?.semester_history??[]).length>0 && (
        <Card style={{padding:'18px 22px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.slate9}}>GPA by Semester</div>
            <button onClick={()=>recompute.mutate()} disabled={recompute.isPending} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:`1px solid ${C.slate2}`,borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:600,color:C.slate5,cursor:'pointer',fontFamily:'inherit'}}>
              <RefreshCw size={11}/> Refresh
            </button>
          </div>
          {gpa!.semester_history.map((s:any)=>{
            const sg = s.semester_gpa ? parseFloat(s.semester_gpa) : null;
            const cg = s.cumulative_gpa ? parseFloat(s.cumulative_gpa) : null;
            return (
              <div key={s.semester} style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0',borderBottom:`1px solid ${C.slate1}`}}>
                <div style={{fontSize:12,fontWeight:600,color:C.slate7,width:110,flexShrink:0}}>{s.semester_label}</div>
                <div style={{flex:1}}><ProgressBar value={sg?(sg/4)*100:0} color={gpaColor(sg)} h={8}/></div>
                <div style={{display:'flex',gap:16,flexShrink:0}}>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:10,color:C.slate4}}>Semester</div>
                    <div style={{fontSize:14,fontWeight:800,color:gpaColor(sg)}}>{sg?.toFixed(2)??'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:10,color:C.slate4}}>Cumulative</div>
                    <div style={{fontSize:14,fontWeight:800,color:gpaColor(cg)}}>{cg?.toFixed(2)??'—'}</div>
                  </div>
                  <div style={{textAlign:'right',width:50}}>
                    <div style={{fontSize:10,color:C.slate4}}>Credits</div>
                    <div style={{fontSize:12,fontWeight:600,color:C.slate6}}>{s.semester_credits_earned}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{display:'flex',justifyContent:'flex-end',gap:20,paddingTop:12,borderTop:`2px solid ${C.slate2}`,marginTop:2}}>
            <span style={{fontSize:12,fontWeight:700,color:C.slate7,marginRight:'auto'}}>Cumulative Total</span>
            <div style={{textAlign:'right'}}><div style={{fontSize:10,color:C.slate4}}>GPA</div><div style={{fontSize:16,fontWeight:800,color:gpaColor(cumGPA)}}>{cumGPA?.toFixed(2)??'—'}</div></div>
            <div style={{textAlign:'right',width:50}}><div style={{fontSize:10,color:C.slate4}}>Credits</div><div style={{fontSize:12,fontWeight:600}}>{gpa?.credits_completed??0}</div></div>
          </div>
        </Card>
      )}

      {/* Grades table — only published */}
      <Card style={{overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.slate1}`,fontSize:14,fontWeight:700,color:C.slate9}}>Published Grades</div>
        {grades.length===0
          ? <Empty icon={BarChart2} title="No published grades yet" sub="Grades appear here once your lecturer submits and the academic officer publishes them."/>
          : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:C.slate0}}>
                  {['Course','Assignment','Score','Grade','Weight','Type','Published'].map(h=>(
                    <th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slate4,textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {grades.map((g:any)=>(
                    <tr key={g.id} style={{borderTop:`1px solid ${C.slate1}`}}>
                      <td style={{padding:'11px 16px'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99,background:C.indigoL,color:C.indigo}}>{g.assignment.course_code}</span></td>
                      <td style={{padding:'11px 16px',fontSize:12,fontWeight:500,color:C.slate7}}>{g.assignment.title}</td>
                      <td style={{padding:'11px 16px'}}><span style={{fontSize:14,fontWeight:800}}>{g.score}</span><span style={{fontSize:11,color:C.slate4}}> /{g.assignment.max_score}</span></td>
                      <td style={{padding:'11px 16px'}}><span style={{fontSize:14,fontWeight:800,color:gradeColor(g.letter_grade)}}>{g.letter_grade}</span></td>
                      <td style={{padding:'11px 16px',fontSize:12,color:C.slate5}}>{g.assignment.weight}%</td>
                      <td style={{padding:'11px 16px'}}><Badge label={g.assignment.assignment_type}/></td>
                      <td style={{padding:'11px 16px',fontSize:11,color:C.slate4}}>{g.graded_at?new Date(g.graded_at).toLocaleDateString():'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {/* Transcript */}
      {(transcript??[]).length>0 && (
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.slate9,marginBottom:12}}>Official Transcript</div>
          {transcript!.map((sem:any)=>(
            <Card key={sem.semester} style={{marginBottom:14,overflow:'hidden'}}>
              <div style={{padding:'12px 18px',background:C.slate0,borderBottom:`1px solid ${C.slate2}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:13,fontWeight:700,color:C.slate9}}>{sem.label}</div>
                <div style={{display:'flex',gap:20}}>
                  {[['Semester GPA',sem.semester_gpa],['Cumulative GPA',sem.cumulative_gpa],['Credits',sem.credits_earned]].map(([l,v]:any)=>(
                    <div key={l} style={{textAlign:'right'}}>
                      <div style={{fontSize:10,color:C.slate4}}>{l}</div>
                      <div style={{fontSize:15,fontWeight:800,color:l.includes('GPA')&&v?gpaColor(parseFloat(v)):C.slate7}}>{v??'—'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {sem.courses?.map((row:any)=>(
                <div key={row.id} style={{display:'flex',alignItems:'center',padding:'10px 18px',borderBottom:`1px solid ${C.slate1}`}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.indigo,width:70}}>{row.course_code}</span>
                  <span style={{flex:1,fontSize:12,color:C.slate7}}>{row.course_title}</span>
                  <span style={{fontSize:11,color:C.slate4,marginRight:20}}>{row.credits_attempted} cr</span>
                  <span style={{fontSize:14,fontWeight:800,color:gradeColor(row.final_grade)}}>{row.final_grade||'—'}</span>
                  <span style={{fontSize:11,color:C.slate4,marginLeft:12,width:30,textAlign:'right'}}>{row.grade_points??'—'}</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
