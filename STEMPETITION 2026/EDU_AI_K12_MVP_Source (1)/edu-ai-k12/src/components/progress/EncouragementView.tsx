import groups from '../../data/encouragement.json';
const tones=['from-violet-100 via-violet-50 border-violet-200 text-violet-900','from-orange-100 via-orange-50 border-orange-200 text-orange-900','from-green-100 via-green-50 border-green-200 text-green-900','from-blue-100 via-blue-50 border-blue-200 text-blue-900'];
export function EncouragementView(){
 return <div className="grid gap-5 md:grid-cols-2">{groups.map(({title,quotes},i)=><section key={title} className={'rounded-2xl border bg-gradient-to-br to-white p-5 sm:p-6 shadow-sm '+tones[i]}>
 <h2 className="mb-4 text-lg font-bold">{title}</h2><ol start={25*i+1} className="list-decimal pl-8 space-y-2 text-sm leading-6 text-slate-800">{quotes.map(q=><li key={q}>{q}</li>)}</ol></section>)}</div>
}