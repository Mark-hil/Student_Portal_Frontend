import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { C } from '../../utils/theme';
import { assignmentsApi } from '../../api/services';
import { Spinner } from '../../components/ui/Spinner';

export function CreateAssignmentModal({ courseId, onClose, onSuccess }: { courseId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', assignment_type: 'midterm', max_score: 100, weight: 100, description: '' });
  
  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: typeof form) => assignmentsApi.create({ course: courseId, ...data }),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create(form);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#fff',padding:24,borderRadius:12,width:400,boxShadow:'0 10px 25px rgba(0,0,0,.1)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:18,fontWeight:700}}>Create Assignment</h3>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:C.slate6,marginBottom:4}}>Title</label>
            <input required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:`1px solid ${C.slate3}`}} placeholder="e.g. Midterm Exam"/>
          </div>
          <div>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:C.slate6,marginBottom:4}}>Type</label>
            <select value={form.assignment_type} onChange={e=>setForm({...form, assignment_type:e.target.value})} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:`1px solid ${C.slate3}`}}>
              <option value="midterm">Midterm Exam</option>
              <option value="final">Final Exam</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
              <option value="homework">Homework</option>
              <option value="lab">Lab</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:C.slate6,marginBottom:4}}>Max Score</label>
              <input type="number" required value={form.max_score} onChange={e=>setForm({...form, max_score:Number(e.target.value)})} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:`1px solid ${C.slate3}`}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:C.slate6,marginBottom:4}}>Weight (%)</label>
              <input type="number" required value={form.weight} onChange={e=>setForm({...form, weight:Number(e.target.value)})} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:`1px solid ${C.slate3}`}}/>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
            <button type="button" onClick={onClose} style={{padding:'8px 16px',borderRadius:6,border:`1px solid ${C.slate3}`,background:'#fff',cursor:'pointer',fontWeight:600}}>Cancel</button>
            <button type="submit" disabled={isPending} style={{padding:'8px 16px',borderRadius:6,border:'none',background:C.indigo,color:'#fff',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
              {isPending && <Spinner/>} Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
