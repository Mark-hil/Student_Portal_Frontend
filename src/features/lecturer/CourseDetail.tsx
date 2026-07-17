import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, Upload } from 'lucide-react';
import { C } from '../../utils/theme';
import { coursesApi, assignmentsApi, batchesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { SectionHead } from '../../components/ui/SectionHead';
import { Badge } from '../../components/ui/Badge';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { GradeUploadModal } from './GradeUploadModal';

export function CourseDetail({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [uploadingAssignment, setUploadingAssignment] = useState<{ id: string; batchId: string } | null>(null);

  const { data: course, isLoading: loadingC } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.detail(courseId).then(r => r.data)
  });

  const { data: assignmentsRes, isLoading: loadingA } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.list({ course: courseId }).then(r => r.data)
  });
  
  const assignments = assignmentsRes?.results || [];

  const handleUploadClick = (assignment: any) => {
    if (assignment.batch_id) {
      setUploadingAssignment({ id: assignment.id, batchId: assignment.batch_id });
    } else {
      alert('Error: No grade batch found for this assignment. Please contact support.');
    }
  };

  if (loadingC) return <div style={{padding:20,textAlign:'center'}}><Spinner/></div>;
  if (!course) return null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6}}><ArrowLeft color={C.slate6}/></button>
        <h2 style={{margin:0,fontSize:20,fontWeight:700}}>{course.code} — {course.title}</h2>
      </div>

      <SectionHead 
        title="Assignments" 
        action={<button onClick={() => setShowCreate(true)} style={{background:C.indigo,color:'#fff',border:'none',padding:'8px 16px',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:600}}><Plus size={16}/> Create Assignment</button>}
      />

      {loadingA ? <Spinner/> : (
        <div style={{display:'grid',gap:12}}>
          {!assignments.length && <div style={{color:C.slate5}}>No assignments created yet.</div>}
          {assignments.map((a: any) => (
            <Card key={a.id} style={{padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',gap:16,alignItems:'center'}}>
                <div style={{background:C.slate1,padding:10,borderRadius:12}}><FileText color={C.slate5}/></div>
                <div>
                  <div style={{fontWeight:600,fontSize:15}}>{a.title}</div>
                  <div style={{fontSize:13,color:C.slate5,marginTop:4,display:'flex',gap:12}}>
                    <span>{a.assignment_type}</span>
                    <span>•</span>
                    <span>Max: {a.max_score}</span>
                    <span>•</span>
                    <span>Weight: {a.weight}%</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleUploadClick(a)} style={{background:C.greenL,color:C.green,border:'none',padding:'8px 16px',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
                <Upload size={16}/> Upload Grades
              </button>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentModal 
          courseId={courseId} 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({queryKey:['assignments', courseId]});
            queryClient.invalidateQueries({queryKey:['batches']});
          }}
        />
      )}

      {uploadingAssignment && (
        <GradeUploadModal 
          batchId={uploadingAssignment.batchId} 
          onClose={() => setUploadingAssignment(null)} 
        />
      )}
    </div>
  );
}
