import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { C } from '../../utils/theme';
import { batchesApi } from '../../api/services';
import { Spinner } from '../../components/ui/Spinner';

export function GradeUploadModal({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: upload, isPending } = useMutation({
    mutationFn: (grades: Array<{student_id:string; score:number; feedback?:string}>) => batchesApi.upload(batchId, grades),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey:['batches']});
      queryClient.invalidateQueries({queryKey:['assignments']});
      onClose();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || "An error occurred while uploading grades.");
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as string[][];
            const text = rows.map(r => r.join(', ')).join('\n');
            setCsvText(text);
          }
        });
      } else if (file.name.match(/\.xls[x]?$/)) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        const text = rows.filter(r => r.length > 0).map(r => r.join(', ')).join('\n');
        setCsvText(text);
      }
      
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
    const grades = [];
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const student_id = parts[0].trim();
        const score = Number(parts[1].trim());
        if (isNaN(score)) continue; // skip invalid or header rows
        grades.push({ student_id, score, feedback: parts[2]?.trim() });
      }
    }
    if (grades.length > 0) {
      upload(grades);
    } else {
      alert("No valid grades found. Please check your data format.");
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#fff',padding:24,borderRadius:12,width:440,boxShadow:'0 10px 25px rgba(0,0,0,.1)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:18,fontWeight:700}}>Upload Grades</h3>
        
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <p style={{fontSize:13,color:C.slate5,margin:0}}>Format: <code>Student ID, Score, Feedback(optional)</code></p>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:6,border:`1px solid ${C.indigo}44`,background:C.indigoL,color:C.indigo,cursor:'pointer',fontWeight:700,fontSize:12}}>
            <Upload size={14}/> Import File
          </button>
          <input type="file" accept=".csv, .xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} />
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <textarea required value={csvText} onChange={e=>setCsvText(e.target.value)} style={{width:'100%',height:140,padding:'8px 12px',borderRadius:6,border:`1px solid ${C.slate3}`,fontFamily:'monospace',fontSize:13,boxSizing:'border-box'}} placeholder="22890525, 85, Good job&#10;S002, 92"/>
            <div style={{fontSize:11,color:C.slate4,marginTop:4}}>Please ensure no headers are present.</div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
            <button type="button" onClick={onClose} style={{padding:'8px 16px',borderRadius:6,border:`1px solid ${C.slate3}`,background:'#fff',cursor:'pointer',fontWeight:600}}>Cancel</button>
            <button type="submit" disabled={isPending} style={{padding:'8px 16px',borderRadius:6,border:'none',background:C.indigo,color:'#fff',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
              {isPending && <Spinner/>} Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
