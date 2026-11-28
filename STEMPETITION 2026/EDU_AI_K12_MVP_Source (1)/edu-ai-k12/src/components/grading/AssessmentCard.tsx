import { RichMathText } from '../common/RichMathText';

export interface Assessment {
  summary: string;
  total: number | null;
  criteria: {title: string; feedback: string; earned: number | null; maximum: number | null}[];
  strengths: string;
  next_step: string;
}

const format = (value: number) => value.toLocaleString('vi-VN');

export function AssessmentCard({value, teacherRubric}: {value: Assessment; teacherRubric: boolean}) {
  return <div className="mt-5 space-y-5 text-slate-800">
    <div className="flex flex-wrap items-center gap-4">
      <div className="grid size-24 shrink-0 place-items-center rounded-full bg-slate-100 p-2"
        style={value.total === null ? undefined : {background: 'conic-gradient(#f97316 ' + value.total*10 + '%, #f1f5f9 0)'}}>
        <strong className="grid size-full place-content-center rounded-full bg-white text-xl">{value.total === null ? '—' : format(value.total)+'/10'}</strong>
      </div>
      <div className="min-w-40 flex-1"><p className="text-xs text-slate-600">{value.total === null ? 'Chưa đủ căn cứ tính tổng điểm' : teacherRubric ? 'Điểm đề xuất theo barem đã gửi' : 'Điểm tham khảo theo thang AI đề xuất'}</p>
        <div className="mt-1 font-semibold"><RichMathText text={value.summary}/></div></div>
    </div>
    {value.criteria.length > 0 && <table className="w-full overflow-hidden rounded-xl text-left text-sm"><thead className="bg-violet-50"><tr><th className="p-3">Tiêu chí</th><th className="p-3 text-right">Điểm</th></tr></thead>
      <tbody>{value.criteria.map((row,i)=><tr key={i} className="border-b border-slate-100 align-top"><td className="p-3"><strong><RichMathText text={row.title}/></strong><div className="mt-1 leading-relaxed"><RichMathText text={row.feedback}/></div></td>
        <td className="p-3 text-right font-semibold">{row.maximum === null ? 'Tham khảo' : (row.earned === null ? '—' : format(row.earned))+'/'+format(row.maximum)}</td></tr>)}</tbody></table>}
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><strong className="text-emerald-800">Điểm làm tốt</strong><div><RichMathText text={value.strengths}/></div></div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="text-amber-800">Cần bổ sung</strong><div><RichMathText text={value.next_step}/></div></div>
  </div>;
}
