/* Real editable mesh geometry rendered by Three.js, not a pre-rendered image. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {api,$,esc,toast} from './app.js';
const SHAPES={
 triangle:'Hình chóp tam giác',quad:'Hình chóp tứ giác bất kỳ',parallelogram:'Hình chóp đáy hình bình hành',trapezoid:'Hình chóp đáy hình thang',square:'Hình chóp đáy hình vuông',cube:'Hình lập phương',box:'Hình hộp chữ nhật'
};
const V=(name,x,y,z)=>({name,x,y,z});
function shape(type){
  if(['cube','box'].includes(type)){
    const dx=type==='cube'?1.3:1.8,dy=type==='cube'?2.6:1.7,dz=1.3;
    const vertices=[V('A',-dx,0,-dz),V('B',dx,0,-dz),V('C',dx,0,dz),V('D',-dx,0,dz),V('E',-dx,dy,-dz),V('F',dx,dy,-dz),V('G',dx,dy,dz),V('H',-dx,dy,dz)];
    return {type,vertices,faces:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]],segments:[]};
  }
  const bases={
    triangle:[[-1.5,-1],[1.6,-1],[0,1.6]],
    quad:[[-1.6,-1.2],[1.7,-1.2],[1.25,1.3],[-1.2,1.1]],
    parallelogram:[[-1.6,-1],[1.2,-1],[1.9,1],[-.9,1]],
    trapezoid:[[-1.9,-1.1],[1.9,-1.1],[1.0,1.1],[-1.0,1.1]],
    square:[[-1.3,-1.3],[1.3,-1.3],[1.3,1.3],[-1.3,1.3]],
  }[type];
  const vertices=[V('S',0,2.65,0),...bases.map(([x,z],i)=>V('ABCD'[i],x,0,z))];
  const faces=[];
  for(let i=1;i<=bases.length;i++)faces.push([0,i,i===bases.length?1:i+1]);
  faces.push([...bases.keys()].map(i=>i+1).reverse());
  return {type,vertices,faces,segments:[]};
}
function allEdges(faces){const edgeMap=new Map();faces.forEach(face=>face.forEach((a,i)=>{const b=face[(i+1)%face.length],key=[a,b].sort((x,y)=>x-y).join(':');edgeMap.set(key,[a,b]);}));return [...edgeMap.values()];}
function makeLabel(text){const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#ffffffdf';c.beginPath();c.roundRect(9,22,140,50,18);c.fill();c.fillStyle='#373d79';c.textAlign='center';c.font='bold 36px Arial';c.fillText(String(text).slice(0,8),80,59);const texture=new THREE.CanvasTexture(canvas);const m=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const sp=new THREE.Sprite(m);sp.scale.set(.73,.42,1);return sp;}
const copy=d=>JSON.parse(JSON.stringify(d));
let previousCleanup=null;
export function mountLab(root){
 previousCleanup?.();let data=shape('square'),selected=0,history=[],future=[];
 root.innerHTML=`<div class="work-grid"><aside class="stack"><section class="panel"><h3 class="panel-title">THIẾT KẾ HÌNH KHỐI</h3><div class="field"><label>Loại hình</label><select id="geo-shape">${Object.entries(SHAPES).map(([k,v])=>`<option value="${k}" ${k==='square'?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Điều chỉnh kích thước toàn mô hình</label><input id="geo-scale" type="range" min="0.5" max="1.7" step="0.1" value="1"/></div><div class="field"><label>Điểm đang chọn</label><select id="geo-vertex"></select></div><div class="field"><label>Đổi tên điểm</label><input id="geo-name" maxlength="8" /></div><div class="grid2">${['x','y','z'].map(axis=>`<div class="field"><label>Tọa độ ${axis.toUpperCase()}</label><input id="geo-${axis}" type="number" step="0.1" min="-10" max="10"/></div>`).join('')}</div><button id="geo-edit" class="btn secondary full">Cập nhật điểm</button><div class="divider"></div><h3 class="panel-title">DỰNG HÌNH</h3><div class="grid2"><div class="field"><label>Điểm đầu</label><select id="geo-a"></select></div><div class="field"><label>Điểm cuối</label><select id="geo-b"></select></div></div><button id="geo-line" class="btn small secondary full">+ Nối hai điểm</button><button id="geo-point" class="btn small light full" style="margin-top:9px">+ Thêm điểm tại gốc (0; 0; 0)</button><div class="divider"></div><div class="toolbar"><button id="geo-undo" class="btn small light">↶ Hoàn tác</button><button id="geo-redo" class="btn small light">↷ Làm lại</button><button id="geo-reset" class="btn small danger">↺ Khôi phục</button></div></section>
  <section class="panel"><h3 class="panel-title">LƯU MÔ HÌNH</h3><div class="toolbar"><button class="btn small secondary" id="geo-save">Lưu vào tài khoản</button><button class="btn small light" id="geo-export">Tải JSON</button><button class="btn small light" id="geo-screenshot">Chụp hình</button></div><div class="divider"></div><button class="btn small light full" id="geo-list">Mở mô hình đã lưu</button><div id="geo-saves" class="text-sm"></div></section></aside>
  <div class="stack"><div class="viz" id="geo-viz" style="height:560px"><span class="three-caption">Kéo chuột: xoay • Cuộn: thu/phóng • Click đỉnh: chọn điểm</span></div><section class="panel"><h3 class="panel-title">PHÂN TÍCH MÔ HÌNH</h3><div class="grid2" id="geo-analysis"></div><p class="hint">Mô hình có tọa độ thực; sửa vị trí đỉnh có thể làm mất tính chất đặc biệt (ví dụ hình vuông không còn vuông).</p></section></div></div>`;
 const host=$('#geo-viz');const scene=new THREE.Scene();scene.background=new THREE.Color('#f4f7ff');
 scene.add(new THREE.HemisphereLight(0xffffff,0xa6a6d5,2));const lamp=new THREE.DirectionalLight(0xffffff,1);lamp.position.set(5,8,4);scene.add(lamp);
 const camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.set(5.2,4.2,6.2);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.prepend(renderer.domElement);
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,1.1,0);
 const grid=new THREE.GridHelper(11,22,0xbdc7e7,0xe1e7f5);scene.add(grid);
 const axes=new THREE.AxesHelper(2.5);axes.position.set(-3,0,-3);scene.add(axes);
 const group=new THREE.Group();scene.add(group);const objects=[];let scale=1;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const snapshot=()=>{history.push(copy(data));if(history.length>50)history.shift();future=[];};
 function clearGroup(){for(const child of [...group.children]){group.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.map?.dispose?.();m.dispose?.();});}});}objects.length=0;}
 function addSegment(a,b,mat){const start=new THREE.Vector3(a.x,a.y,a.z),end=new THREE.Vector3(b.x,b.y,b.z);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),mat);group.add(line);}
 function redraw(){
  clearGroup();group.scale.setScalar(scale);
  const vertices=data.vertices;
  data.faces.forEach((face,i)=>{const coords=[];for(let j=1;j<face.length-1;j++)for(const vi of [face[0],face[j],face[j+1]]){
    const v=vertices[vi];coords.push(v.x,v.y,v.z);
  }const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geom.computeVertexNormals();const color=i%2?'#9c7cf4':'#668df5';const mesh=new THREE.Mesh(geom,new THREE.MeshPhongMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.29,depthWrite:false,shininess:80}));group.add(mesh);});
  for(const [i,j] of allEdges(data.faces))addSegment(vertices[i],vertices[j],new THREE.LineBasicMaterial({color:'#4d53a2',linewidth:2}));
  data.segments.forEach(([i,j])=>{if(vertices[i]&&vertices[j])addSegment(vertices[i],vertices[j],new THREE.LineBasicMaterial({color:'#e44c9b'}));});
  vertices.forEach((v,i)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(i===selected?.105:.075,18,18),new THREE.MeshPhongMaterial({color:i===selected?'#ff9b42':'#18af87'}));mesh.position.set(v.x,v.y,v.z);mesh.userData.vertexIndex=i;group.add(mesh);objects.push(mesh);const label=makeLabel(v.name);label.position.set(v.x+.21,v.y+.23,v.z);group.add(label);});
  let lengths=allEdges(data.faces).map(([i,j])=>new THREE.Vector3(vertices[i].x,vertices[i].y,vertices[i].z).distanceTo(new THREE.Vector3(vertices[j].x,vertices[j].y,vertices[j].z)));
  $('#geo-analysis').innerHTML=[['Số đỉnh',vertices.length],['Số cạnh khối',allEdges(data.faces).length],['Số mặt',data.faces.length],['Đoạn nối thêm',data.segments.length],['Cạnh ngắn nhất',Math.min(...lengths).toFixed(2)+' đv'],['Cạnh dài nhất',Math.max(...lengths).toFixed(2)+' đv']].map(([k,v])=>`<div class="muted-box"><small>${k}</small><strong>${v}</strong></div>`).join('');
  ['vertex','a','b'].forEach(target=>{$('#geo-'+target).innerHTML=vertices.map((v,i)=>`<option value="${i}">${esc(v.name)}</option>`).join('');});
  selected=Math.min(selected,vertices.length-1);$('#geo-vertex').value=selected;
  $('#geo-a').value=0;$('#geo-b').value=Math.min(1,vertices.length-1);updateSelected();
 }
 function updateSelected(){const v=data.vertices[selected];if(!v)return;$('#geo-name').value=v.name;for(const axis of ['x','y','z'])$('#geo-'+axis).value=v[axis];}
 function setData(next){data=copy(next);selected=0;redraw();}
 $('#geo-shape').onchange=e=>{snapshot();setData(shape(e.target.value));};
 $('#geo-scale').oninput=e=>{scale=Number(e.target.value);group.scale.setScalar(scale);};
 $('#geo-vertex').onchange=e=>{selected=Number(e.target.value);updateSelected();redraw();};
 $('#geo-edit').onclick=()=>{const name=$('#geo-name').value.trim();if(!name)return toast('Tên điểm không thể rỗng.',true);
  const coords=Object.fromEntries(['x','y','z'].map(axis=>[axis,Number($('#geo-'+axis).value)]));
  if(Object.values(coords).some(v=>!Number.isFinite(v)||Math.abs(v)>10))return toast('Tọa độ phải là số trong [-10, 10].',true);
  snapshot();Object.assign(data.vertices[selected],{name:name.slice(0,8),...coords});redraw();};
 $('#geo-point').onclick=()=>{if(data.vertices.length>=40)return toast('Giới hạn 40 điểm.',true);snapshot();const index=data.vertices.length;data.vertices.push(V('P'+index,0,0,0));selected=index;redraw();};
 $('#geo-line').onclick=()=>{const a=Number($('#geo-a').value),b=Number($('#geo-b').value);if(a===b)return toast('Hãy chọn hai điểm khác nhau.',true);snapshot();data.segments.push([a,b]);redraw();};
 $('#geo-undo').onclick=()=>{if(!history.length)return;future.push(copy(data));setData(history.pop());};
 $('#geo-redo').onclick=()=>{if(!future.length)return;history.push(copy(data));setData(future.pop());};
 $('#geo-reset').onclick=()=>{snapshot();setData(shape($('#geo-shape').value));};
 $('#geo-save').onclick=async()=>{const title=prompt('Tên mô hình muốn lưu:',SHAPES[data.type]);if(!title)return;try{await api('/models',{method:'POST',body:{title,kind:'geometry',data}});toast('Đã lưu mô hình trên máy chủ.');}catch(err){toast(err.message,true);}};
 $('#geo-list').onclick=async()=>{try{const items=(await api('/models')).filter(i=>i.kind==='geometry');$('#geo-saves').innerHTML=items.length?items.map(it=>`<button class="prompt" data-geoload="${it.id}">${esc(it.title)}</button>`).join(''):'Chưa có mô hình đã lưu.';document.querySelectorAll('[data-geoload]').forEach(btn=>btn.onclick=async()=>{try{const result=await api('/models/'+btn.dataset.geoload);snapshot();setData(result.data);toast('Đã mở mô hình.');}catch(err){toast(err.message,true);}});}catch(err){toast(err.message,true);}};
 $('#geo-export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hinh-hoc-3d.json';a.click();URL.revokeObjectURL(url);};
 $('#geo-screenshot').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return toast('Không tạo được ảnh mô hình.',true);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mo-hinh-hinh-hoc.png';a.click();URL.revokeObjectURL(url);});};
 const click=e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(objects);if(hits.length){selected=hits[0].object.userData.vertexIndex;redraw();}};
 renderer.domElement.addEventListener('click',click);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();const observer=new ResizeObserver(resize);observer.observe(host);
 let frame;const animate=()=>{if(!root.isConnected){cleanup();return;}orbit.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate);};
 const cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('click',click);clearGroup();orbit.dispose();renderer.dispose();};
 previousCleanup=cleanup;redraw();frame=requestAnimationFrame(animate);
}
