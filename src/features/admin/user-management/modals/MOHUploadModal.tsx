import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  X,
  FileText,
  Download,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../../api/services';
import { C } from '../../../../utils/theme';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import type { MOHUploadResult } from '../../../../types';

interface MOHUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MOHUploadModal: React.FC<MOHUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isMobile } = useBreakpoint();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mohFile, setMohFile] = useState<File | null>(null);
  const [defaultProgram, setDefaultProgram] = useState<'nursing' | 'midwifery' | ''>('');
  const [defaultClass, setDefaultClass] = useState('100');
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear().toString());
  const [isDryRun, setIsDryRun] = useState(false);
  const [mohUploadResult, setMohUploadResult] = useState<MOHUploadResult | null>(null);
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);

  if (!isOpen) return null;

  const handleUploadRoster = async () => {
    if (!mohFile) {
      toast.error('Please select an MOH roster CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', mohFile);
    if (defaultProgram) formData.append('default_program', defaultProgram);
    if (defaultClass) formData.append('default_class', defaultClass);
    if (defaultYear) formData.append('default_year', defaultYear);
    if (isDryRun) formData.append('dry_run', 'true');

    setIsUploadingRoster(true);
    try {
      const res = await adminApi.uploadMOHRoster(formData);
      setMohUploadResult(res.data);
      if (!isDryRun) {
        qc.invalidateQueries({ queryKey: ['users'] });
        toast.success(`Successfully provisioned ${res.data.imported_count} student(s) with official ASDAM IDs!`);
        onSuccess?.();
      } else {
        toast.success(`Dry run complete: ${res.data.imported_count} valid records checked.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process student roster.');
    } finally {
      setIsUploadingRoster(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await adminApi.downloadMOHTemplate();
      toast.success('Downloaded MOH student template CSV');
    } catch {
      toast.error('Failed to download CSV template');
    }
  };

  const handleClose = () => {
    setMohUploadResult(null);
    setMohFile(null);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 720, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.slate9, letterSpacing: '-0.02em' }}>
                MOH Student Roster & ASDAM ID Generator
              </h3>
              <div style={{ fontSize: 12.5, color: C.slate5, marginTop: 2 }}>
                Upload Ministry of Health admission lists to provision accounts with unique IDs for Nursing (NUR) & Midwifery (MID).
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate4, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {!mohUploadResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Template Download Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--slate-50)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.slate2}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8 }}>Need the standard CSV format?</div>
                  <div style={{ fontSize: 11.5, color: C.slate5 }}>Includes example columns: MOH PIN, Serial Number, Program, Class, Year</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: '#fff',
                  border: `1px solid ${C.slate3}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.slate7,
                  cursor: 'pointer',
                }}
              >
                <Download size={14} /> Download Sample Template
              </button>
            </div>

            {/* Batch Metadata Options */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                  Default Program
                </label>
                <select
                  value={defaultProgram}
                  onChange={e => setDefaultProgram(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, background: '#fff' }}
                >
                  <option value="">Auto-detect from CSV</option>
                  <option value="nursing">Nursing (Code: NUR)</option>
                  <option value="midwifery">Midwifery (Code: MID)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                  Academic Class
                </label>
                <input
                  value={defaultClass}
                  onChange={e => setDefaultClass(e.target.value)}
                  placeholder="e.g. 100"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.slate7, marginBottom: 4 }}>
                  Admission Year
                </label>
                <input
                  value={defaultYear}
                  onChange={e => setDefaultYear(e.target.value)}
                  placeholder="e.g. 2026"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Drag-and-Drop Dropzone */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setMohFile(f);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${mohFile ? '#059669' : C.slate3}`,
                  background: mohFile ? '#f0fdf4' : '#fafafa',
                  borderRadius: 14,
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: mohFile ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mohFile ? '#059669' : C.slate5 }}>
                    <UploadCloud size={22} />
                  </div>
                  {mohFile ? (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>
                        {mohFile.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                        {(mohFile.size / 1024).toFixed(1)} KB · Ready to process
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.slate8 }}>
                        Click to browse or drop student roster CSV here
                      </div>
                      <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>
                        Accepts CSV files with UTF-8 or standard encoding
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dry Run Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.slate7, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={e => setIsDryRun(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>
                <strong>Dry Run Validation Only</strong> — Preview generated Student IDs without writing to database.
              </span>
            </label>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={handleClose}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadRoster}
                disabled={!mohFile || isUploadingRoster}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  background: !mohFile ? C.slate3 : '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: !mohFile || isUploadingRoster ? 'not-allowed' : 'pointer',
                  fontSize: 13.5,
                  fontWeight: 700,
                  boxShadow: !mohFile ? 'none' : '0 4px 12px rgba(5,150,105,0.3)'
                }}
              >
                {isUploadingRoster ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing Roster & IDs…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> {isDryRun ? 'Validate Roster (Dry Run)' : 'Import & Generate Student IDs'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Upload Results Summary View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Result Status Banner */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: mohUploadResult.errors.length === 0 ? '#ecfdf5' : '#fffbeb',
              border: `1.5px solid ${mohUploadResult.errors.length === 0 ? '#86efac' : '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              {mohUploadResult.errors.length === 0 ? (
                <CheckCircle2 size={24} color="#16a34a" className="shrink-0" />
              ) : (
                <AlertTriangle size={24} color="#d97706" className="shrink-0" />
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: mohUploadResult.errors.length === 0 ? '#15803d' : '#b45309' }}>
                  {mohUploadResult.dry_run ? 'Dry Run Validation Completed' : 'Roster Processing Complete'}
                </div>
                <div style={{ fontSize: 13, color: mohUploadResult.errors.length === 0 ? '#166534' : '#92400e', marginTop: 2 }}>
                  {mohUploadResult.imported_count} student(s) successfully {mohUploadResult.dry_run ? 'validated' : 'provisioned'} with ASDAM IDs.
                  {mohUploadResult.skipped_count > 0 && ` ${mohUploadResult.skipped_count} row(s) skipped due to validation errors.`}
                  {!mohUploadResult.dry_run && mohUploadResult.imported_count > 0 && (
                    <div style={{ marginTop: 6, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      <Mail size={14} /> Automated Welcome SMS & Email credentials dispatched to {mohUploadResult.imported_count} student(s) for mandatory registration.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Student IDs Table Preview */}
            {mohUploadResult.students.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8, marginBottom: 8 }}>
                  Generated ASDAM Student IDs ({mohUploadResult.students.length}):
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${C.slate2}`, borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.slate0, borderBottom: `1px solid ${C.slate2}` }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Generated Student ID</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Student Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>MOH PIN</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: C.slate6 }}>Program</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mohUploadResult.students.map((st, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.slate1}` }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                            <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                              {st.student_id}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: C.slate9 }}>{st.full_name}</td>
                          <td style={{ padding: '8px 12px', color: C.slate7 }}>{st.moh_pin}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: st.program === 'nursing' ? '#dcfce7' : '#f3e8ff',
                              color: st.program === 'nursing' ? '#15803d' : '#7e22ce',
                            }}>
                              {st.program_label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Validation Errors List (if any) */}
            {mohUploadResult.errors.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>
                  Validation Issues ({mohUploadResult.errors.length}):
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10 }}>
                  {mohUploadResult.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 11.5, color: '#991b1b', marginBottom: 3 }}>
                      <strong>Row {err.row}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => { setMohUploadResult(null); setMohFile(null); }}
                style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate7 }}
              >
                Upload Another Batch
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{ padding: '9px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
