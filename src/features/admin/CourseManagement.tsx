import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search } from 'lucide-react';
import { C } from '../../utils/theme';
import { coursesApi, adminApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';

export function CourseManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newCourse, setNewCourse] = useState({
    code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: '', status: 'active', instructor_ids: [] as string[]
  });
  
  const { data, isLoading } = useQuery({ 
    queryKey:['courses','list', {search}], 
    queryFn:()=>coursesApi.list({ search }).then(r=>r.data), 
    staleTime:30_000 
  });

  const { data: instData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => adminApi.listUsers({ role: 'instructor' }).then(r=>r.data)
  });
  
  const createMutation = useMutation({
    mutationFn: () => coursesApi.create(newCourse),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', 'list'] });
      setIsModalOpen(false);
      setNewCourse({ code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: '', status: 'active', instructor_ids: [] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => coursesApi.update(editingCourse.id, newCourse),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', 'list'] });
      setIsModalOpen(false);
      setEditingCourse(null);
      setNewCourse({ code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: '', status: 'active', instructor_ids: [] });
    }
  });

  const openCreateModal = () => {
    setEditingCourse(null);
    setNewCourse({ code: '', title: '', slug: '', description: '', credits: 3, max_students: 30, semester: '', status: 'active', instructor_ids: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setNewCourse({
      code: course.code, title: course.title, slug: course.slug, description: course.description,
      credits: course.credits, max_students: course.max_students, semester: course.semester,
      status: course.status, instructor_ids: course.instructors?.[0] ? [course.instructors[0].id] : []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingCourse) updateMutation.mutate();
    else createMutation.mutate();
  };
  
  const courses = data?.results ?? [];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>Course Management</h2>
          <p style={{margin:'4px 0 0',fontSize:12,color:C.slate4}}>Create courses, assign instructors, and set capacities.</p>
        </div>
        <button onClick={openCreateModal} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:C.indigo,color:'#fff',border:'none',borderRadius:10,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          <Plus size={15}/> Create Course
        </button>
      </div>

      <div style={{position:'relative'}}>
        <Search size={14} color={C.slate4} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by course code or title…" style={{width:'100%',padding:'9px 14px 9px 34px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
      </div>

      <Card style={{overflow:'hidden'}}>
        {isLoading ? <div style={{padding:40,display:'flex',justifyContent:'center'}}><Spinner/></div> :
         courses.length===0 ? <Empty icon={BookOpen} title="No courses found" sub="Try adjusting your search."/> :
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:C.slate0}}>
              {['Code','Title','Credits','Capacity','Instructor','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slate4,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {courses.map((c:any)=>(
                <tr key={c.id} style={{borderTop:`1px solid ${C.slate1}`}}>
                  <td style={{padding:'11px 16px',fontSize:12,fontWeight:700,color:C.indigo}}>{c.code}</td>
                  <td style={{padding:'11px 16px',fontSize:13,fontWeight:600,color:C.slate9}}>{c.title}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:C.slate6}}>{c.credits}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:C.slate6}}>{c.enrollment_count} / {c.max_students}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:C.slate6}}>{c.instructors?.[0]?.full_name||'Unassigned'}</td>
                  <td style={{padding:'11px 16px'}}>
                    <Badge label={c.status} color={c.status==='active'?C.greenL:C.slate1} text={c.status==='active'?C.green:C.slate5}/>
                  </td>
                  <td style={{padding:'11px 16px'}}>
                    <button onClick={() => openEditModal(c)} style={{background:'transparent',border:'none',color:C.indigo,cursor:'pointer',fontSize:12,fontWeight:600}}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </Card>

      {isModalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,width:500,maxWidth:'90%',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
              <div style={{display:'flex',gap:12}}>
                <input placeholder="Course Code (e.g. CS101)" value={newCourse.code} onChange={e=>setNewCourse({...newCourse, code: e.target.value})} style={{flex:1,padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
                <input placeholder="Slug (e.g. cs-101)" value={newCourse.slug} onChange={e=>setNewCourse({...newCourse, slug: e.target.value})} style={{flex:1,padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
              </div>
              <input placeholder="Course Title" value={newCourse.title} onChange={e=>setNewCourse({...newCourse, title: e.target.value})} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none'}}/>
              <textarea placeholder="Description" value={newCourse.description} onChange={e=>setNewCourse({...newCourse, description: e.target.value})} style={{padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',minHeight:80,resize:'vertical'}}/>
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:1}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.slate5,marginBottom:4}}>Credits</label>
                  <input type="number" value={newCourse.credits} onChange={e=>setNewCourse({...newCourse, credits: parseInt(e.target.value)||0})} style={{width:'100%',padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.slate5,marginBottom:4}}>Max Students</label>
                  <input type="number" value={newCourse.max_students} onChange={e=>setNewCourse({...newCourse, max_students: parseInt(e.target.value)||0})} style={{width:'100%',padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.slate5,marginBottom:4}}>Semester</label>
                  <input placeholder="e.g. FA24" value={newCourse.semester} onChange={e=>setNewCourse({...newCourse, semester: e.target.value})} style={{width:'100%',padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:C.slate5,marginBottom:4}}>Assign Instructor</label>
                <select 
                  value={newCourse.instructor_ids[0] || ''} 
                  onChange={e=>setNewCourse({...newCourse, instructor_ids: [e.target.value]})} 
                  style={{width:'100%',padding:'9px 14px',border:`1px solid ${C.slate2}`,borderRadius:10,fontSize:13,outline:'none',background:'#fff'}}
                >
                  <option value="">-- Select Instructor --</option>
                  {instData?.results?.map((i:any) => (
                    <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:24}}>
              <button onClick={()=>setIsModalOpen(false)} style={{padding:'9px 16px',background:'transparent',border:`1px solid ${C.slate2}`,borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,color:C.slate7}}>Cancel</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} style={{padding:'9px 16px',background:C.indigo,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:700}}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
