import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, ClipboardCheck, Send } from 'lucide-react';
import { C, BATCH_COLORS, BATCH_LABELS } from '../../utils/theme';
import { batchesApi } from '../../api/services';
import type { BatchStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Empty } from '../../components/ui/Empty';

export function GradeBatchList({ role }: { role:'lecturer'|'officer' }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey:['batches',role],
    queryFn:()=>batchesApi.list(role==='officer'?{role:'officer'}:{}).then(r=>r.data),
    staleTime:30_000,
  });
  const batches = data ?? [];

  const approve = useMutation({ mutationFn:(id:string)=>batchesApi.approve(id), onSuccess:()=>qc.invalidateQueries({queryKey:['batches']}) });
  const publish = useMutation({ mutationFn:(id:string)=>batchesApi.publish(id), onSuccess:()=>qc.invalidateQueries({queryKey:['batches']}) });
  const submitBatch = useMutation({ mutationFn:(id:string)=>batchesApi.submit(id, "Ready for review"), onSuccess:()=>qc.invalidateQueries({queryKey:['batches']}) });
  const [rejectId, setRejectId] = useState<string|null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [viewBatchId, setViewBatchId] = useState<string|null>(null);
  const reject = useMutation({ mutationFn:({id,notes}:{id:string;notes:string})=>batchesApi.reject(id,notes), onSuccess:()=>{ qc.invalidateQueries({queryKey:['batches']}); setRejectId(null); setRejectNotes(''); } });

  if (isLoading) return <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner/></div>;
  if (batches.length===0) return <Empty icon={ClipboardCheck} title="No grade batches" sub={role==='officer'?"No batches pending review.":"Create an assignment and upload grades to get started."}/>;

  return (
    <div>
      <div style={{fontSize:14,fontWeight:700,color:C.slate9,marginBottom:14}}>
        {role==='officer' ? 'Review Queue' : 'My Grade Batches'}
      </div>
      <Card style={{overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:C.slate0}}>
            {['Course','Assignment','Status','Grades','Submitted','Actions'].map(h=>(
              <th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slate4,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {batches.map((b:any)=>(
              <tr key={b.id} style={{borderTop:`1px solid ${C.slate1}`}}>
                <td style={{padding:'11px 16px'}}><span style={{fontSize:11,fontWeight:700,color:C.indigo,background:C.indigoL,padding:'2px 7px',borderRadius:99}}>{b.course_code}</span></td>
                <td style={{padding:'11px 16px',fontSize:12,fontWeight:500,color:C.slate7}}>{b.assignment_title}</td>
                <td style={{padding:'11px 16px'}}>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,background:BATCH_COLORS[b.status as BatchStatus]+'22',color:BATCH_COLORS[b.status as BatchStatus]}}>
                    {BATCH_LABELS[b.status as BatchStatus]}
                  </span>
                </td>
                <td style={{padding:'11px 16px',fontSize:12,color:C.slate6}}>{b.grade_count}</td>
                <td style={{padding:'11px 16px',fontSize:11,color:C.slate4}}>{b.submitted_at?new Date(b.submitted_at).toLocaleDateString():'—'}</td>
                <td style={{padding:'11px 16px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setViewBatchId(b.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',background:C.slate1,color:C.slate7,border:`1px solid ${C.slate3}`,borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      <Eye size={12}/> View
                    </button>
                    {role==='officer' && b.status==='pending_review' && (
                      <>
                        <button onClick={()=>approve.mutate(b.id)} disabled={approve.isPending} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',background:C.indigoL,color:C.indigo,border:`1px solid ${C.indigo}44`,borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          <CheckCircle size={12}/> Approve
                        </button>
                        <button onClick={()=>setRejectId(b.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',background:C.roseL,color:C.rose,border:`1px solid ${C.rose}44`,borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          <XCircle size={12}/> Reject
                        </button>
                      </>
                    )}
                    {role==='officer' && b.status==='approved' && (
                      <button onClick={()=>publish.mutate(b.id)} disabled={publish.isPending} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',background:C.greenL,color:C.green,border:`1px solid ${C.green}44`,borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        <Send size={12}/> Publish
                      </button>
                    )}
                    {role==='lecturer' && (b.status==='draft' || b.status==='rejected') && (
                      <button onClick={()=>submitBatch.mutate(b.id)} disabled={submitBatch.isPending} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',background:C.indigoL,color:C.indigo,border:`1px solid ${C.indigo}44`,borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        <CheckCircle size={12}/> Submit for Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {viewBatchId && (
        <BatchDetailModal batchId={viewBatchId} onClose={() => setViewBatchId(null)} />
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#fff',borderRadius:18,padding:28,width:440}}>
            <div style={{fontSize:16,fontWeight:800,color:C.slate9,marginBottom:4}}>Reject grade batch</div>
            <div style={{fontSize:12,color:C.slate4,marginBottom:16}}>Provide notes for the lecturer to address.</div>
            <textarea value={rejectNotes} onChange={e=>setRejectNotes(e.target.value)} rows={4} placeholder="Explain what needs to be corrected…" style={{width:'100%',padding:12,border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
              <button onClick={()=>setRejectId(null)} style={{padding:'8px 18px',background:'none',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
              <button onClick={()=>reject.mutate({id:rejectId,notes:rejectNotes})} disabled={!rejectNotes.trim()||reject.isPending} style={{padding:'8px 18px',background:C.rose,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:!rejectNotes.trim()?0.5:1}}>
                {reject.isPending?'Rejecting…':'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BatchDetailModal({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const { data: batch, isLoading } = useQuery({
    queryKey: ['batches', batchId],
    queryFn: () => batchesApi.detail(batchId).then(r => r.data),
  });

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#fff',borderRadius:18,padding:28,width:650,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
        {isLoading ? (
          <div style={{padding:40,display:'flex',justifyContent:'center'}}><Spinner/></div>
        ) : !batch ? (
          <div>Error loading batch details.</div>
        ) : (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:C.slate9,marginBottom:4}}>Batch Details: {batch.assignment?.title}</div>
                <div style={{fontSize:12,color:C.slate5}}>{batch.assignment?.course_code} · {batch.grade_count} grades submitted</div>
              </div>
              <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.slate4}}>
                <XCircle size={20}/>
              </button>
            </div>
            
            <div style={{overflowY:'auto',border:`1px solid ${C.slate2}`,borderRadius:10}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,background:C.slate0,boxShadow:`0 1px 0 ${C.slate2}`}}>
                  <tr>
                    {['Student','ID','Score','Grade','Feedback'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slate5,textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(batch.grades||[]).map((g:any)=>(
                    <tr key={g.id} style={{borderTop:`1px solid ${C.slate1}`}}>
                      <td style={{padding:'10px 14px',fontSize:12,fontWeight:600,color:C.slate9}}>{g.student_name}</td>
                      <td style={{padding:'10px 14px',fontSize:12,color:C.slate5}}>{g.student_code}</td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:700,color:C.indigo}}>{g.score}</td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:800,color:g.letter_grade==='F'?C.rose:C.green}}>{g.letter_grade}</td>
                      <td style={{padding:'10px 14px',fontSize:11,color:C.slate6}}>{g.feedback||'—'}</td>
                    </tr>
                  ))}
                  {(batch.grades||[]).length===0 && (
                    <tr><td colSpan={5} style={{padding:20,textAlign:'center',fontSize:12,color:C.slate4}}>No grades found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
              <button onClick={onClose} style={{padding:'8px 20px',background:C.slate1,color:C.slate7,border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
