import groups from '../../data/encouragement.json';

const themes = [
  ['from-violet-800 via-purple-600 to-fuchsia-700', 'from-violet-100 via-violet-50 text-violet-900'],
  ['from-orange-800 via-orange-600 to-amber-700', 'from-orange-100 via-orange-50 text-orange-900'],
  ['from-green-800 via-green-600 to-emerald-700', 'from-green-100 via-green-50 text-green-900'],
  ['from-blue-800 via-blue-600 to-sky-700', 'from-blue-100 via-blue-50 text-blue-900'],
];

export function EncouragementView() {
  return <div className="grid gap-5 md:grid-cols-2">
    {groups.map(({ title, quotes }, i) => (
      <section key={title} className={'flex rounded-2xl bg-gradient-to-br p-[3px] shadow-sm ' + themes[i][0]}>
        <div className={'w-full rounded-[13px] bg-gradient-to-br to-white p-5 sm:p-6 ' + themes[i][1]}>
          <h2 className="mb-4 text-lg font-bold">{title}</h2>
          <ol start={25*i+1} className="list-decimal pl-8 space-y-2 text-sm leading-6 text-slate-800">
            {quotes.map(q => <li key={q}>{q}</li>)}
          </ol>
        </div>
      </section>
    ))}
  </div>;
}
