import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { C } from '../../utils/theme';
import { batchesApi } from '../../api/services';
import { Spinner } from '../../components/ui/Spinner';

interface Props {
  batchId: string;
  onClose: () => void;
}

interface ParsedGrade {
  student_id: string;
  student_name?: string;
  score: number;
  feedback?: string;
}

export function GradeUploadModal({ batchId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [parsedGrades, setParsedGrades] = useState<ParsedGrade[]>([]);
  const [headerDetected, setHeaderDetected] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (grades: Array<{ student_id: string; score: number; feedback?: string }>) =>
      batchesApi.upload(batchId, grades),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success(
        `Successfully uploaded grades! (${res.data?.total ?? parsedGrades.length} total grades recorded)`
      );
      onClose();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || 'An error occurred while uploading grades.');
    },
  });

  // Download Course Roster CSV Template
  const handleDownloadRosterTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await batchesApi.exportCsv(batchId, 'course_grade_roster_template.csv');
      toast.success('Course roster template downloaded with enrolled student IDs.');
    } catch {
      // Fallback to sample template if API fails
      handleDownloadSampleTemplate();
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Fallback / Generic Sample Template
  const handleDownloadSampleTemplate = () => {
    const csvContent =
      'student_id,student_name,email,score,feedback\n' +
      'STU-2024-8891,Charlie Student,student@uniportal.edu,85,Well demonstrated system knowledge\n' +
      'STU-2024-8892,Student Two,student2@uniportal.edu,92,Exceptional project execution\n' +
      'STU-2024-8893,Student Three,student3@uniportal.edu,78,Good effort on practical exercises\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'grade_submission_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample grade template downloaded.');
  };

  // Parse rows with intelligent column detection
  const processRawRows = (rawRows: any[][]) => {
    if (!rawRows || rawRows.length === 0) {
      setParsedGrades([]);
      return;
    }

    let startIdx = 0;
    let idCol = 0;
    let scoreCol = 1;
    let feedbackCol = 2;
    let nameCol = -1;

    const firstRow = rawRows[0].map((cell: any) => String(cell || '').trim().toLowerCase());

    // Check if the first row is a header row
    const isHeader = firstRow.some((c: string) =>
      c.includes('student') || c.includes('id') || c.includes('score') || c.includes('grade') || c.includes('mark')
    );

    if (isHeader) {
      startIdx = 1;
      setHeaderDetected(firstRow.join(', '));

      // Map column indexes by header names
      firstRow.forEach((h: string, idx: number) => {
        if (h.includes('id') || h.includes('index') || h.includes('student_id')) idCol = idx;
        else if (h.includes('score') || h.includes('mark') || h.includes('grade')) scoreCol = idx;
        else if (h.includes('feedback') || h.includes('comment') || h.includes('notes')) feedbackCol = idx;
        else if (h.includes('name')) nameCol = idx;
      });
    } else {
      setHeaderDetected(null);
      // If 5 columns standard without header: [student_id, name, email, score, feedback]
      if (firstRow.length >= 5 && isNaN(Number(firstRow[1])) && !isNaN(Number(firstRow[3]))) {
        idCol = 0;
        nameCol = 1;
        scoreCol = 3;
        feedbackCol = 4;
      }
    }

    const validGrades: ParsedGrade[] = [];
    for (let i = startIdx; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const rawId = String(row[idCol] || '').trim();
      const rawScore = String(row[scoreCol] || '').trim();
      const rawFeedback = feedbackCol >= 0 && row[feedbackCol] ? String(row[feedbackCol]).trim() : '';
      const rawName = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : '';

      if (!rawId) continue;
      const numScore = Number(rawScore);
      if (isNaN(numScore)) continue;

      validGrades.push({
        student_id: rawId,
        student_name: rawName || undefined,
        score: numScore,
        feedback: rawFeedback || undefined,
      });
    }

    setParsedGrades(validGrades);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    Papa.parse(text, {
      skipEmptyLines: true,
      complete: (results) => {
        processRawRows(results.data as any[][]);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as any[][];
            processRawRows(rows);
            setCsvText(rows.map(r => r.join(', ')).join('\n'));
            toast.success(`Loaded ${results.data.length} rows from ${file.name}`);
          },
        });
      } else if (file.name.match(/\.xls[x]?$/)) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        processRawRows(rows);
        setCsvText(rows.map(r => r.join(', ')).join('\n'));
        toast.success(`Loaded ${rows.length} rows from Excel sheet`);
      }

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
    if (parsedGrades.length === 0) {
      alert('No valid student scores detected. Please check your data or use the template.');
      return;
    }

    upload(parsedGrades.map(g => ({
      student_id: g.student_id,
      score: g.score,
      feedback: g.feedback,
    })));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.slate2}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Faculty Grade Management
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              Upload Student Results
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.slate4,
              fontSize: 20,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Template Download Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
              border: `1px solid ${C.indigo}33`,
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#fff', padding: 8, borderRadius: 10, color: C.indigo, display: 'flex' }}>
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9 }}>
                  Need a pre-filled grade spreadsheet?
                </div>
                <div style={{ fontSize: 11.5, color: C.slate6, marginTop: 2 }}>
                  Download the template with enrolled student IDs, names, and score columns.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                disabled={downloadingTemplate}
                onClick={handleDownloadRosterTemplate}
                style={{
                  background: C.indigo,
                  color: '#fff',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: downloadingTemplate ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)',
                }}
              >
                <Download size={13} />
                {downloadingTemplate ? 'Exporting...' : 'Download Template'}
              </button>
            </div>
          </div>

          {/* Action Bar (Upload File or Paste) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate7 }}>
              Import Spreadsheet or Paste Lines:
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: `1px solid ${C.indigo}44`,
                background: C.indigoL,
                color: C.indigo,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              <Upload size={14} /> Choose CSV / Excel File
            </button>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Textarea Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <textarea
                required
                value={csvText}
                onChange={(e) => handleTextChange(e.target.value)}
                style={{
                  width: '100%',
                  height: 120,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${C.slate3}`,
                  fontFamily: 'monospace',
                  fontSize: 12.5,
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
                placeholder="student_id, score, feedback&#10;STU-2024-8891, 85, Great work&#10;STU-2024-8892, 92, Perfect submission"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.slate5 }}>
                  Accepted format: <code>student_id, score, feedback(optional)</code>
                </span>
                {parsedGrades.length > 0 && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> {parsedGrades.length} valid student grade{parsedGrades.length > 1 ? 's' : ''} detected
                  </span>
                )}
              </div>
            </div>

            {/* Live Preview List */}
            {parsedGrades.length > 0 && (
              <div
                style={{
                  maxHeight: 130,
                  overflowY: 'auto',
                  border: `1px solid ${C.slate2}`,
                  borderRadius: 10,
                  background: '#f8fafc',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', borderBottom: `1px solid ${C.slate2}` }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: C.slate5, fontWeight: 700 }}>Student ID</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', color: C.slate5, fontWeight: 700 }}>Score</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: C.slate5, fontWeight: 700 }}>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedGrades.slice(0, 10).map((g, idx) => (
                      <tr key={idx} style={{ borderTop: `1px solid ${C.slate2}` }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: C.slate8 }}>
                          {g.student_id} {g.student_name ? `(${g.student_name})` : ''}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: C.indigo }}>
                          {g.score}
                        </td>
                        <td style={{ padding: '6px 10px', color: C.slate5, maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.feedback || '—'}
                        </td>
                      </tr>
                    ))}
                    {parsedGrades.length > 10 && (
                      <tr>
                        <td colSpan={3} style={{ padding: '6px 10px', textAlign: 'center', color: C.slate4, fontStyle: 'italic' }}>
                          + {parsedGrades.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: `1px solid ${C.slate3}`,
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || parsedGrades.length === 0}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.indigo,
                  color: '#fff',
                  cursor: isPending || parsedGrades.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: parsedGrades.length === 0 ? 0.6 : 1,
                  boxShadow: '0 2px 5px rgba(67, 56, 202, 0.3)',
                }}
              >
                {isPending && <Spinner />}
                Save & Upload Grades ({parsedGrades.length})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
