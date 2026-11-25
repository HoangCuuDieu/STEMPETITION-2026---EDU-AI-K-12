import type { SolidPreset, Point3D } from './mathGeometry';

function rings(id:string, name:string, sides:number, upper:number, shift=0, round=false):SolidPreset {
  const points:Point3D[]=[], faces:string[][]=[];
  function ring(top:boolean) {
    const count=top && upper===0 ? 1 : sides;
    return Array.from({length:count},(_,i)=>{
      const angle=2*Math.PI*i/sides;
      const label=count===1?'S':(round?'P'+(i+1):String.fromCharCode(65+i))+(top?'′':'');
      const r=top?upper:2;
      points.push({id:label,label,x:r*Math.cos(angle)+(top?shift:0),y:top?3:0,z:r*Math.sin(angle)});
      return label;
    });
  }
  const a=ring(false), b=ring(true);
  faces.push(a);
  if(b.length>1) faces.push(b);
  a.forEach((p,i)=>{const j=(i+1)%sides; faces.push(b.length===1?[p,a[j],b[0]]:[p,a[j],b[j],b[i]])});
  const result=mesh(id,name,points,faces);
  if(round){
    result.round={bottom:2,top:upper,height:3};
    result.description='Bán kính đáy 2 đv, chiều cao 3 đv. Đường tròn được vẽ bằng các cung chia nhỏ.';
    result.formulasLatex=['V=\\frac{\\pi h}{3}(R^2+Rr+r^2)'];
  }
  return result;
}
function mesh(id:string,name:string,points:Point3D[],faces:string[][]):SolidPreset {
  const edges=new Map<string,{id:string;fromId:string;toId:string}>();
  for(const f of faces) f.forEach((a,i)=>{const b=f[(i+1)%f.length],key=[a,b].sort().join('/');edges.set(key,{id:key,fromId:a,toId:b})});
  return {id:'math-'+id,name,points,faces,segments:[...edges.values()],subtitle:'',description:'',formulasLatex:[]};
}
function sphere():SolidPreset {
  const points:Point3D[]=[], faces:string[][]=[];
  const rings=Array.from({length:13},(_,j)=>Array.from({length:j===0||j===12?1:24},(_,i)=>{
    const id='P'+points.length, a=i*Math.PI/12,b=j*Math.PI/12;
    points.push({id,label:id,x:2*Math.sin(b)*Math.cos(a),z:2*Math.sin(b)*Math.sin(a),y:2+2*Math.cos(b)});return id;
  }));
  for(let j=0;j<12;j++) for(let i=0;i<24;i++){const a=rings[j],b=rings[j+1],k=(i+1)%24;faces.push([...new Set([a[i%a.length],a[k%a.length],b[k%b.length],b[i%b.length]])])}
  return {...mesh('sphere','Hình cầu',points,faces),round:{radius:2},formulasLatex:['V=4\\pi R^3/3']};
}
function octahedron(){
  const p=[[2,2,0],[0,2,2],[-2,2,0],[0,2,-2],[0,4,0],[0,0,0]].map(([x,y,z],i)=>({x,y,z,id:'ABCDEF'[i],label:'ABCDEF'[i]}));
  return mesh('octa','Bát diện đều',p,['EAB','EBC','ECD','EDA','FAB','FBC','FCD','FDA'].map(f=>f.split('')));
}
// The icosahedron and its dual share the same rotational symmetries.
function platonicDual(){
  const phi=(1+Math.sqrt(5))/2;
  const raw:number[][]=[];
  for(const a of [-1,1])for(const b of [-phi,phi])raw.push([0,a,b],[a,b,0],[b,0,a]);
  function vertex(v:number[],i:number){const [x,y,z]=v;const id=String.fromCharCode(65+i);return {id,label:id,x,y:y+2,z}}
  const pts=raw.map(vertex), faces:number[][]=[];
  const edge=(i:number,j:number)=>Math.abs(Math.hypot(...raw[i].map((v,k)=>v-raw[j][k]))-2)<1e-8;
  for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++)if(edge(i,j)&&edge(j,k)&&edge(k,i))faces.push([i,j,k]);
  const centers=faces.map(f=>[0,1,2].map(k=>f.reduce((s,i)=>s+raw[i][k],0)/3));
  const dual=centers.map(vertex);
  const pentagons=raw.map((axis,i)=>{
    const len=Math.hypot(...axis),[x,y,z]=axis.map(n=>n/len),d=Math.hypot(x,y);
    const u=[y/d,-x/d,0],v=[z*x/d,z*y/d,-d];
    const dot=(a:number[],b:number[])=>a.reduce((s,t,k)=>s+t*b[k],0);
    const angle=(j:number)=>Math.atan2(dot(centers[j],v),dot(centers[j],u));
    return faces.map((_,j)=>j).filter(j=>faces[j].includes(i)).sort((a,b)=>angle(a)-angle(b)).map(j=>dual[j].id);
  });
  return [mesh('icosa','Khối hai mươi mặt đều',pts,faces.map(f=>f.map(i=>pts[i].id))),mesh('dodeca','Khối mười hai mặt đều',dual,pentagons)];
}
export const extraSolids=[
  rings('cube','Hình lập phương',4,2),rings('upright','Lăng trụ đứng ngũ giác',5,2),rings('oblique','Lăng trụ xiên',4,2,1),
  rings('pyramid-oblique','Hình chóp thường',4,0,1),rings('pyramid-regular','Hình chóp đều ngũ giác',5,0),
  rings('frustum','Hình chóp cụt đều',4,1),octahedron(),rings('cylinder','Hình trụ',32,2,0,true),
  rings('cone','Hình nón',32,0,0,true),rings('cone-frustum','Hình nón cụt',32,1,0,true),sphere(),...platonicDual()
];
for(const p of extraSolids[0].points) if(p.y) p.y=2*Math.sqrt(2);

