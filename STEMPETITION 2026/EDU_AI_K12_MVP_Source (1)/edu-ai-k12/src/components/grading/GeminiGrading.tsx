import { useEffect, useState, type FormEvent } from 'react';

async function request(path: string, body?: FormData | Record<string, unknown>) {
  const headers: Record<string, string> = {};
  if (body) headers['X-Requested-With'] = 'XMLHttpRequest';
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET', headers, credentials: 'same-origin',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Yêu cầu thất bại (' + response.status + ').');
  return data;
}

async function upload(file: File) {
  const form = new FormData();
  form.set('file', file);
  const data = await request('files', form);
  if (!data.id) throw new Error('Máy chủ chưa xác nhận đã nhận tệp.');
  return String(data.id);
}

export function GeminiGrading() {
  const [user, setUser] = useState<{name: string; grade?: number} | null>(null);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');
  useEffect(() => {
    let active = true;
    request('auth/me').then(data => { if (active && data.name) setUser(data); })
      .catch(() => {}).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (!user) {
        const credentials = {email: fields.get('email'), password: fields.get('password')};
        const account = await request(register ? 'auth/register' : 'auth/login',
          register ? {...credentials, name: fields.get('name'), grade: Number(fields.get('grade'))} : credentials);
        if (!account.name) throw new Error('Máy chủ chưa xác nhận đăng nhập.');
        setUser(account);
      } else {
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

  async function logout() {
    setBusy(true);
    try { await request('auth/logout', {}); setUser(null); setReport(''); setError(''); }
    catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border bg-white p-5 space-y-4">
    <form key={user ? 'grade' : 'auth'} onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-3 [&_input]:border [&_input]:rounded-lg [&_input]:p-2 [&_input]:block">
        {user ? <>
          <div>{user.name} · <button type="button" onClick={logout}>Đăng xuất</button></div>
          <label>Bài làm<input name="work" type="file" required /></label>
          <label>Barem (tùy chọn)<input name="rubric" type="file" /></label>
          <button type="button" onClick={e => { const input = e.currentTarget.form?.elements.namedItem('rubric') as HTMLInputElement; if (input) input.value = ''; }}>Bỏ barem</button>
          <label>Môn học<input name="subject" defaultValue="Tự động" /></label>
        </> : <>
          {register && <label>Họ tên<input name="name" required minLength={2} /></label>}
          <label>Email<input name="email" type="email" required /></label>
          <label>Mật khẩu<input name="password" type="password" required minLength={register ? 10 : 1} autoComplete={register ? 'new-password' : 'current-password'} /></label>
          <button type="button" onClick={() => {setRegister(!register); setError('');}}>{register ? 'Dùng tài khoản đã có' : 'Tạo tài khoản mới'}</button>
        </>}
        {(user || register) && <label>Khối lớp<input type="number" name="grade" min="1" max="12" defaultValue={user?.grade || 11} required /></label>}
        <button className="rounded-lg bg-indigo-600 text-white p-2">{busy ? 'Đang xử lý…' : user ? 'Chấm bằng Gemini' : register ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
      </fieldset>
    </form>
    {error && <p role="alert">{error}</p>}
    {report && <article className="whitespace-pre-wrap" aria-live="polite">{report}</article>}
  </section>;
}
