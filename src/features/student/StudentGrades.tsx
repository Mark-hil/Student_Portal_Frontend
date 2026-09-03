import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, BarChart2, FileDown, GraduationCap, FileText, Filter } from 'lucide-react';
import { C, gpaColor, gradeColor } from '../../utils/theme';
import { gradesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Empty } from '../../components/ui/Empty';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ScrollableTable } from '../../components/ui/Responsive';
import toast from 'react-hot-toast';

export function StudentGrades() {
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<'transcript' | 'coursework'>('transcript');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [downloading, setDownloading] = useState(false);
  const qc = useQueryClient();

  const { data: gpa, refetch: refetchGpa } = useQuery({
    queryKey: ['gpa-summary'],
    queryFn: () => gradesApi.gpaSummary().then((r) => r.data),
    staleTime: 10_000,
  });

  const { data: gradeData, refetch: refetchGrades } = useQuery({
    queryKey: ['grades', {}],
    queryFn: () => gradesApi.list().then((r) => r.data),
    staleTime: 10_000,
  });

  const { data: transcript, refetch: refetchTranscript } = useQuery({
    queryKey: ['transcript'],
    queryFn: () => gradesApi.transcript().then((r) => r.data),
    staleTime: 10_000,
  });

  const recompute = useMutation({
    mutationFn: () => gradesApi.recompute(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gpa-summary'] });
      qc.invalidateQueries({ queryKey: ['transcript'] });
      qc.invalidateQueries({ queryKey: ['grades'] });
      refetchGpa();
      refetchTranscript();
      refetchGrades();
      toast.success('GPA and Transcripts refreshed');
    },
  });

  const allGrades = gradeData?.results ?? [];
  const semGPA = gpa?.semester_gpa ? parseFloat(gpa.semester_gpa) : null;
  const cumGPA = gpa?.cumulative_gpa ? parseFloat(gpa.cumulative_gpa) : null;

  const uniqueCourses = Array.from(new Set(allGrades.map((g: any) => g.assignment?.course_code).filter(Boolean)));
  const filteredGrades = selectedCourse === 'ALL'
    ? allGrades
    : allGrades.filter((g: any) => g.assignment?.course_code === selectedCourse);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await gradesApi.downloadTranscriptPdf();
      toast.success('Unofficial Transcript downloaded (Watermarked)');
    } catch (err) {
      toast.error('Failed to generate transcript PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.slate9, margin: 0, letterSpacing: '-0.02em' }}>
            Academic Performance & Transcripts
          </h2>
          <div style={{ fontSize: 13.5, color: C.slate5, marginTop: 4 }}>
            Review your verified academic transcript, GPA history, and published coursework scores.
          </div>
        </div>

        {activeTab === 'transcript' && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: C.indigo,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '11px 20px',
              fontSize: 14,
              fontWeight: 700,
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              fontFamily: 'inherit',
              opacity: downloading ? 0.7 : 1,
              transition: 'all 0.15s ease',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <FileDown size={17} /> {downloading ? 'Generating PDF…' : 'Download PDF Transcript'}
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? 6 : 12,
          borderBottom: `1px solid ${C.slate2}`,
          paddingBottom: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          onClick={() => setActiveTab('transcript')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '10px 14px' : '12px 22px',
            fontSize: isMobile ? 13.5 : 14.5,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'transcript' ? `2.5px solid ${C.indigo}` : '2.5px solid transparent',
            color: activeTab === 'transcript' ? C.indigo : C.slate5,
            marginBottom: -2,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <GraduationCap size={18} /> Official Transcript & GPA
        </button>

        <button
          onClick={() => setActiveTab('coursework')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '10px 14px' : '12px 22px',
            fontSize: isMobile ? 13.5 : 14.5,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'coursework' ? `2.5px solid ${C.indigo}` : '2.5px solid transparent',
            color: activeTab === 'coursework' ? C.indigo : C.slate5,
            marginBottom: -2,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={18} /> Coursework & Assignment Grades
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 99,
              background: activeTab === 'coursework' ? C.indigoL : C.slate1,
              color: activeTab === 'coursework' ? C.indigo : C.slate5,
            }}
          >
            {allGrades.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICIAL TRANSCRIPT & GPA */}
      {/* ========================================================================= */}
      {activeTab === 'transcript' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* GPA Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {[
              {
                label: 'Semester GPA',
                val: semGPA,
                desc: `${gpa?.current_semester_label ?? 'Current'} · In progress`,
                sub: `${gpa?.credits_this_semester ?? 0} credits enrolled`,
                grad: `${C.indigo},#818cf8`,
              },
              {
                label: 'Cumulative GPA (CGPA)',
                val: cumGPA,
                desc: `All ${(gpa?.semester_history ?? []).length} completed semesters`,
                sub: `${gpa?.credits_completed ?? 0} total credits earned`,
                grad: `${C.navy},${C.navy2}`,
              },
            ].map((g, i) => (
              <div
                key={i}
                style={{
                  background: `linear-gradient(135deg,${g.grad})`,
                  borderRadius: 16,
                  padding: isMobile ? '18px 20px' : '22px 26px',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -25,
                    right: -25,
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.08)',
                  }}
                />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
                  {g.label}
                </div>
                <div style={{ fontSize: isMobile ? 38 : 44, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>
                  {g.val != null ? g.val.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', marginTop: 8, fontWeight: 500 }}>
                  {g.desc}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>
                  {g.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Semester Progress History */}
          {(gpa?.semester_history ?? []).length > 0 && (
            <Card style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.slate9 }}>GPA Trajectory by Semester</div>
                  <div style={{ fontSize: 11, color: C.slate5, marginTop: 2 }}>Breakdown of semester vs. cumulative academic standing</div>
                </div>
                <button
                  onClick={() => recompute.mutate()}
                  disabled={recompute.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: `1px solid ${C.slate2}`,
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.slate6,
                    cursor: recompute.isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <RefreshCw size={12} className={recompute.isPending ? 'spin' : ''} /> {recompute.isPending ? 'Calculating…' : 'Refresh'}
                </button>
              </div>

              {gpa!.semester_history.map((s: any) => {
                const sg = s.semester_gpa ? parseFloat(s.semester_gpa) : null;
                const cg = s.cumulative_gpa ? parseFloat(s.cumulative_gpa) : null;
                return (
                  <div
                    key={s.semester}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 0',
                      borderBottom: `1px solid ${C.slate1}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.slate7, width: 120, flexShrink: 0 }}>
                      {s.semester_label}
                    </div>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={sg ? (sg / 4) * 100 : 0} color={gpaColor(sg)} h={8} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>Semester</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: gpaColor(sg) }}>
                          {sg?.toFixed(2) ?? '—'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>Cumulative</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: gpaColor(cg) }}>
                          {cg?.toFixed(2) ?? '—'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', width: 55 }}>
                        <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>Credits</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.slate6 }}>
                          {s.semester_credits_earned}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 24,
                  paddingTop: 14,
                  borderTop: `2px solid ${C.slate2}`,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: C.slate9, marginRight: 'auto' }}>
                  Cumulative Graduation Standing
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>CGPA</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: gpaColor(cumGPA) }}>
                    {cumGPA?.toFixed(2) ?? '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', width: 55 }}>
                  <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>Total Cr</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.slate9 }}>
                    {gpa?.credits_completed ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Official Term-by-Term Transcript */}
          {(transcript ?? []).length > 0 ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.slate9, marginBottom: 12, letterSpacing: '-0.01em' }}>
                Official Course Transcript
              </div>
              {transcript!.map((sem: any) => (
                <Card key={sem.semester} style={{ marginBottom: 16, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '12px 20px',
                      background: C.slate0,
                      borderBottom: `1px solid ${C.slate2}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.slate9 }}>
                      {sem.label}
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      {[
                        ['Semester GPA', sem.semester_gpa],
                        ['Cumulative GPA', sem.cumulative_gpa],
                        ['Credits Earned', sem.credits_earned],
                      ].map(([l, v]: any) => (
                        <div key={l} style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: C.slate4, fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: l.includes('GPA') && v ? gpaColor(parseFloat(v)) : C.slate7,
                            }}
                          >
                            {v ?? '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transcript Table Header & Rows */}
                  <ScrollableTable minWidth={580}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '9px 20px',
                        background: C.slate0,
                        borderBottom: `1px solid ${C.slate2}`,
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.slate4,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      <span style={{ width: 85 }}>Course</span>
                      <span style={{ flex: 1 }}>Course Title</span>
                      <span style={{ width: 70, textAlign: 'center' }}>Credits</span>
                      <span style={{ width: 90, textAlign: 'center' }}>Final Score</span>
                      <span style={{ width: 60, textAlign: 'center' }}>Grade</span>
                      <span style={{ width: 60, textAlign: 'right' }}>Grade Pts</span>
                    </div>

                    {sem.courses?.map((row: any) => {
                      const scoreVal = row.score_percentage != null ? parseFloat(row.score_percentage) : null;
                      return (
                        <div
                          key={row.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '11px 20px',
                            borderBottom: `1px solid ${C.slate1}`,
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 800, color: C.indigo, width: 85 }}>
                            {row.course_code}
                          </span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.slate7 }}>
                            {row.course_title}
                          </span>
                          <span style={{ fontSize: 11, color: C.slate5, width: 70, textAlign: 'center' }}>
                            {row.credits_attempted} cr
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreVal ? C.slate9 : C.slate4, width: 90, textAlign: 'center' }}>
                            {scoreVal != null ? `${scoreVal.toFixed(1)}%` : '—'}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: gradeColor(row.final_grade), width: 60, textAlign: 'center' }}>
                            {row.final_grade || '—'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.slate6, width: 60, textAlign: 'right' }}>
                            {row.grade_points != null ? parseFloat(row.grade_points).toFixed(2) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </ScrollableTable>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={{ padding: 24 }}>
              <Empty
                icon={GraduationCap}
                title="No transcript records"
                sub="Your official course history will display once courses and term records are finalized."
              />
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COURSEWORK & ASSIGNMENT GRADES */}
      {/* ========================================================================= */}
      {activeTab === 'coursework' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Filter size={14} color={C.slate5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.slate7 }}>Filter by Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.slate2}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.slate7,
                  background: '#fff',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Enrolled Courses ({allGrades.length} items)</option>
                {uniqueCourses.map((c) => (
                  <option key={c as string} value={c as string}>
                    {c as string}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, color: C.slate5 }}>
              Showing <strong>{filteredGrades.length}</strong> published assessment(s)
            </div>
          </div>

          {/* Grades Table */}
          <Card style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${C.slate1}`,
                fontSize: 14,
                fontWeight: 700,
                color: C.slate9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>Published Assessment Scores</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.slate5 }}>
                Scores verified & published by course instructors
              </span>
            </div>

            {filteredGrades.length === 0 ? (
              <Empty
                icon={BarChart2}
                title="No published grades found"
                sub="Grades appear here once your instructor submits and the academic officer publishes them."
              />
            ) : (
              <ScrollableTable minWidth={620}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.slate0 }}>
                      {['Course', 'Assessment Title', 'Score', 'Grade', 'Weight', 'Category', 'Published Date'].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: '12px 20px',
                              textAlign: 'left',
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.slate5,
                              textTransform: 'uppercase',
                              letterSpacing: '.04em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((g: any) => (
                      <tr key={g.id} style={{ borderTop: `1px solid ${C.slate1}` }}>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              padding: '4px 9px',
                              borderRadius: 99,
                              background: C.indigoL,
                              color: C.indigo,
                            }}
                          >
                            {g.assignment.course_code}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 700, color: C.slate8 }}>
                          {g.assignment.title}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: C.slate9 }}>
                            {g.score}
                          </span>
                          <span style={{ fontSize: 12, color: C.slate4 }}> /{g.assignment.max_score}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: gradeColor(g.letter_grade) }}>
                            {g.letter_grade}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: C.slate6 }}>
                          {g.assignment.weight}%
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <Badge label={g.assignment.assignment_type} />
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12.5, color: C.slate5 }}>
                          {g.graded_at ? new Date(g.graded_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

