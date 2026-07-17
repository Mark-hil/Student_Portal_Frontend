import React from 'react';
import { C } from '../../utils/theme';

export function Spinner() {
  return <div style={{width:18,height:18,border:`2px solid ${C.slate2}`,borderTopColor:C.indigo,borderRadius:'50%',animation:'spin .8s linear infinite'}}/>;
}
