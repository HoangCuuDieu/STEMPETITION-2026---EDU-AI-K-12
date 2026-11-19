/* Curated molecular geometries for educational visualization, not arbitrary randomized spheres. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {api,$,esc,toast} from './app.js';
const atom=(el,x,y,z)=>({el,x,y,z});
const bond=(a,b,order=1)=>[a,b,order];
const MOL={
 H2:{name:'Hiđro',formula:'H₂',category:'Đơn chất',atoms:[atom('H',-.37,0,0),atom('H',.37,0,0)],bonds:[bond(0,1)],mass:'2,016 g/mol',structure:'Phân tử hai nguyên tử, liên kết cộng hóa trị đơn.',property:'Khí không màu, dễ cháy.',use:'Nghiên cứu năng lượng và tổng hợp hóa chất.',warning:'Dễ cháy; không tự thực hiện thí nghiệm.'},
 O2:{name:'Oxi',formula:'O₂',category:'Đơn chất',atoms:[atom('O',-.605,0,0),atom('O',.605,0,0)],bonds:[bond(0,1,2)],mass:'31,998 g/mol',structure:'Phân tử hai nguyên tử, liên kết đôi.',property:'Khí không màu, hỗ trợ sự cháy.',use:'Hô hấp và nhiều quá trình công nghiệp.',warning:'Làm tăng nguy cơ cháy khi tiếp xúc vật liệu dễ cháy.'},
 N2:{name:'Nitơ',formula:'N₂',category:'Đơn chất',atoms:[atom('N',-.55,0,0),atom('N',.55,0,0)],bonds:[bond(0,1,3)],mass:'28,014 g/mol',structure:'Phân tử hai nguyên tử, liên kết ba.',property:'Khí không màu, tương đối trơ trong điều kiện thường.',use:'Sản xuất amoniac và tạo môi trường khí trơ.',warning:'Không hít khí nitơ tinh khiết vì có nguy cơ thiếu oxy.'},
 H2O:{name:'Nước',formula:'H₂O',category:'Hợp chất vô cơ',atoms:[atom('O',0,0,0),atom('H',-.757,.586,0),atom('H',.757,.586,0)],bonds:[bond(0,1),bond(0,2)],mass:'18,015 g/mol',structure:'Cấu trúc gấp khúc, góc H–O–H khoảng 104,5°.',property:'Chất lỏng không màu trong điều kiện thường.',use:'Dung môi phổ biến, thiết yếu cho sự sống.',warning:'An toàn trong điều kiện sử dụng thông thường.'},
 CO2:{name:'Cacbon đioxit',formula:'CO₂',category:'Oxit',atoms:[atom('O',-1.16,0,0),atom('C',0,0,0),atom('O',1.16,0,0)],bonds:[bond(0,1,2),bond(1,2,2)],mass:'44,01 g/mol',structure:'Phân tử thẳng O=C=O, góc 180°.',property:'Khí không màu, nặng hơn không khí.',use:'Quang hợp và nhiều ứng dụng công nghiệp.',warning:'Nồng độ cao có thể gây ngạt.'},
 CH4:{name:'Metan',formula:'CH₄',category:'Hợp chất hữu cơ',atoms:[atom('C',0,0,0),atom('H',.629,.629,.629),atom('H',-.629,-.629,.629),atom('H',-.629,.629,-.629),atom('H',.629,-.629,-.629)],bonds:[bond(0,1),bond(0,2),bond(0,3),bond(0,4)],mass:'16,04 g/mol',structure:'Cấu trúc tứ diện, góc H–C–H khoảng 109,5°.',property:'Khí không màu, dễ cháy.',use:'Thành phần chính của khí thiên nhiên.',warning:'Dễ cháy; không tự tạo nguồn khí metan.'},
 NH3:{name:'Amoniac',formula:'NH₃',category:'Hợp chất vô cơ',atoms:[atom('N',0,.36,0),atom('H',.9,-.12,0),atom('H',-.45,-.12,.779),atom('H',-.45,-.12,-.779)],bonds:[bond(0,1),bond(0,2),bond(0,3)],mass:'17,031 g/mol',structure:'Dạng chóp tam giác, góc H–N–H gần 107°.',property:'Khí không màu, mùi khai.',use:'Sản xuất phân bón và công nghiệp hóa chất.',warning:'Độc ở nồng độ cao, gây kích ứng.'},
 C2H4:{name:'Etilen',formula:'C₂H₄',category:'Hợp chất hữu cơ',atoms:[atom('C',-.67,0,0),atom('C',.67,0,0),atom('H',-1.25, .94,0),atom('H',-1.25,-.94,0),atom('H',1.25,.94,0),atom('H',1.25,-.94,0)],bonds:[bond(0,1,2),bond(0,2),bond(0,3),bond(1,4),bond(1,5)],mass:'28,05 g/mol',structure:'Cấu trúc gần phẳng, có liên kết đôi C=C.',property:'Khí không màu, dễ cháy.',use:'Nguyên liệu sản xuất polietilen.',warning:'Khí dễ cháy.'},
 C2H2:{name:'Axetilen',formula:'C₂H₂',category:'Hợp chất hữu cơ',atoms:[atom('H',-1.7,0,0),atom('C',-.6,0,0),atom('C',.6,0,0),atom('H',1.7,0,0)],bonds:[bond(0,1),bond(1,2,3),bond(2,3)],mass:'26,04 g/mol',structure:'Cấu trúc tuyến tính, có liên kết ba C≡C.',property:'Khí dễ cháy.',use:'Ứng dụng trong công nghiệp và tổng hợp hữu cơ.',warning:'Không thực hành với khí dễ cháy ngoài phòng thí nghiệm được giám sát.'},
 C6H6:{name:'Benzen',formula:'C₆H₆',category:'Hợp chất hữu cơ',atoms:[...Array.from({length:6},(_,i)=>atom('C',1.39*Math.cos(i*Math.PI/3),1.39*Math.sin(i*Math.PI/3),0)),...Array.from({length:6},(_,i)=>atom('H',2.47*Math.cos(i*Math.PI/3),2.47*Math.sin(i*Math.PI/3),0))],bonds:[...Array.from({length:6},(_,i)=>bond(i,(i+1)%6,i%2===0?2:1)),...Array.from({length:6},(_,i)=>bond(i,i+6))],mass:'78,11 g/mol',structure:'Vòng sáu cạnh phẳng; liên kết π cộng hưởng được minh họa bằng liên kết xen kẽ.',property:'Chất lỏng không màu, dễ bay hơi.',use:'Nguyên liệu trong công nghiệp hóa chất.',warning:'Độc, có khả năng gây ung thư; tuyệt đối không tự thực hành.'}
};
const COLORS={H:'#f4f7ff',C:'#4e596e',N:'#3575de',O:'#e84c50',S:'#e6ca25',Cl:'#35b770'};
const RADII={H:.24,C:.38,N:.37,O:.35};
let cleanupPrevious=null;
export function mountLab(root){
 cleanupPrevious?.();let molecule='H2O',spacefill=false;
 root.innerHTML=`<div class="work-grid"><aside class="stack"><section class="panel"><h3 class="panel-title">THƯ VIỆN PHÂN TỬ</h3><div class="field"><label>Chất cần quan sát</label><select id="chem-select">${Object.entries(MOL).map(([id,item])=>`<option value="${id}" ${id===molecule?'selected':''}>${esc(item.formula)} · ${esc(item.name)}</option>`).join('')}</select></div><div class="field"><label>Kiểu mô hình</label><select id="chem-style"><option value="ball">Quả cầu – que</option><option value="spacefill">Không gian lấp đầy (minh họa)</option></select></div><div class="toolbar"><button id="chem-reset" class="btn small light">↺ Đặt lại góc nhìn</button><button id="chem-save" class="btn small secondary">Lưu lựa chọn</button></div><div class="divider"></div><p class="hint">Nguyên tử được gắn theo quan hệ liên kết hóa học; đây là hình học minh họa dựa trên cấu trúc phân tử, không phải dữ liệu tọa độ đo từ tinh thể.</p></section>
  <section class="panel"><h3 class="panel-title">CHÚ GIẢI NGUYÊN TỬ</h3><div class="spaced">${Object.entries({H:'Hiđro',C:'Cacbon',N:'Nitơ',O:'Oxi'}).map(([el,name])=>`<div class="row text-sm"><span><span style="background:${COLORS[el]};border:1px solid #b8c1d0;display:inline-block;width:15px;height:15px;border-radius:50%;vertical-align:-2px;margin-right:9px"></span>${el}</span>${name}</div>`).join('')}</div></section></aside>
  <div class="stack"><div class="viz" id="chem-viz" style="height:510px"><span class="three-caption">Kéo chuột: xoay • Cuộn: thu/phóng</span></div><section class="panel"><div class="row"><h3 id="chem-name" style="font-size:19px;margin:0"></h3><span class="smalltag" id="chem-category"></span></div><div class="grid2" style="margin-top:15px"><div class="muted-box"><small>Công thức</small><strong id="chem-formula"></strong></div><div class="muted-box"><small>Khối lượng mol</small><strong id="chem-mass"></strong></div></div><div id="chem-details" class="spaced" style="margin-top:16px"></div></section><div class="notice">Đã triển khai 10 mô hình phân tử tương tác. Chưa hoàn thiện yêu cầu 50 cấu trúc; riêng tinh thể kim loại và muối phải dùng mô hình mạng tinh thể, không thể thay bằng phân tử rời.</div></div></div>`;
 const host=$('#chem-viz');const scene=new THREE.Scene();scene.background=new THREE.Color('#f4f7ff');scene.add(new THREE.AmbientLight(0xffffff,1.3));
 const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(4,6,6);scene.add(light);
 const camera=new THREE.PerspectiveCamera(46,1,.1,100);camera.position.set(3.7,3.2,5.4);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.prepend(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
 const group=new THREE.Group();scene.add(group);
 function clear(){for(const obj of [...group.children]){group.remove(obj);obj.traverse(x=>{x.geometry?.dispose?.();if(x.material){const mat=Array.isArray(x.material)?x.material:[x.material];mat.forEach(m=>m.dispose?.());}});}}
 function makeBond(a,b,order){
  const begin=new THREE.Vector3(a.x,a.y,a.z),end=new THREE.Vector3(b.x,b.y,b.z),dir=new THREE.Vector3().subVectors(end,begin),len=dir.length(),axis=new THREE.Vector3(0,0,1);
  if(Math.abs(dir.clone().normalize().dot(axis))>.9)axis.set(0,1,0);
  const normal=new THREE.Vector3().crossVectors(dir,axis).normalize();
  const offsets=order===1?[0]:order===2?[-.10,.10]:[-.16,0,.16];
  offsets.forEach(off=>{const mid=begin.clone().add(end).multiplyScalar(.5).addScaledVector(normal,off);
   const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,len,10),new THREE.MeshPhongMaterial({color:'#aeb8d0'}));
   cylinder.position.copy(mid);cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());group.add(cylinder);
  });
 }
 function renderMolecule(){
  clear();const doc=MOL[molecule];const at=doc.atoms;
  if(!spacefill)doc.bonds.forEach(([a,b,order])=>makeBond(at[a],at[b],order));
  at.forEach(a=>{const r=(RADII[a.el]||.3)*(spacefill?1.55:1);const ball=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),new THREE.MeshPhongMaterial({color:COLORS[a.el]||'#dddddd',shininess:95}));ball.position.set(a.x,a.y,a.z);group.add(ball);});
  $('#chem-name').textContent=doc.name;$('#chem-category').textContent=doc.category;$('#chem-formula').textContent=doc.formula;$('#chem-mass').textContent=doc.mass;
  $('#chem-details').innerHTML=[['Cấu trúc & liên kết',doc.structure],['Tính chất',doc.property],['Ứng dụng',doc.use],['An toàn',doc.warning]].map(([a,b])=>`<div class="muted-box"><strong>${esc(a)}</strong>${esc(b)}</div>`).join('');
  const radius=Math.max(2,Math.max(...at.map(a=>Math.hypot(a.x,a.y,a.z)))+1.5);camera.position.set(radius*1.5,radius*.7,radius*1.55);controls.target.set(0,0,0);controls.update();
 }
 $('#chem-select').onchange=e=>{molecule=e.target.value;renderMolecule();};
 $('#chem-style').onchange=e=>{spacefill=e.target.value==='spacefill';renderMolecule();};
 $('#chem-reset').onclick=renderMolecule;
 $('#chem-save').onclick=async()=>{try{await api('/models',{method:'POST',body:{title:MOL[molecule].name,kind:'chemistry',data:{molecule,style:spacefill?'spacefill':'ball'}}});toast('Đã lưu lựa chọn vào tài khoản.');}catch(err){toast(err.message,true);}};
 const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};resize();const obs=new ResizeObserver(resize);obs.observe(host);
 let frame;const animate=()=>{if(!root.isConnected){cleanup();return;}controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate);};
 const cleanup=()=>{cancelAnimationFrame(frame);obs.disconnect();clear();controls.dispose();renderer.dispose();};
 cleanupPrevious=cleanup;renderMolecule();frame=requestAnimationFrame(animate);
}
