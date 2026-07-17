import React from 'react';
import { C } from '../../utils/theme';

export function ProgressBar({ value, color=C.indigo, h=4 }: { value:number; color?:string; h?:number }) {
  return (
    <div style={{background:'rgba(0,0,0,.06)',borderRadius:99,height:h,overflow:'hidden'}}>
      <div style={{width:`${Math.min(value,100)}%`,height:'100%',background:color,borderRadius:99,transition:'width .5s ease'}}/>
    </div>
  );
}
