import { useContext, useState, type FormEvent } from 'react';
import { AccountContext, request } from '../../services/account';
async function upload(file: File) {
  const form = new FormData();
  form.set('file', file);
  const data = await request('files', form);
  if (!data.id) throw new Error('Máy chủ chưa xác nhận đã nhận tệp.');
  return String(data.id);
}

export function GeminiGrading() {
  const user = useContext(AccountContext)!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      {
        setReport('');
        const work = fields.get('work') as File;
        const rubric = fields.get('rubric') as File;
        const grading = new FormData();
        grading.set('work_id', await upload(work));
        if (rubric?.size) grading.set('rubric_id', await upload(rubric));
        grading.set('grade', String(fields.get('grade')));
        grading.set('subject', String(fields.get('subject') || 'Tự động'));
        const data = await request('grade', grading);
        if (!data.report) throw new Error('Chưa nhận được báo cáo từ Gemini.');
        setReport(data.report);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ.'); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border bg-white p-5 space-y-4">
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-3 [&_input]:border [&_input]:rounded-lg [&_input]:p-2 [&_input]:block">

          <label>Bài làm<input name="work" type="file" required /></label>
          <label>Barem (tùy chọn)<input name="rubric" type="file" /></label>
          <button type="button" onClick={e => { const input = e.currentTarget.form?.elements.namedItem('rubric') as HTMLInputElement; if (input) input.value = ''; }}>Bỏ barem</button>
          <label>Môn học<input name="subject" defaultValue="Tự động" /></label>

        <label>Khối lớp<input type="number" name="grade" min="1" max="12" defaultValue={user?.grade || 11} required /></label>
        <button className="rounded-lg bg-indigo-600 text-white p-2">{busy ? 'Đang xử lý…' : 'Chấm bằng Gemini'}</button>
      </fieldset>
    </form>
    {error && <p role="alert">{error}</p>}
    {report && <article className="whitespace-pre-wrap" aria-live="polite">{report}</article>}
  </section>;
}

