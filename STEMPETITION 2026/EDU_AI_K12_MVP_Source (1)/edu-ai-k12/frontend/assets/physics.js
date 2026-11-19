/* Real 2D kinematics with SI parameters. Six implemented models, not fifty. */
import { $, $$, esc } from './app.js';
const MODELS = {
 horizontal:{name:'Ném ngang',params:[['v','Vận tốc ngang ban đầu',12,1,30,'m/s'],['h','Độ cao',20,2,60,'m'],['g','Gia tốc trọng trường',9.8,1,20,'m/s²']],formula:'x = v₀t ; y = h − gt²/2'},
 oblique:{name:'Ném xiên',params:[['v','Vận tốc ban đầu',16,1,35,'m/s'],['a','Góc ném',45,5,85,'°'],['g','Gia tốc trọng trường',9.8,1,20,'m/s²']],formula:'x = v₀ cos(α)t ; y = v₀ sin(α)t − gt²/2'},
 freefall:{name:'Rơi tự do',params:[['h','Độ cao ban đầu',30,2,100,'m'],['g','Gia tốc trọng trường',9.8,1,20,'m/s²']],formula:'y = h − gt²/2 ; v = gt'},
 uniform:{name:'Chuyển động thẳng đều',params:[['v','Vận tốc',6,1,20,'m/s'],['d','Quãng đường hiển thị',60,10,150,'m']],formula:'x = vt'},
 pendulum:{name:'Con lắc đơn (góc nhỏ)',params:[['l','Chiều dài dây',2,0.5,5,'m'],['a','Biên độ góc',15,1,20,'°'],['g','Gia tốc trọng trường',9.8,1,20,'m/s²']],formula:'θ(t) ≈ θ₀ cos(√(g/L)t) ; gần đúng góc nhỏ'},
 spring:{name:'Con lắc lò xo',params:[['m','Khối lượng',1,0.2,5,'kg'],['k','Độ cứng lò xo',20,5,80,'N/m'],['a','Biên độ',0.8,0.1,2,'m']],formula:'x(t) = A cos(√(k/m)t) ; bỏ qua ma sát'}
};
const mks = (m,p)=>{const v=p.v||0,h=p.h||0,g=p.g||9.8,a=(p.a||0)*Math.PI/180;
 switch(m){
 case'horizontal':return {duration:Math.sqrt(2*h/g),point:t=>[v*t,h-.5*g*t*t],velocity:t=>Math.hypot(v,g*t),range:v*Math.sqrt(2*h/g),maxY:h};
 case'oblique':{const vx=v*Math.cos(a),vy=v*Math.sin(a),d=2*vy/g;return {duration:d,point:t=>[vx*t,vy*t-.5*g*t*t],velocity:t=>Math.hypot(vx,vy-g*t),range:vx*d,maxY:vy*vy/(2*g)};}
 case'freefall':{const d=Math.sqrt(2*h/g);return {duration:d,point:t=>[0,h-.5*g*t*t],velocity:t=>g*t,range:0,maxY:h};}
 case'uniform':return {duration:p.d/p.v,point:t=>[v*t,0],velocity:()=>v,range:p.d,maxY:0};
 case'pendulum':return {duration:12,point:t=>[p.l*Math.sin(a*Math.cos(Math.sqrt(g/p.l)*t)),-p.l*Math.cos(a*Math.cos(Math.sqrt(g/p.l)*t))],velocity:t=>Math.abs(p.l*a*Math.sqrt(g/p.l)*Math.sin(Math.sqrt(g/p.l)*t)),range:0,maxY:p.l};
 default:return {duration:12,point:t=>[p.a*Math.cos(Math.sqrt(p.k/p.m)*t),0],velocity:t=>Math.abs(-p.a*Math.sqrt(p.k/p.m)*Math.sin(Math.sqrt(p.k/p.m)*t)),range:p.a,maxY:0};
 }};
let stopActive=null;
export function mountLab(root){
 stopActive?.();let mode='horizontal',t=0,running=false,last=0,frame=0;
 let params={};const cfg=MODELS;
 const controls=`<div class="work-grid"><aside class="stack"><section class="panel"><h3 class="panel-title">CHỌN THÍ NGHIỆM</h3><div class="field"><label>Mô hình hoạt động</label><select id="phys-model">${Object.entries(cfg).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select></div><div id="phys-params"></div><div class="toolbar"><button class="btn small" id="phys-start">▶ Bắt đầu</button><button class="btn small secondary" id="phys-pause">Ⅱ Tạm dừng</button><button class="btn small light" id="phys-reset">↺ Đặt lại</button></div></section><section class="panel"><h3 class="panel-title">KIẾN THỨC VẬT LÝ</h3><div class="math" id="phys-formula"></div><p class="hint">Kết quả lấy từ các công thức và giá trị đang chọn, sử dụng đơn vị SI.</p></section></aside>
 <div class="stack"><div class="viz" id="phys-viz"><canvas id="phys-canvas" width="900" height="500" aria-label="Mô phỏng vật lý động"></canvas><span class="three-caption">Mô phỏng động • tính toán theo thời gian</span></div><div class="panel"><h3 class="panel-title">KẾT QUẢ MÔ PHỎNG</h3><div class="grid2" id="phys-results"></div></div><div class="notice">Hiện có 6 mô phỏng vận hành thực tế. Các mô hình còn lại trong danh sách yêu cầu đang chờ xây dựng và kiểm chứng; không được thay bằng hình động giả.</div></div></div>`;
 root.innerHTML=controls;
 const canvas=$('#phys-canvas'),ctx=canvas.getContext('2d');
 const reset=()=>{t=0;running=false;last=0;$('#phys-start').textContent='▶ Bắt đầu';draw();};
 const renderParams=()=>{const model=cfg[mode];params=Object.fromEntries(model.params.map(([k,,v])=>[k,v]));$('#phys-formula').textContent=model.formula;
  $('#phys-params').innerHTML=model.params.map(([key,label,value,min,max,unit])=>`<div class="field"><label>${label}: <strong id="value-${key}">${value} ${unit}</strong></label><input type="range" id="slider-${key}" min="${min}" max="${max}" step="${min<1?'0.1':'0.5'}" value="${value}"/></div>`).join('');
  model.params.forEach(([key,label,v,mx,max,unit])=>{$('#slider-'+key).oninput=e=>{params[key]=Number(e.target.value);$('#value-'+key).textContent=params[key]+' '+unit;reset();};});reset();};
 const circle=(x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 function draw(){
  const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#f6f8ff';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#e3e8f5';ctx.lineWidth=1;
  for(let x=35;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=30;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const p=mks(mode,params),now=Math.min(t,p.duration),[px,py]=p.point(now);
  ctx.font='16px Inter, sans-serif';ctx.fillStyle='#61728e';ctx.fillText(`t = ${now.toFixed(2)} s`,30,35);
  if(mode==='pendulum'){
    const cx=w/2,cy=70,scale=90;
    ctx.strokeStyle='#5158bb';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+px*scale,cy-py*scale);ctx.stroke();circle(cx,cy,6,'#4f46e5');circle(cx+px*scale,cy-py*scale,19,'#26ad80');
    ctx.fillStyle='#667693';ctx.fillText('θ₀ ≤ 20°: gần đúng điều hòa',35,h-30);
  }else if(mode==='spring'){
    const cx=w/2-110,cy=h/2,x=px*105;ctx.fillStyle='#64748b';ctx.fillRect(cx-28,cy-55,13,110);
    ctx.strokeStyle='#6c64d7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);
    for(let i=0;i<=20;i++){let xi=cx+(120+x)*i/20,yi=cy+(i===0||i===20?0:(i%2===0?20:-20));ctx.lineTo(xi,yi);}ctx.stroke();
    ctx.fillStyle='#23b58d';ctx.fillRect(cx+120+x,cy-25,68,50);
    ctx.fillStyle='#6d7d97';ctx.fillText('Bỏ qua lực cản',35,h-30);
  }else{
    const baseY=h-55,padX=65,padTop=64;
    const xMax=Math.max(1,p.range*1.13),yMax=Math.max(1,p.maxY*1.2);
    const sx=x=>padX+x*(w-padX-55)/xMax;
    const sy=y=>baseY-y*(baseY-padTop)/yMax;
    ctx.strokeStyle='#465875';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(padX,baseY);ctx.lineTo(w-24,baseY);ctx.moveTo(padX,baseY);ctx.lineTo(padX,40);ctx.stroke();
    ctx.fillStyle='#7f8da4';ctx.fillText('x (m)',w-70,baseY+30);ctx.fillText('y (m)',14,52);
    ctx.setLineDash([6,5]);ctx.strokeStyle='#9ba5ce';ctx.lineWidth=2;ctx.beginPath();
    for(let j=0;j<=90;j++){const [x,y]=p.point(p.duration*j/90);if(j===0)ctx.moveTo(sx(x),sy(y));else ctx.lineTo(sx(x),sy(y));}
    ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#5d50eb';ctx.lineWidth=3;ctx.beginPath();
    for(let j=0;j<=Math.max(1,Math.ceil(90*now/(p.duration||1)));j++){
      const [x,y]=p.point(now*j/Math.max(1,Math.ceil(90*now/(p.duration||1))));if(j===0)ctx.moveTo(sx(x),sy(y));else ctx.lineTo(sx(x),sy(y));}
    ctx.stroke();circle(sx(px),sy(py),12,'#24bd8c');
  }
  $('#phys-results').innerHTML=[['Thời gian',now.toFixed(2)+' s'],['Vận tốc hiện tại',p.velocity(now).toFixed(2)+' m/s'],['Tầm xa / biên độ',p.range.toFixed(2)+' m'],['Thời gian kết thúc',p.duration.toFixed(2)+' s']].map(([k,v])=>`<div class="muted-box"><small>${k}</small><strong>${v}</strong></div>`).join('');
 }
 const step=stamp=>{if(!root.isConnected){cancelAnimationFrame(frame);return;}
  if(running){if(last)t+=Math.min((stamp-last)/1000,0.1);last=stamp;const p=mks(mode,params);if(t>=p.duration){t=p.duration;running=false;$('#phys-start').textContent='▶ Chạy lại';}draw();}else{last=0;}
  frame=requestAnimationFrame(step);
 };
 $('#phys-model').onchange=e=>{mode=e.target.value;renderParams();};
 $('#phys-start').onclick=()=>{const p=mks(mode,params);if(t>=p.duration)t=0;running=true;};
 $('#phys-pause').onclick=()=>{running=false;$('#phys-start').textContent='▶ Tiếp tục';};
 $('#phys-reset').onclick=reset;
 renderParams();frame=requestAnimationFrame(step);
 stopActive=()=>{cancelAnimationFrame(frame);running=false;};
}
