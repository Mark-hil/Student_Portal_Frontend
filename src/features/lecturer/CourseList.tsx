import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import { C } from '../../utils/theme';
import { coursesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

export function CourseList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['lecturer-courses'],
    queryFn: () => coursesApi.myCourses().then(r => r.data)
  });

  if (isLoading) return <div style={{padding:20,textAlign:'center'}}><Spinner/></div>;
  if (!courses?.length) return <div style={{padding:20,color:C.slate5}}>No courses assigned.</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {courses.map(c => (
        <Card key={c.id} style={{padding:16,display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={() => onSelect(c.id)}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{background:C.indigoL,padding:10,borderRadius:12}}><BookOpen color={C.indigo}/></div>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{c.code} — {c.title}</div>
              <div style={{fontSize:13,color:C.slate5,marginTop:4,display:'flex',gap:12}}>
                <span>Semester: {c.semester}</span>
                <span style={{display:'flex',alignItems:'center',gap:4}}><Users size={14}/> {c.max_students} max</span>
              </div>
            </div>
          </div>
          <ChevronRight color={C.slate4}/>
        </Card>
      ))}
    </div>
  );
}
