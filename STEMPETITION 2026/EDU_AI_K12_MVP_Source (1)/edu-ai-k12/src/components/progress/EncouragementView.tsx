import { useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import groups from '../../data/encouragement.json';
import './encouragement.css';

const themes = [
  ['#7325b4', '#f7efff', '#b642ff', 'mountain', 0],
  ['#aa390b', '#fff3e4', '#ff8b29', 'plane', 1],
  ['#12633c', '#eef9ee', '#48c580', 'leaf', 0],
  ['#184d9e', '#edf6ff', '#4e98ff', 'tea', 3],
] as const;

export function EncouragementView() {
  const [open, setOpen] = useState<number | null>(null);
  const back = useRef<HTMLButtonElement>(null);
  const links = useRef<(HTMLButtonElement | null)[]>([]);
  function show(index: number | null) {
    const previous = open;
    setOpen(index);
    requestAnimationFrame(() => {
      const target = index === null ? links.current[previous ?? 0] : back.current;
      target?.focus({preventScroll: true});
      target?.scrollIntoView({block: 'center'});
    });
  }
  const cards = groups.map(({title, quotes}, i) => {
    if (open !== null && open !== i) return null;
    const [ink, tint, edge, picture, featured] = themes[i];
    const style = {'--ink':ink, '--tint':tint, '--edge':edge} as CSSProperties;
    const name = title.replace(/\s*\(\d+\s*[–-]\s*\d+\)\s*$/, '');
    const range = 'Câu ' + (25*i+1) + '–' + (25*i+quotes.length);
    const art = <img className="enc-art" src={'/assets/encouragement/'+picture+'.webp'} alt=""/>;
    return open === null ? <section className="enc-card" style={style} key={title}>
      {art}<div className="enc-copy"><h2>{name}</h2><span className="enc-range">{range}</span>
      <blockquote>{quotes[featured]}</blockquote>
      <button ref={el=>{links.current[i]=el}} onClick={()=>show(i)} aria-label={'Xem 25 câu: '+name}>Xem 25 câu <ArrowRight size={18}/></button></div>
    </section> : <article key={title} style={style} className="enc-reader">
      <header>{art}<div className="enc-copy"><button ref={back} onClick={()=>show(null)}><ArrowLeft size={18}/> Tất cả chủ đề</button>
      <h1>{name}</h1><span className="enc-range">{range}</span></div></header>
      <ol start={25*i+1}>{quotes.map((quote,j)=><li key={quote}><span aria-hidden="true">{25*i+j+1}</span>{quote}</li>)}</ol>
    </article>;
  });
  return <div className="enc">{open === null ? <><h1>Động viên khích lệ</h1><p className="mb-5 text-slate-600">100 câu · 4 chủ đề</p><div className="enc-grid">{cards}</div></> : cards}</div>;
}
