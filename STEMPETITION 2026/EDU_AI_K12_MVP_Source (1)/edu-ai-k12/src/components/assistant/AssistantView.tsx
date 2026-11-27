import type { KnowledgeEntry } from '../../types/assistant';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileUp,
  Send,
  Sparkles,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AccountContext, request } from '../../services/account';
import { findRelatedModels } from '../../services/localAI';
import type {
  ChatMessage,
  CurriculumSubject,
  InternalModelLink,
  SupportLevel,
} from '../../types/assistant';
import { RichMathText } from '../common/RichMathText';
interface AssistantViewProps {
  lesson: KnowledgeEntry | null;
  onRemoveLesson: (lesson: KnowledgeEntry) => void;
  onOpenModel: (link: InternalModelLink) => void;
}

const LEVEL_OPTIONS: { level: SupportLevel; title: string; desc: string }[] = [
  {
    level: 1,
    title: 'Mức 1 · Gợi ý kiến thức',
    desc: 'Chỉ nêu khái niệm, định lý và công thức nền tảng liên quan.',
  },
  {
    level: 2,
    title: 'Mức 2 · Phương pháp giải',
    desc: 'Hướng dẫn hướng tiếp cận và thiết lập phương trình, chưa thay số.',
  },
  {
    level: 3,
    title: 'Mức 3 · Phân tích từng bước',
    desc: 'Tách từng bước tư duy để bạn tự tính ra đáp số cuối cùng.',
  },
];

const SUBJECT_FILTER_OPTIONS: { id: CurriculumSubject | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả 10 môn' },
  { id: 'Toán', label: 'Toán' },
  { id: 'Vật lý', label: 'Vật lý' },
  { id: 'Hóa học', label: 'Hóa học' },
  { id: 'Sinh học', label: 'Sinh học' },
  { id: 'Tin học', label: 'Tin học' },
  { id: 'Ngữ văn', label: 'Ngữ văn' },
  { id: 'Tiếng Anh', label: 'Tiếng Anh' },
  { id: 'Lịch sử', label: 'Lịch sử' },
  { id: 'Địa lý', label: 'Địa lý' },
  { id: 'GDCD', label: 'GDCD' },
];

const QUICK_PROMPTS_BY_SUBJECT: Record<CurriculumSubject | 'ALL', string[]> = {
  ALL: [
    'Giải phương trình x^2 - 5x + 6 = 0 và kiểm tra hệ thức Vi-ét.',
    'Tính khối lượng mol và số mol của 9.8g H2SO4.',
    'Phân tích phương trình chuyển động ném xiên và cách tính tầm xa cực đại.',
    'So sánh cấu trúc phân tử Benzene (C6H6) và tinh thể NaCl.',
    'Giải thích công thức tính số nuclêôtit ADN và phiên mã mARN (Sinh học 12).',
    'So sánh thuật toán Tìm kiếm nhị phân Binary Search và QuickSort (Tin học).',
  ],
  Toán: [
    'Giải phương trình x^2 - 5x + 6 = 0 và kiểm tra hệ thức Vi-ét.',
    'Cách xác định góc giữa cạnh bên SB và mặt đáy (ABCD) của hình chóp S.ABCD.',
    'Công thức tính đạo hàm, cực trị và phương trình tiếp tuyến (Toán 12).',
  ],
  'Vật lý': [
    'Phân tích phương trình chuyển động ném xiên và cách tính tầm xa cực đại.',
    'Điều kiện cộng hưởng điện trong mạch xoay chiều RLC nối tiếp.',
    'Công thức khoảng vân giao thoa ánh sáng khe Y-âng và quang điện.',
  ],
  'Hóa học': [
    'Tính khối lượng mol và số mol của 9.8g H2SO4.',
    'So sánh cấu trúc phân tử Benzene (C6H6) và tinh thể NaCl.',
    'Cách cân bằng phản ứng oxi hóa – khử và tính pH dung dịch.',
  ],
  'Sinh học': [
    'Giải thích công thức tính số nuclêôtit ADN và phiên mã mARN (Sinh học 12).',
    'Phân biệt Nguyên phân và Giảm phân kèm công thức tính tế bào con.',
    'Quy luật Mendel và phương trình cân bằng Hardy–Weinberg.',
  ],
  'Tin học': [
    'So sánh thuật toán Tìm kiếm nhị phân Binary Search và QuickSort (Tin học).',
    'Cách đổi số thập phân sang hệ nhị phân và viết vòng lặp Python.',
    'Cú pháp câu lệnh SQL SELECT, WHERE, JOIN và khóa chính/khóa ngoại.',
  ],
  'Ngữ văn': [
    'Phân biệt biện pháp tu từ Ẩn dụ và Hoán dụ kèm cách phân tích tác dụng.',
    'Dàn ý 4 bước viết đoạn văn Nghị luận xã hội chuẩn điểm cao.',
    'Các phương thức biểu đạt và phong cách ngôn ngữ Tiếng Việt.',
  ],
  'Tiếng Anh': [
    'Tổng hợp 12 thì Tiếng Anh kèm dấu hiệu nhận biết nhanh.',
    'Công thức Câu điều kiện loại 1, 2, 3 và cách đảo ngữ.',
    'Cách chuyển câu chủ động sang câu bị động và câu gián tiếp.',
  ],
  'Lịch sử': [
    'Trục các mốc Lịch sử Việt Nam từ 938 đến Cách mạng tháng Tám 1945 – 1975 – 1986.',
    'Trật tự hai cực Ianta và xu thế đa cực sau Chiến tranh lạnh.',
  ],
  'Địa lý': [
    'Tổng hợp các công thức tính mật độ dân số, năng suất và cơ cấu GDP Địa lý.',
    'Mẹo chọn đúng loại biểu đồ Tròn, Đường, Cột, Miền trong Địa lý.',
  ],
  GDCD: [
    'Phân tích quy luật Cung – Cầu và phân biệt 4 loại trách nhiệm pháp lý.',
    'Khái niệm lạm phát, thất nghiệp và vai trò ngân sách nhà nước.',
  ],
};

export function AssistantView({ onOpenModel, lesson, onRemoveLesson }: AssistantViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState<SupportLevel>(2);
  const [subjectFilter, setSubjectFilter] = useState<CurriculumSubject | 'ALL'>('ALL');
  const account = useContext(AccountContext);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);

  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [fileId, setFileId] = useState<string>('');
  const [extractingFile, setExtractingFile] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    request('chat').then(rows => {
      if (active) setMessages(rows.map((row: { id: string; role: ChatMessage['role']; content: string; created_at: string }) => ({
        id: row.id, role: row.role, content: row.content, timestamp: Date.parse(row.created_at), level: 2,
      })));
    }).catch(err => { if (active) setFileError(err.message); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    setExtractingFile(true);
    setFileError('');
    try {
      const form = new FormData();
      form.set('file', file);
      const data = await request('files', form);
      if (!data.id) throw new Error('Chưa tải được tệp.');
      setFileId(data.id);
      setAttachedFileName(file.name);
    } catch (err) { setFileError(err instanceof Error ? err.message : 'Chưa tải được tệp.'); }
    finally { setExtractingFile(false); }
  };

  const handleSend = async (customText?: string) => {
    if (loadingHistory || sending || clearing || extractingFile) return;
    const text = (customText ?? input).trim();
    if (!text && !fileId) return;
    const query = text || `Hãy phân tích nội dung tệp ${attachedFileName} giúp em.`;

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: query,
      level,
      timestamp: Date.now(),
      attachedFileName: attachedFileName || undefined,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setSending(true);
    setFileError('');
    try {
      const data = await request('chat', {
        message: query, grade: account?.grade || 11,
        subject: subjectFilter,
        level, file_id: fileId || null,
        lesson_context: lesson ? [lesson.title, lesson.grade, lesson.summary, ...lesson.formulasLatex,
          lesson.methodHint, lesson.stepScaffold].join('\n') : '',
      }, () => setRetrying(true));
      if (!data.reply) throw new Error('Chưa nhận được phản hồi từ Gemini.');
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.reply,
        level, timestamp: Date.now(), relatedModels: findRelatedModels(query, 4, subjectFilter) }]);
      if (lesson) onRemoveLesson(lesson);
      setAttachedFileName('');
      setFileId('');
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
      setInput(text);
      setFileError(err instanceof Error ? err.message : 'Chưa nhận được phản hồi.');
    } finally { setRetrying(false); setSending(false); }
  };

  function downloadConversation() {
    const text = messages.map(msg => (msg.role === 'user' ? 'Bạn' : 'Trợ lý') + ': ' + msg.content).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'EduMind-hoi-thoai.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const [clearing, setClearing] = useState(false);
  const handleClear = async () => {
    setClearing(true);
    try {
    const response = await fetch('/api/chat', {method: 'DELETE', headers: {'X-Requested-With':'XMLHttpRequest'}});
    if (!response.ok) throw new Error();
    setMessages([]);
    } catch { setFileError('Chưa xóa được hội thoại.'); } finally { setClearing(false); }
  };

  const levelCardTheme = (lvl: SupportLevel, active: boolean) => {
    if (lvl === 1) {
      return active
        ? 'border-sky-500 bg-gradient-to-r from-sky-50 to-cyan-50 ring-2 ring-sky-500/80 shadow-sm'
        : 'border-sky-200/70 bg-sky-50/25 hover:border-sky-300 hover:bg-sky-50/60';
    }
    if (lvl === 2) {
      return active
        ? 'border-violet-500 bg-gradient-to-r from-violet-50 to-indigo-50 ring-2 ring-violet-500/80 shadow-sm'
        : 'border-violet-200/70 bg-violet-50/25 hover:border-violet-300 hover:bg-violet-50/60';
    }
    return active
      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-500/80 shadow-sm'
      : 'border-emerald-200/70 bg-emerald-50/25 hover:border-emerald-300 hover:bg-emerald-50/60';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Unified Colorful Configuration Panel (4 cols) */}
      <div className="lg:col-span-4 rounded-2xl border border-violet-200/80 bg-white/95 shadow-[0_6px_28px_rgba(124,58,237,0.07)] divide-y divide-violet-100 overflow-hidden">
        {/* 3 Color-Coded Support Levels */}
        <div className="p-4 space-y-2">
          <h3 className="text-xs font-bold text-violet-800">Chọn mức độ hỗ trợ sư phạm</h3>
          <div className="space-y-1.5">
            {LEVEL_OPTIONS.map((opt) => {
              const active = level === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => setLevel(opt.level)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-all ${levelCardTheme(opt.level, active)}`}
                >
                  <div className="text-xs font-extrabold text-slate-950">{opt.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Focus Chips (10 K-12 Subjects) */}
        <div className="p-4 space-y-2 bg-gradient-to-b from-white to-sky-50/35">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-sky-800">Môn học trọng tâm (10 môn)</h3>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
              Lớp 1–12
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_FILTER_OPTIONS.map((subj) => {
              const active = subjectFilter === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setSubjectFilter(subj.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-sky-600 border-transparent text-white shadow-xs'
                      : 'bg-white border-violet-200/80 text-slate-700 hover:border-sky-300 hover:bg-sky-50/70'
                  }`}
                >
                  {subj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Curriculum Prompts */}
        <div className="p-4 space-y-2 bg-gradient-to-b from-white to-amber-50/30">
          <h3 className="text-xs font-bold text-amber-800">Câu hỏi gợi ý nhanh</h3>
          <div className="space-y-1.5">
            {(QUICK_PROMPTS_BY_SUBJECT[subjectFilter] ?? QUICK_PROMPTS_BY_SUBJECT.ALL).map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loadingHistory || sending || clearing || extractingFile} onClick={() => handleSend(q)}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-900 hover:bg-gradient-to-r hover:from-violet-50 hover:to-sky-50 p-2.5 rounded-xl border border-violet-100/90 transition-colors leading-relaxed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Chat Stream (8 cols) */}
      <div className="lg:col-span-8 lg:sticky lg:top-[84px] rounded-2xl border border-violet-200/80 bg-white/95 shadow-[0_6px_28px_rgba(99,102,241,0.08)] flex flex-col h-[min(600px,calc(100dvh-148px))] lg:h-[calc(100dvh-128px)] min-h-[440px] max-h-[760px] overflow-hidden">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-violet-100 bg-gradient-to-r from-violet-50/80 via-sky-50/60 to-emerald-50/40">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 text-white inline-flex items-center justify-center shadow-sm shadow-indigo-500/25 shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-950">
                Trợ lý hướng dẫn học tập (Lớp 1 – 12)
              </h2>
              <div className="text-xs font-medium text-indigo-700 mt-0.5">
                Gemini · {loadingHistory ? 'Đang mở hội thoại…' : retrying ? 'Gemini tạm thời chưa sẵn sàng, đang thử lại…' : sending ? 'Đang trả lời…' : 'Tự động lưu vào tài khoản'}
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={downloadConversation} disabled={!messages.length || sending || clearing} className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold" title="Tải bản sao .txt"><Download size={15}/>Lưu hội thoại (.txt)</button>
          {messages.length > 0 && (
            <button
              type="button"
              disabled={clearing || sending} aria-busy={clearing} onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa hội thoại
            </button>
          )}
          </div>
        </div>

        {/* Message List */}
        <div
          ref={messageListRef}
          className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white via-violet-50/15 to-sky-50/20"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-emerald-400 text-white inline-flex items-center justify-center shadow-md shadow-sky-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="text-base font-extrabold text-slate-900">
                Xin chào! Hỏi đáp toàn bộ 10 môn học Lớp 1 – 12
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tích hợp đầy đủ Toán, Vật lý (50 mô phỏng), Hóa học (100 mô hình 3D + tính mol/M), Sinh học, Tin học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, GDCD cùng đọc tệp PDF/DOCX/ảnh OCR.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white border border-violet-200/80 text-slate-800 shadow-xs'
                  }`}
                >
                  {msg.attachedFileName && (
                    <div className="text-[11px] text-sky-200 mb-1.5 font-semibold">
                      Tệp đính kèm: {msg.attachedFileName}
                    </div>
                  )}
                  <RichMathText text={msg.content} isUser={msg.role === 'user'} />

                  {msg.limitationNotice && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-start gap-2 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>{msg.limitationNotice}</span>
                    </div>
                  )}

                  {msg.relatedModels && msg.relatedModels.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-violet-100 space-y-2">
                      <div className="text-[11px] font-bold text-indigo-700">
                        Mở mô hình trực quan liên quan:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.relatedModels.map((link) => (
                          <button
                            key={link.id}
                            type="button"
                            onClick={() => onOpenModel(link)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-indigo-700 hover:from-sky-500 hover:to-indigo-600 hover:text-white transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div className="h-1" />
        </div>

        {/* Composer Bar */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-violet-100 bg-gradient-to-r from-violet-50/50 via-white to-sky-50/50 space-y-2">
          {lesson && <div className="mb-2 flex items-center gap-2 text-sm text-teal-800">
            <span>Chuyên đề đính kèm: {lesson.title}</span>
            <button type="button" aria-label="Bỏ chuyên đề" disabled={sending} onClick={() => onRemoveLesson(lesson)}>×</button>
          </div>}
          {(attachedFileName || fileError || extractingFile) && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs">
              <span className="text-sky-900 font-medium">
                {fileError || (extractingFile
                  ? 'Đang tải tệp…'
                  : attachedFileName
                    ? `Đã đính kèm: ${attachedFileName}`
                    : '')}
              </span>
              {attachedFileName && (
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileName('');
                    setFileId('');
                  }}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Gỡ tệp
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.md,.json,.pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={extractingFile} aria-busy={extractingFile} onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 transition-colors shrink-0"
              title="Tải tệp PDF, DOCX, PPTX, XLSX, TXT hoặc ảnh"
            >
              <FileUp className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập câu hỏi Toán, Lý, Hóa, Sinh, Tin, Văn, Anh, Sử, Địa, GDCD..."
              className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              aria-busy={sending} disabled={loadingHistory || sending || clearing || extractingFile}
              onClick={() => handleSend()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 shrink-0 shadow-sm shadow-indigo-500/25"
            >
              <Send className="w-4 h-4" />
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



