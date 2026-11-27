import {RichMathText} from '../common/RichMathText';

export function GradingReport({text}:{text:string}){
 const lines=text.replace(/\r/g,'').split('\n'), blocks=[];
 const cells=(line:string)=>line.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
 for(let i=0;i<lines.length;i++){
   const line=lines[i], key=i;
   if(!line.trim())continue;
   if(line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i+1]??'')){
     const headers=cells(line), rows=[];i++;
     while(i+1<lines.length&&lines[i+1].includes('|'))rows.push(cells(lines[++i]));
     blocks.push(<div key={key} className="overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr>{headers.map((c,j)=><th key={j} className="border bg-amber-50 p-2"><RichMathText text={c}/></th>)}</tr></thead><tbody>{rows.map((row,j)=><tr key={j}>{row.map((c,k)=><td key={k} className="border p-2"><RichMathText text={c}/></td>)}</tr>)}</tbody></table></div>);continue;
   }
   const heading=line.match(/^\s*#{1,6}\s+(.+)/), bullet=line.match(/^(\s*)[-*+]\s+(.+)/);
   if(heading)blocks.push(<h3 key={key} className="pt-2 font-bold text-base text-slate-950"><RichMathText text={heading[1]}/></h3>);
   else if(bullet)blocks.push(<ul key={key} className={'list-disc '+(bullet[1].length?'pl-10':'pl-5')}><li><RichMathText text={bullet[2]}/></li></ul>);
   else blocks.push(<div key={key}><RichMathText text={line}/></div>);
 }
 return <div className="space-y-2">{blocks}</div>;
}