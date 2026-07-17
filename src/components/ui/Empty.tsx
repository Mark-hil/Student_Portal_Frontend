import React from 'react';
import { C } from '../../utils/theme';

export function Empty({ icon:Icon, title, sub }: { icon:any; title:string; sub:string }) {
  return (
    <div style={{textAlign:'center',padding:'48px 24px',color:C.slate4}}>
      <Icon size={34} style={{margin:'0 auto 12px',opacity:.4}}/>
      <div style={{fontWeight:700,color:C.slate6,marginBottom:4}}>{title}</div>
      <div style={{fontSize:12}}>{sub}</div>
    </div>
  );
}
