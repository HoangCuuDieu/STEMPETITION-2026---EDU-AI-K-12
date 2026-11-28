import {AssessmentCard, type Assessment} from './AssessmentCard';
import {GradingReport} from './GradingReport';
import { ClipboardCheck, FileText } from 'lucide-react';
import { useContext, useEffect, useState, type FormEvent } from 'react';
import { AccountContext, request } from '../../services/account';
async function upload(file: File) {
  const form = new FormData();
  form.set('file', file);
  const data = await request('files', form);
  if (!data.id) throw new Error('Máy chủ chưa xác nhận đã nhận tệp.');
  return String(data.id);
}

function GradingHeading({result = false}: {result?: boolean}) {
  const Icon = result ? ClipboardCheck : FileText;
  return <h2 className={'relative isolate -mx-5 -mt-5 flex items-center gap-3 overflow-hidden rounded-t-2xl px-5 py-4 text-xl font-bold text-slate-950 sm:-mx-6 sm:-mt-6 sm:px-6 ' + (result ? 'bg-gradient-to-b from-orange-50 to-transparent' : 'bg-gradient-to-b from-violet-50 to-transparent')}>
    <svg aria-hidden="true" viewBox="0 0 100 50" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_bottom,black_10%,rgba(0,0,0,.65)_55%,transparent)]">
      <path fill={result ? '#ffdfc5' : '#e8dcff'} d={result ? 'M0 12 C25 -2 58 50 100 44 V50 H0Z' : 'M0 47 C50 48 65 32 100 12 V50 H0Z'}/>
    </svg>
    <span className={'grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ' + (result ? 'from-amber-500 to-rose-500' : 'from-violet-500 to-indigo-600')}><Icon size={21} aria-hidden="true"/></span>
    {result ? 'Kết quả chấm bài' : 'Nội dung bài làm'}
  </h2>;
}

export function GeminiGrading() {
  const user = useContext(AccountContext)!;
  const [retrying, setRetrying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');


  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [teacherRubric, setTeacherRubric] = useState(false);
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    const url = workFile?.type.startsWith('image/') ? URL.createObjectURL(workFile) : '';
    setPreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [workFile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      {
        setReport('');
        setAssessment(null);
        const work = fields.get('work') as File;
        const rubric = fields.get('rubric') as File;
        const grading = new FormData();
        grading.set('work_id', await upload(work));
        if (rubric?.size) grading.set('rubric_id', await upload(rubric));
        grading.set('grade', String(fields.get('grade')));
        grading.set('subject', String(fields.get('subject') || 'Tự động'));
        const data = await request('grade', grading, () => setRetrying(true));
        if (!data.report) throw new Error('Chưa nhận được báo cáo từ trợ lý AI.');
        setTeacherRubric(Boolean(data.has_teacher_rubric));
        setAssessment(data.assessment ?? null);
        setReport(data.report);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ.'); }
    finally { setRetrying(false); setBusy(false); }
  }

  const uploadStyle = 'mt-2 block w-full min-w-0 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-sm font-normal text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:font-semibold file:text-indigo-800';
  const fieldStyle = 'mt-2 block w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 font-normal text-slate-900';
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)]">
      <form onChange={() => {setReport(''); setAssessment(null); setError('');}} onSubmit={submit} className="min-w-0">
        <fieldset disabled={busy} className="space-y-4">
          <section className="space-y-5 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm sm:p-6">
            <GradingHeading/>
            <label className="block text-sm font-semibold">Bài làm học sinh
              <span className="relative mt-2 flex cursor-pointer flex-wrap items-center gap-4 rounded-xl border border-violet-200 bg-violet-50 p-4 focus-within:ring-2 focus-within:ring-violet-500">{preview ? <img src={preview} alt="Xem trước bài làm" className="max-h-60 max-w-full rounded-lg bg-white object-contain shadow-sm sm:max-w-[55%]"/> : <FileText className="size-9 text-violet-500"/>}<span className="min-w-0 flex-1 break-words">{workFile?.name}<span className="mt-2 block w-fit rounded-lg border border-indigo-200 bg-white px-3 py-2 text-indigo-700">{workFile ? "Đổi tệp" : "Chọn tệp bài làm"}</span></span><input name="work" type="file" required className="absolute inset-0 size-full cursor-pointer opacity-0" onChange={e=>setWorkFile(e.target.files?.[0] ?? null)}/></span>
            </label>
            <div>
              <label className="block text-sm font-semibold">Barem <span className="font-normal text-slate-500">(tùy chọn)</span>
                <input name="rubric" type="file" onChange={e=>setRubricFile(e.target.files?.[0] ?? null)} className={uploadStyle}/>
              </label>
              {rubricFile && <button type="button" className="mt-2 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                onClick={e => { const input = e.currentTarget.form?.elements.namedItem('rubric') as HTMLInputElement; if (input) input.value = ''; setRubricFile(null); setReport(''); setAssessment(null); }}>
                Bỏ barem
              </button>}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-indigo-100 pt-4 text-sm font-semibold">
              <label>Môn học<select name="subject" defaultValue="Tự động" className={fieldStyle}>{["Tự động","Toán học","Vật lý","Hóa học","Sinh học","Tin học","Ngữ văn","Tiếng Anh","Lịch sử","Địa lý","Giáo dục công dân","Giáo dục kinh tế và pháp luật"].map(subject => <option key={subject}>{subject}</option>)}</select></label>
              <label>Khối lớp<select name="grade" defaultValue={user?.grade || 11} className={fieldStyle}>{Array.from({length: 12}, (_, i) => <option key={i} value={i + 1}>Lớp {i + 1}</option>)}</select></label>
            </div>
          </section>
          <button aria-busy={busy} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 px-4 py-3 font-bold text-white shadow-sm hover:brightness-110">
            {!busy && <ClipboardCheck aria-hidden="true" size={18}/>}
            {retrying ? 'Gemini tạm thời chưa sẵn sàng, đang thử lại…' : busy ? 'Đang chấm bài…' : 'Chấm bài bằng trợ lý AI'}
          </button>
        </fieldset>
        {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
      </form>
      <section aria-live="polite" className="min-w-0 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/60 p-5 shadow-sm sm:p-6">
        <GradingHeading result/>
        <div className={report ? undefined : "flex min-h-80 flex-col items-center justify-center gap-3 py-6 text-center"}>
          {!report && <img src="/assets/illustrations/grading-checklist-9b34fb851cf5.webp" width={300} height={255} alt="" className="w-60 max-w-full mix-blend-multiply [mask-image:radial-gradient(ellipse_closest-side,black_85%,transparent_125%)] sm:w-72"/>}
          {!report && <p className="text-sm text-slate-600">{busy ? 'Trợ lý đang đọc bài làm và chuẩn bị nhận xét.' : 'Nhận xét và điểm sẽ xuất hiện ở đây sau khi chấm.'}</p>}
        </div>
        {assessment && <AssessmentCard value={assessment} teacherRubric={teacherRubric}/>}
        {!assessment && report && <article className="mt-5 break-words border-t border-amber-100 pt-4 text-sm leading-7 text-slate-800"><GradingReport text={report}/></article>}
      </section>
    </div>
  );
}

