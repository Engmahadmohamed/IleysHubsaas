import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student, StudentExamSearchResultItem } from '../types';
import {
  Search, Printer, Award, BookOpen, User, ShieldCheck,
  CheckCircle2, XCircle, AlertCircle, Hash, Loader2,
  GraduationCap, BarChart2
} from 'lucide-react';

// ─── Grade helpers ────────────────────────────────────────────────────────────
const gradeInfo = (marks: number) => {
  if (marks >= 90) return { letter: 'A+', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', ring: 'rgba(5,150,105,0.15)' };
  if (marks >= 80) return { letter: 'A',  color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', ring: 'rgba(13,148,136,0.15)' };
  if (marks >= 70) return { letter: 'B',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', ring: 'rgba(37,99,235,0.15)' };
  if (marks >= 60) return { letter: 'C',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', ring: 'rgba(124,58,237,0.15)' };
  if (marks >= 50) return { letter: 'D',  color: '#d97706', bg: '#fffbeb', border: '#fde68a', ring: 'rgba(217,119,6,0.15)' };
  return              { letter: 'F',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', ring: 'rgba(220,38,38,0.15)' };
};

const tierInfo = (avg: number) => {
  if (avg >= 90) return { label: 'Excellent',    emoji: '🏆', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' };
  if (avg >= 75) return { label: 'Very Good',    emoji: '⭐', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
  if (avg >= 60) return { label: 'Good',         emoji: '👍', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  if (avg >= 50) return { label: 'Satisfactory', emoji: '✅', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
  return              { label: 'Needs Work',   emoji: '📚', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
};

// ─── Subject Result Card ──────────────────────────────────────────────────────
const SubjectCard = ({ res, index }: { res: StudentExamSearchResultItem; index: number }) => {
  const g   = gradeInfo(res.marks);
  const pass = res.marks >= 50;
  const pct = Math.min(100, res.marks);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden"
      style={{
        animation: `fadeSlideUp 0.4s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${g.color}, ${g.border})` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {res.subjectName || 'Subject'}
            </p>
            <h4 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
              {res.examTitle}
            </h4>
          </div>
          {/* Grade badge */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0"
            style={{ background: g.bg, color: g.color, border: `2px solid ${g.border}`, boxShadow: `0 0 0 4px ${g.ring}` }}
          >
            {g.letter}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 font-medium">Your Score</span>
            <span className="text-xs font-black text-slate-800">{res.marks}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${g.color}, ${g.border})` }}
            />
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          {res.average !== undefined && res.average !== null ? (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <BarChart2 size={10} />
              Class avg: <strong className="text-slate-600">{res.average}%</strong>
            </span>
          ) : (
            <span />
          )}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={pass
              ? { background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }
              : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
            }
          >
            {pass ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {pass ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResultPortal() {
  const { searchStudentResults } = useApp();
  const [input,     setInput]     = useState('');
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState('');
  const [student,   setStudent]   = useState<Student | null>(null);
  const [results,   setResults]   = useState<StudentExamSearchResultItem[]>([]);
  const [orgName,   setOrgName]   = useState('');

  // Auto-search from URL
  React.useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('studentId');
    if (sid) {
      const clean = sid.trim().toUpperCase();
      setInput(clean);
      doSearch(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (id: string) => {
    const clean = id.trim().toUpperCase();
    if (!clean) { setError('Fadlan geli Student ID-ga.'); return; }
    setError(''); setStudent(null); setResults([]); setOrgName('');
    setSearching(true);
    try {
      const data = await searchStudentResults(clean);
      if (!data) {
        setError(`Ardaygan ID-ga "${clean}" lama helin. Hubi in ID-ga uu sax yahay.`);
        return;
      }
      setStudent(data.student);
      setResults(data.results);
      setOrgName(data.orgName || '');
    } catch (e: any) {
      console.error(e);
      setError('Raadinta waa ku guuldareystay. Dib u isku day.');
    } finally {
      setSearching(false);
    }
  };

  // Stats
  const totalExams   = results.length;
  const passCount    = results.filter(r => r.marks >= 50).length;
  const avg          = totalExams ? Math.round(results.reduce((s, r) => s + r.marks, 0) / totalExams * 10) / 10 : 0;
  const highest      = totalExams ? Math.max(...results.map(r => r.marks)) : 0;
  const g            = gradeInfo(avg);
  const tier         = tierInfo(avg);

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-in { animation: fadeSlideUp 0.45s ease both; }
        .result-in-d1 { animation-delay: 0.05s; }
        .result-in-d2 { animation-delay: 0.10s; }
        .result-in-d3 { animation-delay: 0.15s; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100 no-print" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="max-w-3xl mx-auto px-4 py-6">

            {/* Brand row */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
              >
                <GraduationCap size={20} color="#fff" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Student Result Portal</h1>
                <p className="text-xs text-slate-400 mt-0.5">{orgName ? `${orgName} · ` : ''}Official Academic Records</p>
              </div>
              <div className="ml-auto">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                >
                  <ShieldCheck size={11} /> Verified Portal
                </span>
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={e => { e.preventDefault(); doSearch(input); }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Hash
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={input}
                  disabled={searching}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  placeholder="Geli Student ID  (tusaale: SII00001)"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 transition-all tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
              >
                {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                {searching ? 'Raadinaya…' : 'Search'}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div
                className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Loading */}
          {searching && (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-white rounded-2xl border border-slate-100" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {!searching && student && (
            <>
              {/* ── STUDENT PROFILE CARD ─────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden result-in">
                {/* Indigo top bar */}
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 uppercase"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                    >
                      {(student.fullName || '?').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-black text-slate-900 truncate">{student.fullName}</h2>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Hash size={11} />
                          <span className="font-mono text-indigo-600 font-bold">{student.studentId || student.id}</span>
                        </span>
                        {student.gender && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 capitalize">
                            <User size={11} /> {student.gender}
                          </span>
                        )}
                      </div>
                      {orgName && (
                        <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">{orgName}</p>
                      )}
                    </div>
                    {/* Overall grade */}
                    {results.length > 0 && (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
                        style={{ background: g.bg, color: g.color, border: `2px solid ${g.border}` }}
                      >
                        {g.letter}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats strip */}
                {results.length > 0 && (
                  <div className="grid grid-cols-4 border-t border-slate-100">
                    {[
                      { label: 'Average', value: `${avg}%`, color: '#4f46e5' },
                      { label: 'Exams',   value: totalExams, color: '#0d9488' },
                      { label: 'Passed',  value: passCount, color: '#059669' },
                      { label: 'Highest', value: `${highest}%`, color: '#d97706' },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="text-center py-3 border-r border-slate-100 last:border-0"
                      >
                        <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── PERFORMANCE TIER ─────────────────────────────────── */}
              {results.length > 0 && (
                <div
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border result-in result-in-d1"
                  style={{ background: tier.bg, borderColor: tier.border }}
                >
                  <span className="text-3xl">{tier.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Standing</p>
                    <p className="text-sm font-black" style={{ color: tier.color }}>{tier.label}</p>
                  </div>
                  {/* Print button */}
                  <button
                    onClick={() => window.print()}
                    className="no-print flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
                    style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              )}

              {/* ── SUBJECT MARKS CARDS ───────────────────────────────── */}
              <div className="result-in result-in-d2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: '#eef2ff' }}
                    >
                      <BookOpen size={14} style={{ color: '#4f46e5' }} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Exam Results</h3>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                  >
                    {results.length} Exam{results.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Empty state */}
                {results.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: '#e2e8f0', background: '#fff' }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: '#f1f5f9' }}
                    >
                      <BookOpen size={24} style={{ color: '#94a3b8' }} />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No Published Results</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                      Natiijadaada wali lama daabicin. Hubi markaas teacher-kaaga ama admin-ka.
                    </p>
                  </div>
                ) : (
                  /* 2-column grid on mobile, stays 2-col on all screens */
                  <div className="grid grid-cols-2 gap-3">
                    {results.map((res, i) => (
                      <SubjectCard key={i} res={res} index={i} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── VERIFIED FOOTER ───────────────────────────────────── */}
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl result-in result-in-d3"
                style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
              >
                <ShieldCheck size={16} style={{ color: '#4f46e5', marginTop: 1 }} className="shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong className="text-indigo-600">Verified Academic Record.</strong>{' '}
                  Official result from IleysHub School Management System.
                  Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}.
                </p>
              </div>
            </>
          )}

          {/* ── IDLE STATE ─────────────────────────────────────────────── */}
          {!searching && !student && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 card-shadow"
                style={{ background: '#eef2ff' }}
              >
                <Award size={28} style={{ color: '#4f46e5' }} />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">Check Your Results</h3>
              <p className="text-sm text-slate-400 max-w-xs">
                Student ID-gaaga geli oo Search ku riix si aad natiijadaada u aragto.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
