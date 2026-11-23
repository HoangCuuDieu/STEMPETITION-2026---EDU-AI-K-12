import { useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { KNOWLEDGE_BASE } from '../../data/knowledgeBase';
import type { CurriculumSubject, InternalModelLink } from '../../types/assistant';
import { KatexFormula } from '../common/KatexFormula';

interface KnowledgeBaseViewProps {
  onOpenModel: (link: InternalModelLink) => void;
}

function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, idx) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-indigo-900"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </>
  );
}

const ALL_SUBJECTS: CurriculumSubject[] = [
  'Toán',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Tin học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lý',
  'GDCD',
];

export function KnowledgeBaseView({ onOpenModel }: KnowledgeBaseViewProps) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<'ALL' | CurriculumSubject>('ALL');
  const [gradeBucket, setGradeBucket] = useState<'ALL' | 'primary' | 'middle' | 'high'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return KNOWLEDGE_BASE.filter((item) => {
      if (subject !== 'ALL' && item.subject !== subject) return false;
      if (gradeBucket === 'primary' && item.gradeNumber > 5) return false;
      if (gradeBucket === 'middle' && (item.gradeNumber < 6 || item.gradeNumber > 9)) return false;
      if (gradeBucket === 'high' && item.gradeNumber < 10) return false;
      if (q) {
        const hay = `${item.subject} ${item.grade} ${item.title} ${item.summary} ${item.keywords.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, subject, gradeBucket]);

  const subjectTheme = (subj: CurriculumSubject) => {
    switch (subj) {
      case 'Toán':
        return {
          card: 'border-violet-200/90 hover:border-violet-400 shadow-[0_6px_24px_rgba(124,58,237,0.06)]',
          kicker: 'bg-violet-100 text-violet-900 border-violet-200',
          formula: 'bg-gradient-to-r from-violet-50/90 to-indigo-50/80 border-violet-200/80 text-indigo-950',
          btn: 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20',
        };
      case 'Vật lý':
        return {
          card: 'border-sky-200/90 hover:border-sky-400 shadow-[0_6px_24px_rgba(14,165,233,0.06)]',
          kicker: 'bg-sky-100 text-sky-900 border-sky-200',
          formula: 'bg-gradient-to-r from-sky-50/90 to-cyan-50/80 border-sky-200/80 text-sky-950',
          btn: 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/20',
        };
      case 'Hóa học':
        return {
          card: 'border-emerald-200/90 hover:border-emerald-400 shadow-[0_6px_24px_rgba(16,185,129,0.06)]',
          kicker: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          formula: 'bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border-emerald-200/80 text-emerald-950',
          btn: 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20',
        };
      case 'Sinh học':
        return {
          card: 'border-lime-200/90 hover:border-lime-400 shadow-[0_6px_24px_rgba(101,163,13,0.06)]',
          kicker: 'bg-lime-100 text-lime-900 border-lime-200',
          formula: 'bg-gradient-to-r from-lime-50/90 to-emerald-50/80 border-lime-200/80 text-lime-950',
          btn: 'bg-gradient-to-r from-lime-600 to-emerald-600 shadow-lime-500/20',
        };
      case 'Tin học':
        return {
          card: 'border-indigo-200/90 hover:border-indigo-400 shadow-[0_6px_24px_rgba(79,70,229,0.06)]',
          kicker: 'bg-indigo-100 text-indigo-900 border-indigo-200',
          formula: 'bg-gradient-to-r from-indigo-50/90 to-sky-50/80 border-indigo-200/80 text-indigo-950',
          btn: 'bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-indigo-500/20',
        };
      case 'Ngữ văn':
        return {
          card: 'border-rose-200/90 hover:border-rose-400 shadow-[0_6px_24px_rgba(244,63,94,0.06)]',
          kicker: 'bg-rose-100 text-rose-900 border-rose-200',
          formula: 'bg-gradient-to-r from-rose-50/90 to-pink-50/80 border-rose-200/80 text-rose-950',
          btn: 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/20',
        };
      case 'Tiếng Anh':
        return {
          card: 'border-fuchsia-200/90 hover:border-fuchsia-400 shadow-[0_6px_24px_rgba(192,38,211,0.06)]',
          kicker: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
          formula: 'bg-gradient-to-r from-fuchsia-50/90 to-violet-50/80 border-fuchsia-200/80 text-fuchsia-950',
          btn: 'bg-gradient-to-r from-fuchsia-600 to-violet-600 shadow-fuchsia-500/20',
        };
      case 'Lịch sử':
        return {
          card: 'border-amber-200/90 hover:border-amber-400 shadow-[0_6px_24px_rgba(245,158,11,0.06)]',
          kicker: 'bg-amber-100 text-amber-900 border-amber-200',
          formula: 'bg-gradient-to-r from-amber-50/90 to-orange-50/80 border-amber-200/80 text-amber-950',
          btn: 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20',
        };
      default:
        return {
          card: 'border-cyan-200/90 hover:border-cyan-400 shadow-[0_6px_24px_rgba(6,182,212,0.06)]',
          kicker: 'bg-cyan-100 text-cyan-900 border-cyan-200',
          formula: 'bg-gradient-to-r from-cyan-50/90 to-teal-50/80 border-cyan-200/80 text-cyan-950',
          btn: 'bg-gradient-to-r from-cyan-600 to-teal-600 shadow-cyan-500/20',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Colorful Search & Filters Bar */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/70 via-white to-sky-50/70 p-4 sm:p-5 shadow-[0_6px_24px_rgba(20,184,166,0.07)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-sky-500 text-white inline-flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-950">
              Kho kiến thức chuẩn chương trình (Lớp 1 – 12)
            </h2>
            <p className="text-xs font-medium text-teal-800 mt-0.5 tabular-nums">
              {filtered.length} chuyên đề trọng tâm thuộc 10 môn học kèm công thức & liên kết mô hình trực quan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm chuyên đề, công thức..."
              className="pl-8 pr-3 py-2 text-sm bg-white border border-teal-200 rounded-xl w-56 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as 'ALL' | CurriculumSubject)}
            aria-label="Lọc theo môn học"
            className="px-3 py-2 text-sm border border-teal-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Tất cả 10 môn</option>
            {ALL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={gradeBucket}
            onChange={(e) =>
              setGradeBucket(e.target.value as 'ALL' | 'primary' | 'middle' | 'high')
            }
            aria-label="Lọc theo cấp học"
            className="px-3 py-2 text-sm border border-teal-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Lớp 1 – 12</option>
            <option value="primary">Tiểu học (Lớp 1 – 5)</option>
            <option value="middle">THCS (Lớp 6 – 9)</option>
            <option value="high">THPT (Lớp 10 – 12)</option>
          </select>
        </div>
      </div>

      {/* Color-Coded Knowledge Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-teal-200/80 bg-white/95 p-10 text-center text-sm text-slate-500 shadow-sm">
          Không tìm thấy chuyên đề phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((entry) => {
            const theme = subjectTheme(entry.subject);
            return (
              <article
                key={entry.id}
                className={`rounded-2xl border bg-white/95 p-5 sm:p-6 transition-all flex flex-col justify-between gap-4 hover:-translate-y-0.5 ${theme.card}`}
              >
                <div className="space-y-3.5">
                  <div className="space-y-2">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg border ${theme.kicker}`}
                    >
                      {entry.subject} · {entry.grade}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-950 leading-snug">
                      {entry.title}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    <InlineCodeText text={entry.summary} />
                  </p>

                  <div className="space-y-2">
                    {entry.formulasLatex.map((f, idx) => (
                      <div
                        key={idx}
                        className={`px-3.5 py-2.5 rounded-xl border text-sm overflow-x-auto ${theme.formula}`}
                      >
                        <KatexFormula latex={f} />
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                    <div>
                      <strong className="text-slate-900">Phương pháp giải:</strong>{' '}
                      <InlineCodeText text={entry.methodHint} />
                    </div>
                    <div>
                      <strong className="text-slate-900">Lộ trình từng bước:</strong>{' '}
                      <InlineCodeText text={entry.stepScaffold} />
                    </div>
                  </div>
                </div>

                {entry.linkedModel && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenModel(entry.linkedModel!)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white hover:brightness-110 transition-all whitespace-nowrap shadow-sm ${theme.btn}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở {entry.linkedModel.label}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
