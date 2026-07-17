import React from 'react';
import { C } from '../../utils/theme';

export function Card({ children, style={}, onClick }: { children:React.ReactNode; style?:React.CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{background:'#fff',border:`1px solid ${C.slate2}`,borderRadius:14,overflow:'hidden',...style}}>{children}</div>;
}
