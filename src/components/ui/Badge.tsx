import React from 'react';
import { C } from '../../utils/theme';

export function Badge({ label, color=C.slate1, text=C.slate6 }: { label:string; color?:string; text?:string }) {
  return <span style={{background:color,color:text,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99}}>{label}</span>;
}
