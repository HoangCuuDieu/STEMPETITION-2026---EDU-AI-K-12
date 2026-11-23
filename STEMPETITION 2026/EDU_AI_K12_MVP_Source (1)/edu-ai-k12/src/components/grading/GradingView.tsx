import { GeminiGrading } from './GeminiGrading';
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileUp,
  HelpCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { loadGradingRecords, saveGradingRecord } from '../../services/db';
import { extractTextFromFile } from '../../services/fileExtractor';
import {
  analyzeStudentWork,
  gradeAgainstRubric,
} from '../../services/gradingService';
import type { GradingMode, GradingResult } from '../../types/assistant';

const SAMPLE_WORK = `Áp dụng định luật bảo toàn cơ năng tại điểm ném và mặt đất:
W = 1/2 * m * v^2 + m * g * h
2 + 3 = 6
Suy ra v = sqrt(v0^2 + 2gh)`;

const SAMPLE_RUBRIC = `1. Viết đúng biểu thức bảo toàn cơ năng gồm động năng và thế năng - 1.5 điểm
2. Biến đổi tìm vận tốc chạm đất v = sqrt(v0^2 + 2gh) - 1.5 điểm
3. Trình bày kết luận và đơn vị chuẩn m/s - 1.0 điểm`;

export function GradingView() {
  const [engine, setEngine] = useState<'gemini' | 'local'>('gemini');
  return <div className="space-y-4">
    <nav aria-label="Phương thức chấm bài" className="flex gap-3">
      <button aria-pressed={engine === 'gemini'} className="rounded-lg border px-3 py-2 aria-pressed:bg-indigo-100" onClick={() => setEngine('gemini')}>Chấm bằng Gemini</button>
      <button aria-pressed={engine === 'local'} className="rounded-lg border px-3 py-2 aria-pressed:bg-indigo-100" onClick={() => setEngine('local')}>Phân tích trên thiết bị</button>
    </nav>
    <div hidden={engine !== 'gemini'}><GeminiGrading /></div>
    <div hidden={engine !== 'local'}><LocalGradingView /></div>
  </div>;
}

function LocalGradingView() {
  const [mode, setMode] = useState<GradingMode>('analyze');
  const [studentText, setStudentText] = useState(SAMPLE_WORK);
  const [rubricText, setRubricText] = useState(SAMPLE_RUBRIC);
  const [ocrConfidence, setOcrConfidence] = useState(1.0);
  const [fileName, setFileName] = useState<string>('');
  const [extracting, setExtracting] = useState(false);

  const [result, setResult] = useState<GradingResult | null>(null);
  const [history, setHistory] = useState<GradingResult[]>([]);

  const workFileRef = useRef<HTMLInputElement | null>(null);
  const rubricFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadGradingRecords()
      .then(setHistory)
      .catch(() => {});
  }, []);

  const [readingRubric, setReadingRubric] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleUploadWork = async (file: File) => {
    setExtracting(true);
    const res = await extractTextFromFile(file).finally(() => setExtracting(false));
    setFileName(res.fileName);
    setStudentText(res.text);
    setOcrConfidence(res.confidence);
  };

  const handleUploadRubric = async (file: File) => {
    setReadingRubric(true);
    const res = await extractTextFromFile(file).finally(() => setReadingRubric(false));
    if (res.text) {
      setRubricText(res.text);
    }
  };

  const handleEvaluate = () => {
    const res =
      mode === 'analyze'
        ? analyzeStudentWork({
            text: studentText,
            ocrConfidence,
            fileName: fileName || undefined,
          })
        : gradeAgainstRubric({
            studentText,
            rubricText,
            ocrConfidence,
            fileName: fileName || undefined,
          });
    setResult(res);
  };

  const handleTeacherScoreChange = (criterionId: string, rawVal: string) => {
    if (!result?.rubricItems) return;
    const num = rawVal === '' ? null : Number(rawVal);
    setResult({
      ...result,
      rubricItems: result.rubricItems.map((item) =>
        item.criterionId === criterionId
          ? {
              ...item,
              teacherScore:
                num !== null && Number.isFinite(num)
                  ? Math.max(0, Math.min(item.maxScore, num))
                  : null,
            }
          : item,
      ),
    });
  };

  const handleSaveResult = async () => {
    if (!result) return;
    setSaving(true);
    try {
    await saveGradingRecord(result);
    const updated = await loadGradingRecords();
    setHistory(updated);
    } finally { setSaving(false); }
  };

  const totalTeacherScore =
    result?.rubricItems?.reduce((acc, i) => acc + (i.teacherScore ?? 0), 0) ?? 0;
  const totalMaxScore =
    result?.rubricItems?.reduce((acc, i) => acc + i.maxScore, 0) ?? 0;
  const confidencePct = Math.round(ocrConfidence * 100);
  const lowConfidence = ocrConfidence < 0.7;

  return (
    <div className="space-y-6">
      {/* Colorful Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-white/95 px-4 py-3 shadow-[0_6px_24px_rgba(245,158,11,0.07)]">
        <div
          role="tablist"
          aria-label="Chế độ chấm và phân tích bài làm"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-amber-50/90 border border-amber-200/70"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'analyze'}
            onClick={() => {
              setMode('analyze');
              setResult(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              mode === 'analyze'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25'
                : 'text-slate-700 hover:text-indigo-800 hover:bg-white/70'
            }`}
          >
            Chế độ 1 · Phân tích từng bước
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'rubric'}
            onClick={() => {
              setMode('rubric');
              setResult(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              mode === 'rubric'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm shadow-amber-500/25'
                : 'text-slate-700 hover:text-amber-800 hover:bg-white/70'
            }`}
          >
            Chế độ 2 · Chấm theo biểu điểm
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border tabular-nums ${
            lowConfidence
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {lowConfidence ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
          Độ tin cậy văn bản: <span>{confidencePct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-indigo-200/80 bg-white/95 p-5 shadow-[0_6px_24px_rgba(99,102,241,0.06)] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950">
                  Nội dung bài làm học sinh {fileName ? `(${fileName})` : ''}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập trực tiếp hoặc tải tệp PDF, DOCX, ảnh chụp bài viết tay
                </p>
              </div>
              <div>
                <input
                  ref={workFileRef}
                  type="file"
                  accept=".txt,.csv,.md,.pdf,.docx,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadWork(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={extracting} aria-busy={extracting} onClick={() => workFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                  {extracting ? 'Đang trích xuất...' : 'Tải bài làm / Ảnh OCR'}
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={studentText}
              onChange={(e) => {
                setStudentText(e.target.value);
                setOcrConfidence(1.0);
              }}
              placeholder="Dán nội dung bài làm hoặc tải tệp PDF/DOCX/ảnh lên..."
              className="w-full p-3.5 text-sm font-mono bg-indigo-50/30 border border-indigo-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {mode === 'rubric' && (
            <div className="rounded-2xl border border-amber-200/80 bg-white/95 p-5 shadow-[0_6px_24px_rgba(245,158,11,0.06)] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">Biểu điểm / Đáp án giáo viên</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mỗi dòng một ý chấm kèm thang điểm chuẩn
                  </p>
                </div>
                <div>
                  <input
                    ref={rubricFileRef}
                    type="file"
                    accept=".txt,.csv,.md,.pdf,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadRubric(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={readingRubric} aria-busy={readingRubric} onClick={() => rubricFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    <FileUp className="w-3.5 h-3.5 text-amber-600" />
                    Tải biểu điểm
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
                placeholder="Mỗi dòng một tiêu chí, ví dụ: 1. Viết đúng công thức động năng - 1.5 điểm"
                className="w-full p-3.5 text-sm bg-amber-50/30 border border-amber-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-amber-500 transition-colors leading-relaxed"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleEvaluate}
            className={`w-full py-3 px-4 rounded-xl text-white text-sm font-bold hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 shadow-md ${
              mode === 'analyze'
                ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/25'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            {mode === 'analyze' ? 'Chạy phân tích từng bước' : 'Chạy chấm theo biểu điểm'}
          </button>
        </div>

        {/* Right Evaluation Dossier (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {!result ? (
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/30 to-indigo-50/30 p-10 text-center shadow-[0_6px_24px_rgba(99,102,241,0.05)] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white inline-flex items-center justify-center mx-auto shadow-sm">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                Bảng thẩm định bài làm sẵn sàng
              </div>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Nhấn nút phân tích hoặc chấm bài để xem nhận xét từng bước, phát hiện sai sót tính toán và rà soát điểm thành phần.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-200/80 bg-white/95 shadow-[0_6px_28px_rgba(99,102,241,0.08)] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/60">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    {result.mode === 'analyze'
                      ? 'Kết quả phân tích từng bước'
                      : 'Bảng chấm theo biểu điểm'}
                  </h3>
                  <div className="text-xs font-medium text-indigo-700 mt-0.5 tabular-nums">
                    {result.mode === 'analyze'
                      ? `${result.analysisSteps?.length ?? 0} bước trình bày được bóc tách`
                      : `${result.rubricItems?.length ?? 0} tiêu chí biểu điểm`}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving} aria-busy={saving} onClick={handleSaveResult}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu vào lịch sử
                </button>
              </div>

              {result.limitationNotice && (
                <div className="mx-5 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{result.limitationNotice}</span>
                </div>
              )}

              {/* Mode 1 Steps */}
              {result.analysisSteps && result.analysisSteps.length > 0 && (
                <div className="divide-y divide-indigo-100/70">
                  {result.analysisSteps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className={`px-5 py-4 space-y-2 text-xs ${
                        st.status === 'correct'
                          ? 'bg-emerald-50/25'
                          : st.status === 'warning'
                            ? 'bg-rose-50/40'
                            : 'bg-amber-50/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          Bước {st.stepNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap border ${
                            st.status === 'correct'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : st.status === 'warning'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {st.status === 'correct' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : st.status === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <HelpCircle className="w-3.5 h-3.5" />
                          )}
                          {st.status === 'correct'
                            ? 'Hợp lý'
                            : st.status === 'warning'
                              ? 'Cần kiểm tra lại'
                              : 'Cần bổ sung căn cứ'}
                        </span>
                      </div>
                      <div className="font-mono text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                        {st.excerpt}
                      </div>
                      <div className="text-slate-700 leading-relaxed font-medium">
                        {st.observation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 1 Improvement Advice */}
              {result.improvementAdvice && result.improvementAdvice.length > 0 && (
                <div className="border-t border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-sky-50/60 px-5 py-4 space-y-2">
                  <div className="text-xs font-extrabold text-indigo-900">
                    Gợi ý cải thiện bài làm
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {result.improvementAdvice.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode 2 Rubric Table with Teacher Override */}
              {result.rubricItems && result.rubricItems.length > 0 && (
                <div>
                  <div className="divide-y divide-amber-100/80">
                    {result.rubricItems.map((item) => (
                      <div key={item.criterionId} className="px-5 py-4 space-y-1.5 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold text-slate-950 leading-relaxed">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                            <input
                              type="number"
                              min={0}
                              max={item.maxScore}
                              step={0.25}
                              value={item.teacherScore ?? ''}
                              onChange={(e) =>
                                handleTeacherScoreChange(item.criterionId, e.target.value)
                              }
                              placeholder="—"
                              aria-label={`Điểm cho tiêu chí ${item.criterionId}`}
                              className="w-16 px-2.5 py-1 text-right font-extrabold bg-amber-50/60 border border-amber-300 rounded-lg focus:outline-none focus:bg-white focus:border-amber-600"
                            />
                            <span className="text-slate-600 font-semibold">/ {item.maxScore} đ</span>
                          </div>
                        </div>
                        <div className="text-slate-600 leading-relaxed">{item.reason}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 text-white text-sm font-extrabold tabular-nums">
                    <span>Tổng điểm sau rà soát giáo viên</span>
                    <span className="bg-white/15 px-3 py-1 rounded-lg">
                      {result.canAutoEvaluate ||
                      result.rubricItems.some((i) => i.teacherScore !== null)
                        ? `${totalTeacherScore.toFixed(2)} / ${totalMaxScore.toFixed(2)} điểm`
                        : 'Chờ giáo viên nhập điểm'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved History */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-indigo-200/80 bg-white/95 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Lịch sử chấm bài đã lưu ({history.length})
                </h4>
              </div>
              <div className="divide-y divide-indigo-100 max-h-48 overflow-y-auto text-xs border border-indigo-100 rounded-xl">
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setResult(h)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/60 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 truncate">
                      {h.mode === 'analyze' ? 'Phân tích bước' : 'Chấm biểu điểm'} ·{' '}
                      {h.fileName || h.extractedText.slice(0, 36)}
                    </span>
                    <span className="text-indigo-500 font-medium tabular-nums shrink-0 ml-3">
                      {new Date(h.createdAt).toLocaleTimeString('vi-VN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

