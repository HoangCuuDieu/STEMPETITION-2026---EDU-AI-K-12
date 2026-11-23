import { useState, type FormEvent } from 'react';
import { GraduationCap } from 'lucide-react';
import { request, type Account } from './services/account';

export function SignIn({ onLogin, checking }: { onLogin: (user: Account) => void; checking: boolean }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      const account = await request(register ? 'auth/register' : 'auth/login',
        register ? {...values, grade: Number(values.grade)} : values);
      if (!account.id) throw new Error('Chưa xác nhận được tài khoản.');
      onLogin(account);
    } catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.'); }
    finally { setBusy(false); }
  }
  const field = 'block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-center focus:outline-sky-500';
  return <main className="min-h-dvh bg-white grid place-items-center px-4 py-20 text-center">
    <div className="fixed inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />
    <section className="relative w-full max-w-80">
      <div className="absolute bottom-full mb-5 inset-x-0 flex items-center justify-center gap-2 font-bold text-xl text-sky-800">
        <span className="rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 p-2 text-white"><GraduationCap size={22}/></span>EduMind AI
      </div>
      <form onSubmit={submit} className="flex min-h-96 flex-col justify-center gap-5 rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-lg">
        <h1 className="text-2xl font-bold">{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <fieldset disabled={busy || checking} className="grid gap-3 text-sm">
          {register && <label>Họ tên<input className={field} name="name" required minLength={2} autoComplete="name"/></label>}
          <label>Email<input className={field} name="email" type="email" required autoComplete="email"/></label>
          <label>Mật khẩu<input className={field} name="password" type="password" required minLength={register ? 10 : 1} autoComplete={register ? 'new-password' : 'current-password'}/></label>
          {register && <label>Khối lớp<input className={field} name="grade" type="number" min="1" max="12" defaultValue="11" required/></label>}
          <button aria-busy={busy || checking} disabled={busy || checking} className="rounded-xl bg-gradient-to-r from-blue-700 to-emerald-700 p-3 font-semibold text-white">{checking ? 'Đang kiểm tra phiên…' : busy ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}</button>
          <button type="button" className="text-sky-800" onClick={() => {setRegister(!register); setError('');}}>{register ? 'Quay lại đăng nhập' : 'Tạo tài khoản mới'}</button>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </form>
    </section>
  </main>;
}
