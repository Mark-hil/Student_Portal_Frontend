import React from 'react';
import { C } from '../../utils/theme';

export function SectionHead({ title, action }: { title:string; action?:React.ReactNode }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <h2 style={{margin:0,fontSize:16,fontWeight:800,color:C.slate9}}>{title}</h2>
      {action}
    </div>
  );
}
