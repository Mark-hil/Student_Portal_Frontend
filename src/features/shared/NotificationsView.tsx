import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { C } from '../../utils/theme';
import { notificationsApi } from '../../api/services';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';

export function NotificationsView() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:['notifications'], queryFn:()=>notificationsApi.list().then(r=>r.data), staleTime:30_000 });
  const notifs  = data?.results ?? [];
  const unread  = notifs.filter((n:any)=>!n.read).length;
  const markOne = useMutation({ mutationFn:(id:string)=>notificationsApi.markRead(id), onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']}) });
  const markAll = useMutation({ mutationFn:()=>notificationsApi.markAllRead(), onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']}) });
  const ICONS: Record<string,string> = {
    grade_posted:'📝', enrollment_confirmed:'✅', assignment_due:'⏰',
    grade_batch_approved:'✅', grade_batch_rejected:'❌', grade_review_requested:'🔍',
    announcement:'📢', system:'🔔',
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.slate9}}>Notifications</h2>
          {unread>0 && <Badge label={`${unread} new`} color={C.rose} text="#fff"/>}
        </div>
        {unread>0 && <button onClick={()=>markAll.mutate()} style={{background:'none',border:'none',color:C.indigo,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Mark all read</button>}
      </div>
      {notifs.length===0
        ? <Empty icon={Bell} title="All caught up!" sub="No notifications yet."/>
        : notifs.map((n:any)=>(
          <div key={n.id} onClick={()=>!n.read&&markOne.mutate(n.id)} style={{display:'flex',gap:12,padding:'13px 16px',borderRadius:12,marginBottom:8,border:`1px solid ${n.read?C.slate2:'#c7d2fe'}`,background:n.read?'#fff':'#f0f0ff',cursor:n.read?'default':'pointer'}}>
            <div style={{width:36,height:36,borderRadius:10,background:n.read?C.slate1:C.indigoL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{ICONS[n.notif_type]??'🔔'}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:600,color:C.slate9}}>{n.title}</span>
                {!n.read&&<span style={{width:7,height:7,borderRadius:'50%',background:C.indigo,display:'inline-block'}}/>}
              </div>
              <div style={{fontSize:12,color:C.slate6,lineHeight:1.5}}>{n.body}</div>
              <div style={{fontSize:11,color:C.slate4,marginTop:5}}>{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
    </div>
  );
}
