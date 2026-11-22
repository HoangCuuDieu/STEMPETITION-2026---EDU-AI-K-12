const root = document.querySelector('#app');
const state = { user:null, view:'chat', grade:11, subject:'Toán học', selectedFile:null, messages:[], health:null, attempt:null };
const SUBJECTS = ['Tự động','Toán học','Ngữ văn','Tiếng Việt','Tiếng Anh','Vật lý','Hóa học','Sinh học','Lịch sử','Địa lý','Tin học','Công nghệ','Giáo dục kinh tế và pháp luật'];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $ = (sel,context=document)=>context.querySelector(sel);
export const $$ = (sel,context=document)=>[...context.querySelectorAll(sel)];
const fmt = n=>Number(n??0).toLocaleString('vi-VN');
function toast(message,error=false){const box=$('#toast');const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;box.append(el);setTimeout(()=>el.remove(),4200);}
export { toast };
export async function api(path, options={}){
  const {method='GET',body,headers={},...rest}=options;
  let payload=body;
  const heads={...headers};
  if(body && !(body instanceof FormData) && typeof body!=='string') {payload=JSON.stringify(body);heads['Content-Type']='application/json';}
  if(method!=='GET') heads['X-Requested-With']='XMLHttpRequest';
  let response;
  try{response=await fetch('/api'+path,{method,body:payload,headers:heads,credentials:'same-origin',...rest});}
  catch{throw new Error('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');}
  let data;try{data=await response.json();}catch{data={};}
  if(!response.ok){
    if(response.status===401 && state.user){state.user=null;setTimeout(()=>render(),100);}
    throw new Error(typeof data.detail==='string'?data.detail:`Máy chủ trả mã ${response.status}.`);
  }
  return data;
}
const button=(label,cl='',extra='')=>`<button class="btn ${cl}" ${extra}>${label}</button>`;
function opt(values,current){return values.map(v=>`<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(v)}</option>`).join('');}
function mount(html){root.innerHTML=html;window.scrollTo({top:0,behavior:'instant'});}
function title(text,subtitle,action=''){return `<div class="section-head"><div><h2>${text}</h2><p>${subtitle}</p></div>${action}</div>`;}
function shell(inner){
  const u=state.user;const nav=[['chat','✦ Gia sư AI'],['geometry','⬡ Hình học 3D'],['physics','◉ Vật lý 2D'],['chemistry','⚗ Hóa học 3D'],['grading','✓ Chấm bài AI'],['exam','▣ Phòng thi']];
  if(u?.role==='teacher')nav.push(['teacher','▤ Quản lý giáo viên']);
  if(u?.role==='teacher'){const idx=nav.findIndex(([id])=>id==='exam');if(idx>=0)nav.splice(idx,1);}
  return `<header class="topbar"><div class="topbar-inner"><button class="brand" id="home"><span class="brand-icon">🎓</span><span><strong>EDU <span>AI K-12</span></strong><span class="pill">GIÁO DỤC THÔNG MINH</span><small>Học chủ động &amp; khám phá khoa học</small></span></button>
  <nav class="tabs" aria-label="Điều hướng">${nav.map(([id,label])=>`<button class="nav-tab ${state.view===id?'active':''}" data-nav="${id}">${label}</button>`).join('')}</nav>
  <div class="user-menu">${u?`<span class="user-chip"><span class="dot"></span>${esc(u.name)} · ${u.role==='teacher'?'Giáo viên':'Học sinh'}</span><button id="logout" class="linkbtn">Thoát</button>`:`<span class="user-chip"><span class="dot"></span>Máy chủ sẵn sàng</span>`}</div></div></header>${inner}`;
}
function bindNav(){
  $('#home')?.addEventListener('click',()=>navigate('chat'));
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $('#logout')?.addEventListener('click',async()=>{await api('/auth/logout',{method:'POST'});state.user=null;state.messages=[];render();});
}
function navigate(view){
  if(state.attempt && view!=='exam' && state.view==='exam'){ toast('Bài thi vẫn tiếp tục tính giờ; hãy quay lại trước khi hết hạn.',true); }
  state.view=view;render();
}
async function render(){
  if(!state.user){renderAuth();return;}
  if(state.view==='chat')return renderChat();
  if(state.view==='geometry'||state.view==='physics'||state.view==='chemistry')return renderLab(state.view);
  if(state.view==='grading')return renderGrading();
  if(state.view==='exam')return renderExam();
  if(state.view==='teacher')return renderTeacher();
  state.view='chat';return renderChat();
}
function renderAuth(mode='login'){
  const isRegister=mode==='register';
  mount(shell(`<div class="auth-cover"><div class="auth-card"><div style="font-size:35px;margin-bottom:8px">🎓</div><h2>${isRegister?'Tạo tài khoản':'Chào mừng trở lại'}</h2><p>${isRegister?'Bắt đầu hành trình học tập với EDU AI K-12':'Đăng nhập để lưu lịch sử học và truy cập lớp học của bạn.'}</p>
    <form id="authform"><div class="field" ${!isRegister?'hidden':''}><label>Họ và tên</label><input name="name" autocomplete="name" placeholder="Nguyễn Văn A" ${isRegister?'required':''}/></div>
    <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required placeholder="email@example.com"/></div>
    <div class="field"><label>Mật khẩu</label><input name="password" type="password" autocomplete="${isRegister?'new-password':'current-password'}" minlength="${isRegister?10:1}" required placeholder="${isRegister?'Tối thiểu 10 ký tự':'Mật khẩu của bạn'}"/></div>
    ${isRegister?`<div class="grid2"><div class="field"><label>Vai trò</label><select name="role" id="regrole"><option value="student">Học sinh</option><option value="teacher">Giáo viên</option></select></div><div class="field" id="gradefield"><label>Khối lớp</label><select name="grade">${opt(Array.from({length:12},(_,i)=>i+1),11)}</select></div></div><div class="field" id="teacherfield" hidden><label>Mã mời giáo viên</label><input name="teacher_code" placeholder="Nhập mã được quản trị viên cấp"/></div>`:''}
    <button class="btn full" type="submit">${isRegister?'Tạo tài khoản':'Đăng nhập'} →</button></form>
    <div class="auth-switch">${isRegister?'Đã có tài khoản?':'Chưa có tài khoản?'} <button id="switchauth" class="linkbtn">${isRegister?'Đăng nhập':'Đăng ký ngay'}</button></div>
    <div class="notice">Đăng ký vai trò giáo viên cần mã mời riêng. Không chia sẻ mật khẩu hoặc API key với người khác.</div>
  </div></div>`));bindNav();
  $('#switchauth').onclick=()=>renderAuth(isRegister?'login':'register');
  if(isRegister)$('#regrole').onchange=e=>{$('#teacherfield').hidden=e.target.value!=='teacher';$('#gradefield').hidden=e.target.value==='teacher';};
  $('#authform').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target);
    try{
      const body={email:f.get('email'),password:f.get('password')};
      if(isRegister)Object.assign(body,{name:f.get('name'),role:f.get('role'),grade:f.get('role')==='student'?Number(f.get('grade')):null,teacher_code:f.get('teacher_code')||''});
      state.user=await api('/auth/'+(isRegister?'register':'login'),{method:'POST',body});
      state.grade=state.user.grade||11;state.view='chat';state.messages=await api('/chat');render();
    }catch(err){toast(err.message,true);}
  };
}
function hero(){return `<div class="hero"><div><small>💡 Học chủ động cùng công nghệ AI</small><h1>Thầy AI hướng dẫn phương pháp tư duy — Đồng hành cùng học sinh K-12</h1><p>Tải lên tài liệu hoặc hình ảnh rõ nét để phân tích. Học qua gợi mở, hoặc yêu cầu lời giải chi tiết khi cần đối chiếu.</p></div><div class="hero-tags"><span>◉ Gemini Vision</span><span>✓ Tiếng Việt</span><span>✦ Khối 1–12</span></div></div>`;}
function makeMsg(msg){
  const div=document.createElement('div');div.className='message '+(msg.role==='user'?'self':'');
  div.innerHTML=`<span class="avatar">${msg.role==='user'?'👤':'🤖'}</span><div class="bubble"><div class="message-meta">${msg.role==='user'?'Bạn':'Trợ giảng AI Socratic K-12'}</div><div class="message-text"></div></div>`;
  $('.message-text',div).textContent=msg.content;return div;
}
function fillMessages(){const holder=$('#chatmessages');if(!holder)return;holder.replaceChildren();if(!state.messages.length){const el=document.createElement('div');el.className='message';el.innerHTML='<span class="avatar">🤖</span><div class="bubble"><div class="message-meta">Trợ giảng AI K-12</div>Chào em! Thầy có thể cùng em tìm hiểu bài học, phân tích tài liệu hoặc trò chuyện tự nhiên. Em muốn bắt đầu từ đâu?</div>';holder.append(el);}else state.messages.forEach(m=>holder.append(makeMsg(m)));holder.scrollTop=holder.scrollHeight;}
function renderChat(){
  mount(shell(`<main class="page">${hero()}<div class="layout-chat"><aside class="stack"><section class="panel"><h3 class="panel-title"><span class="purple">☷</span> 1. CẤU HÌNH MÔN HỌC</h3><div class="field"><label>Khối lớp</label><select id="grade">${opt(Array.from({length:12},(_,i)=>'Lớp '+(i+1)),'Lớp '+state.grade)}</select></div><div class="field"><label>Môn học (tự động định hướng)</label><select id="subject">${opt(SUBJECTS,state.subject)}</select></div></section>
  <section class="panel"><h3 class="panel-title"><span class="purple">♧</span> 2. TẢI TÀI LIỆU / ẢNH</h3><label class="dropzone" for="fileinput"><span class="upload-icon">☁</span><strong>Chọn tài liệu để phân tích</strong><small>PDF, DOCX, PPTX, XLSX, TXT, CSV, JPG, PNG, WEBP • Tối đa 8 MB</small><input type="file" id="fileinput" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp"/></label><div id="fileinfo" style="margin-top:10px">${state.selectedFile?`<div class="file-chip">✓ ${esc(state.selectedFile.filename)} <button class="linkbtn" id="removefile">×</button></div>`:''}</div></section>
  <section class="panel"><h3 class="panel-title">MẪU CÂU HỎI GỢI Ý</h3><button class="prompt" data-prompt="Hãy hướng dẫn phương pháp giải câu hỏi khó này theo từng bước.">👉 Hướng dẫn phương pháp câu khó</button><button class="prompt" data-prompt="Hãy giải thích khái niệm bằng một ví dụ trực quan dễ hiểu.">📚 Giải thích bằng ví dụ</button><button class="prompt" data-prompt="Hãy kiểm tra mức độ hiểu bài của mình bằng các câu hỏi gợi mở.">🧠 Kiểm tra hiểu bài</button></section></aside>
  <section class="chat-panel"><div class="chat-head"><div><strong><span class="dot"></span> Trợ giảng AI Socratic K-12</strong><small>${state.health?.ai_configured?'Gemini đã cấu hình':'Gemini chưa cấu hình'}</small></div><button class="linkbtn" id="clearchat">↻ Làm mới hội thoại</button></div>
  <div class="chat-body" id="chatmessages" aria-live="polite"></div><form class="chat-composer" id="chatform"><textarea id="chatinput" aria-label="Tin nhắn" placeholder="Em muốn hỏi điều gì? (Enter để gửi, Shift+Enter xuống dòng)"></textarea><button class="btn" id="sendchat" type="submit">Gửi ↑</button></form></section></div><p class="footer-note">AI có thể mắc lỗi. Kiểm tra lại kiến thức quan trọng với giáo viên và tài liệu chính thống.</p></main>`));bindNav();fillMessages();
  $('#grade').onchange=e=>state.grade=Number(e.target.value.replace('Lớp ',''));
  $('#subject').onchange=e=>state.subject=e.target.value;
  $('#fileinput').onchange=async e=>{
    if(!e.target.files?.[0])return;const fd=new FormData();fd.append('file',e.target.files[0]);$('#fileinfo').textContent='Đang xử lý tài liệu…';
    try{state.selectedFile=await api('/files',{method:'POST',body:fd});$('#fileinfo').innerHTML=`<div class="file-chip">✓ ${esc(state.selectedFile.filename)} <button class="linkbtn" id="removefile">×</button></div>`;$('#removefile').onclick=()=>{state.selectedFile=null;$('#fileinfo').replaceChildren();};}
    catch(err){toast(err.message,true);$('#fileinfo').replaceChildren();}
  };
  $('#removefile')?.addEventListener('click',()=>{state.selectedFile=null;$('#fileinfo').replaceChildren();});
  $$('[data-prompt]').forEach(b=>b.onclick=()=>{$('#chatinput').value=b.dataset.prompt;$('#chatinput').focus();});
  $('#chatinput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatform').requestSubmit();}};
  $('#clearchat').onclick=async()=>{if(!confirm('Xóa lịch sử trò chuyện của tài khoản này?'))return;try{await api('/chat',{method:'DELETE'});state.messages=[];fillMessages();toast('Đã xóa lịch sử trò chuyện.');}catch(err){toast(err.message,true);}};
  $('#chatform').onsubmit=async e=>{
    e.preventDefault();const input=$('#chatinput');const message=input.value.trim();if(!message&&!state.selectedFile)return;
    $('#sendchat').disabled=true;$('#sendchat').textContent='Đang suy nghĩ…';
    const msg={role:'user',content:message||`[Đã gửi tệp ${state.selectedFile?.filename}]`};state.messages.push(msg);fillMessages();input.value='';
    try{const result=await api('/chat',{method:'POST',body:{message,grade:state.grade,subject:state.subject,file_id:state.selectedFile?.id||null}});state.messages.push({role:'assistant',content:result.reply});state.selectedFile=null;$('#fileinfo').replaceChildren();}
    catch(err){state.messages.pop();input.value=message;toast(err.message,true);}
    $('#sendchat').disabled=false;$('#sendchat').textContent='Gửi ↑';fillMessages();
  };
}
async function renderLab(view){
  const meta={geometry:['Phòng hình học không gian 3D','Mô hình hình học có tọa độ, đỉnh, cạnh, mặt và góc nhìn 3D thực.'],physics:['Phòng thí nghiệm Vật lý 2D','Thay đổi tham số và quan sát chuyển động được tính bằng công thức vật lý.'],chemistry:['Phòng thí nghiệm Hóa học 3D','Xem cấu trúc phân tử, liên kết và các đặc trưng cơ bản.']}[view];
  mount(shell(`<main class="page">${title(meta[0],meta[1])}<div id="lab-root"><div class="panel">Đang mở phòng thực hành…</div></div></main>`));bindNav();
  try{const mod=await import(`/assets/${view}.js`);if(state.view===view)mod.mountLab($('#lab-root'));}
  catch(err){console.error(err);$('#lab-root').innerHTML='<div class="panel"><h3>Không thể mở phòng mô phỏng</h3><p>Hãy kiểm tra kết nối Internet để tải thư viện đồ họa Three.js, sau đó thử lại. Nếu không thể tải thư viện, các mục học tập khác vẫn sử dụng bình thường.</p></div>';}
}
async function renderGrading(){
  mount(shell(`<main class="page">${title('Chấm bài và phản hồi bằng AI','Phân tích bài làm theo barem giáo viên hoặc thang điểm dự kiến của AI.')}
  <div class="work-grid"><section class="panel spaced"><h3 class="panel-title">1. TÀI LIỆU CHẤM BÀI</h3><div><label>Bài làm học sinh (bắt buộc)</label><input type="file" id="work" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp"/></div><div><label>Barem / đáp án giáo viên (không bắt buộc)</label><input type="file" id="rubric" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp"/><button type="button" class="btn small secondary" id="clear-rubric" style="display:none">Bỏ barem</button></div><div class="field"><label>Môn học dự kiến</label><select id="grade-subject">${opt(SUBJECTS,'Toán học')}</select></div><div class="field"><label>Khối lớp</label><select id="grade-class">${opt(Array.from({length:12},(_,i)=>i+1),state.grade)}</select></div><button class="btn full" id="run-grading">✓ Phân tích và chấm bài</button><p class="notice">Đối với chữ viết khó đọc hoặc câu hỏi mở, AI có thể không đủ căn cứ. Giáo viên cần duyệt kết quả trước khi dùng chính thức.</p></section>
  <section class="panel"><h3 class="panel-title">2. BÁO CÁO CHẤM BÀI</h3><div id="grading-result" class="lead">Chọn bài làm, tải barem nếu có và nhấn “Phân tích và chấm bài”. Báo cáo sẽ xuất hiện tại đây.</div></section></div></main>`));bindNav();
  const rubricInput = $('#rubric');
  const clearRubric = $('#clear-rubric');
  const updateClearRubric = () => {
    clearRubric.style.display = rubricInput.files.length ? '' : 'none';
  };
  rubricInput.addEventListener('change', updateClearRubric);
  clearRubric.addEventListener('click', () => {
    rubricInput.value = '';
    updateClearRubric();
    rubricInput.focus();
  });
  $('#run-grading').onclick=async()=>{
    const work=$('#work').files[0],rubric=$('#rubric').files[0];if(!work)return toast('Hãy chọn bài làm trước.',true);
    const btn=$('#run-grading');btn.disabled=true;btn.textContent='Đang đọc và phân tích…';
    try{
      const upload=async file=>{const form=new FormData();form.append('file',file);return await api('/files',{method:'POST',body:form});};
      const a=await upload(work),b=rubric?await upload(rubric):null;
      const fd=new FormData();fd.append('work_id',a.id);fd.append('rubric_id',b?.id||'');fd.append('subject',$('#grade-subject').value);fd.append('grade',$('#grade-class').value);
      const result=await api('/grade',{method:'POST',body:fd});
      $('#grading-result').innerHTML=`<div class="notice">${esc(result.warning)} ${b?'Đã cung cấp barem.':'Không có barem giáo viên: kết quả chỉ là thang điểm dự kiến.'}</div><div class="preline" id="report-text"></div>`;
      $('#report-text').textContent=result.report;
    }catch(err){toast(err.message,true);}
    btn.disabled=false;btn.textContent='✓ Phân tích và chấm bài';
  };
}
async function renderExam(){
  if(state.user.role==='teacher')return navigate('teacher');
  mount(shell(`<main class="page">${title('Phòng thi trực tuyến','Tham gia bằng mã truy cập do giáo viên cấp. Tiến độ bài làm được lưu lên máy chủ.')}
  <div id="exam-root" class="work-grid"><section class="panel"><h3 class="panel-title">THAM GIA BÀI KIỂM TRA</h3><div class="field"><label>Mã truy cập</label><input id="examcode" placeholder="VD: A8G3TK2Q" autocomplete="off"/></div><button class="btn full" id="joinexam">Vào phòng thi →</button><p class="hint">Mỗi tài khoản làm một lượt cho mỗi đề. Sự kiện chuyển tab có thể được ghi nhận; không đồng nghĩa gian lận.</p><div class="divider"></div><div class="field"><label>Mã tham gia lớp</label><input id="classcode" placeholder="Nhập mã lớp"/></div><button id="joinclass" class="btn secondary full">Tham gia lớp học</button></section><section class="panel"><h3 class="panel-title">BÀI THI CỦA TÔI</h3><div id="myexams">Đang tải…</div></section></div></main>`));bindNav();
  try{
    const mine=await api('/exams');$('#myexams').innerHTML=mine.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Bài kiểm tra</th><th>Trạng thái</th><th>Điểm</th><th></th></tr></thead><tbody>${mine.map(e=>`<tr><td>${esc(e.title)}</td><td>${esc(e.attempt_status||e.status)}</td><td>${e.final_score==null?'Chờ chấm':esc(e.final_score)+'/10'}</td><td><button class="btn small secondary" data-open-exam="${esc(e.id)}">Mở</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="lead">Chưa có bài thi nào.</p>';
    $$('[data-open-exam]').forEach(b=>b.onclick=async()=>{try{const row=mine.find(e=>e.id===b.dataset.openExam);if(!row?.attempt_id)return toast('Không tìm thấy lượt làm bài.',true);await openAttempt(row.attempt_id);}catch(err){toast(err.message,true);}});
  }catch(err){toast(err.message,true);}
  $('#joinclass').onclick=async()=>{try{const result=await api('/classes/join',{method:'POST',body:{code:$('#classcode').value.trim()}});toast('Đã tham gia '+result.title);}catch(err){toast(err.message,true);}};
  $('#joinexam').onclick=async()=>{try{const entry=await api('/exams/join',{method:'POST',body:{code:$('#examcode').value.trim()}});state.attempt=entry.attempt_id;await openAttempt(entry.attempt_id);}catch(err){toast(err.message,true);}};
}
let examTimer=null,examHandlers=[];
function removeExamHandlers(){for(const [target,event,handler] of examHandlers)target.removeEventListener(event,handler);examHandlers=[];if(examTimer){clearInterval(examTimer);examTimer=null;}}
function eventExam(target,name,fn){target.addEventListener(name,fn);examHandlers.push([target,name,fn]);}
async function openAttempt(attemptId){
  removeExamHandlers();const attempt=await api('/attempts/'+attemptId);state.attempt=attemptId;
  const active=attempt.status==='active';const questions=attempt.questions;
  const markup=`<div class="section-head"><div><h2>${esc(attempt.title)}</h2><p>${esc(attempt.subject)} · Lớp ${attempt.grade} · ${attempt.duration_minutes} phút</p></div><div class="user-chip" id="timer">${active?'Đang tính giờ':'Đã nộp bài'}</div></div>
  ${!active?`<div class="notice green-notice">Bài đã được nộp. ${attempt.final_score!=null?'Điểm hiện tại: '+attempt.final_score+'/10':'Đang chờ giáo viên duyệt phần tự luận.'}</div>`:'<div class="notice">Trong khi làm bài, trang ghi nhận sự kiện rời trang hoặc mất kết nối để giáo viên xem xét theo ngữ cảnh. Đây không phải hệ thống khẳng định phát hiện gian lận.</div>'}
  <div class="work-grid"><section class="panel"><h3 class="panel-title">CÂU HỎI</h3><div id="questionnav" class="q-nav"></div><div class="divider"></div><p class="hint" id="savedstatus">${active?'Trả lời được tự động lưu.':'Bài đã khóa.'}</p>${active?button('Nộp bài','full','id="submitexam"'):''}</section><section id="questionlist">${questions.map((q,i)=>`<article class="q-card" id="question-${i}"><h4>Câu ${i+1}. ${esc(q.prompt)} <span class="smalltag">${q.points} điểm</span></h4>${q.type==='choice'?(q.options||[]).map((op,n)=>`<label class="answer-option"><input type="radio" name="${esc(q.id)}" value="${n}" ${attempt.answers[q.id]===n?'checked':''} ${!active?'disabled':''}/><span>${esc(op)}</span></label>`).join(''):q.type==='boolean'?['Đúng','Sai'].map((op,n)=>`<label class="answer-option"><input type="radio" name="${esc(q.id)}" value="${n===0?'true':'false'}" ${attempt.answers[q.id]===(n===0)?'checked':''} ${!active?'disabled':''}/><span>${op}</span></label>`).join(''):`<textarea data-short="${esc(q.id)}" placeholder="Nhập câu trả lời của bạn…" ${!active?'disabled':''}>${esc(attempt.answers[q.id]||'')}</textarea>`}</article>`).join('')}</section></div>`;
  $('#exam-root').outerHTML=`<div id="exam-working">${markup}</div>`;
  const answerMap={...attempt.answers};
  const updateNav=()=>{$('#questionnav').innerHTML=questions.map((q,i)=>`<button class="q-pill ${answerMap[q.id]!==undefined && answerMap[q.id]!==''?'done':''}" data-q="${i}">${i+1}</button>`).join('');$$('[data-q]').forEach(b=>b.onclick=()=>$('#question-'+b.dataset.q)?.scrollIntoView({behavior:'smooth',block:'center'}));};updateNav();
  if(!active){state.attempt=null;return;}
  let schedule=null,saveSeq=0;
  const save=async()=>{const seq=++saveSeq;try{await api('/attempts/'+attemptId+'/answers',{method:'PUT',body:{answers:answerMap}});if(seq===saveSeq&&$('#savedstatus'))$('#savedstatus').textContent='✓ Đã lưu lên máy chủ lúc '+new Date().toLocaleTimeString('vi-VN');}catch(err){if($('#savedstatus'))$('#savedstatus').textContent='⚠ Chưa lưu được: '+err.message;}};
  const scheduleSave=()=>{updateNav();$('#savedstatus').textContent='Đang lưu…';clearTimeout(schedule);schedule=setTimeout(save,500);};
  $$('input[type="radio"]','#questionlist').forEach(el=>el.addEventListener('change',()=>{const q=questions.find(x=>x.id===el.name);answerMap[el.name]=q.type==='choice'?Number(el.value):el.value==='true';scheduleSave();}));
  $$('[data-short]').forEach(el=>el.addEventListener('input',()=>{answerMap[el.dataset.short]=el.value;scheduleSave();}));
  const event=kind=>{api('/attempts/'+attemptId+'/events',{method:'POST',body:{event_type:kind}}).catch(()=>{});};
  eventExam(document,'visibilitychange',()=>event(document.hidden?'hidden':'visible'));
  eventExam(document,'fullscreenchange',()=>{if(!document.fullscreenElement)event('fullscreen_exit');});
  eventExam(window,'offline',()=>event('offline'));eventExam(window,'online',()=>event('online'));
  eventExam(window,'pagehide',()=>{fetch('/api/attempts/'+attemptId+'/events',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'X-Requested-With':'XMLHttpRequest','Content-Type':'application/json'},body:JSON.stringify({event_type:'page_exit'})}).catch(()=>{});});
  const deadline=attempt.started_at*1000+attempt.duration_minutes*60000;
  let timerOffset=attempt.server_time*1000-Date.now();
  examTimer=setInterval(async()=>{
    if(!$('#timer')){removeExamHandlers();return;}
    const left=Math.max(0,deadline-(Date.now()+timerOffset)),s=Math.ceil(left/1000);
    $('#timer').textContent=`⏱ ${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
    if(left<60000)$('#timer').style.color='#bd4141';
    if(left===0){removeExamHandlers();await api('/attempts/'+attemptId+'/submit',{method:'POST'}).catch(()=>{});await openAttempt(attemptId);}
  },1000);
  $('#submitexam').onclick=async()=>{if(!confirm('Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không được sửa.'))return;clearTimeout(schedule);await save();try{await api('/attempts/'+attemptId+'/submit',{method:'POST'});removeExamHandlers();await openAttempt(attemptId);}catch(err){toast(err.message,true);}};
}
let draftQuestions=[];
const blankQuestion=()=>({id:'q'+(draftQuestions.length+1),type:'choice',prompt:'',options:['','','',''],correct:0,points:1,explanation:''});
function qEditor(){
  $('#question-editor').innerHTML=draftQuestions.map((q,i)=>`<div class="q-card" data-editq="${i}"><div class="row"><strong>Câu ${i+1}</strong><button class="linkbtn" data-deleteq="${i}">Xóa câu</button></div>
    <div class="field"><label>Nội dung câu hỏi</label><textarea data-prop="prompt">${esc(q.prompt)}</textarea></div>
    <div class="grid2"><div class="field"><label>Dạng</label><select data-prop="type">${opt(['choice','boolean','short'],q.type)}</select></div><div class="field"><label>Điểm</label><input type="number" data-prop="points" min="0.1" max="10" step="0.1" value="${esc(q.points)}"/></div></div>
    ${q.type==='choice'?`<label>Phương án (chọn đáp án đúng)</label>${q.options.map((o,n)=>`<div class="row" style="margin:5px 0"><input type="radio" name="correct-${i}" value="${n}" ${q.correct===n?'checked':''} style="width:20px;min-height:auto"/><input data-option="${n}" value="${esc(o)}" placeholder="Phương án ${n+1}"/></div>`).join('')}`:q.type==='boolean'?`<div class="field"><label>Đáp án đúng</label><select data-prop="boolcorrect">${opt(['true','false'],String(q.correct))}</select></div>`:`<div class="field"><label>Đáp án tham khảo</label><input data-prop="shortcorrect" value="${esc(q.correct)}"/></div>`}
    <div class="field"><label>Giải thích đáp án (giáo viên, không hiển thị khi thi)</label><textarea data-prop="explanation">${esc(q.explanation||'')}</textarea></div>
  </div>`).join('');
  $$('[data-editq]').forEach(card=>{
    const idx=Number(card.dataset.editq);
    $$('[data-prop]',card).forEach(input=>input.addEventListener('change',()=>{
      let prop=input.dataset.prop;
      if(prop==='type'){
        draftQuestions[idx].type=input.value;draftQuestions[idx].correct=input.value==='boolean'?true:input.value==='short'?'':0;
        qEditor();return;
      }
      if(prop==='points')draftQuestions[idx].points=Number(input.value);
      else if(prop==='boolcorrect'||prop==='shortcorrect')draftQuestions[idx].correct=prop==='boolcorrect'?input.value==='true':input.value;
      else draftQuestions[idx][prop]=input.value;
    }));
    $$('[data-option]',card).forEach(el=>el.addEventListener('input',()=>draftQuestions[idx].options[Number(el.dataset.option)]=el.value));
    $$(`input[name="correct-${idx}"]`,card).forEach(el=>el.addEventListener('change',()=>draftQuestions[idx].correct=Number(el.value)));
  });
  $$('[data-deleteq]').forEach(b=>b.onclick=()=>{draftQuestions.splice(Number(b.dataset.deleteq),1);qEditor();});
}
async function renderTeacher(){
  if(state.user.role!=='teacher'){return navigate('chat');}
  mount(shell(`<main class="page">${title('Không gian giáo viên','Tổ chức lớp, tạo đề, theo dõi lượt làm bài và kiểm tra kết quả chấm.')}
  <div class="cards" id="teacherstats" style="margin-bottom:18px">${[1,2,3,4].map(()=>'<div class="card"><div class="metric">–</div><div class="muted text-sm">Đang tải…</div></div>').join('')}</div>
  <div class="work-grid"><div class="stack"><section class="panel"><h3 class="panel-title">QUẢN LÝ LỚP HỌC</h3><form id="createclass"><div class="field"><label>Tên lớp</label><input name="title" placeholder="Ví dụ: Lớp 11A1" required minlength="2"/></div><div class="field"><label>Khối lớp</label><select name="grade">${opt(Array.from({length:12},(_,i)=>i+1),11)}</select></div><button class="btn full" type="submit">+ Tạo lớp mới</button></form><div class="divider"></div><div id="teacherclasses">Đang tải…</div></section>
    <section class="panel"><h3 class="panel-title">ĐỀ KIỂM TRA ĐÃ TẠO</h3><div id="teacherexams">Đang tải…</div></section></div>
  <section class="panel"><h3 class="panel-title">TẠO ĐỀ KIỂM TRA</h3><form id="examform"><div class="field"><label>Tên bài kiểm tra</label><input name="title" required placeholder="Ví dụ: Kiểm tra chương Hàm số"/></div><div class="grid2"><div class="field"><label>Môn học</label><select name="subject">${opt(SUBJECTS.filter(s=>s!=='Tự động'),'Toán học')}</select></div><div class="field"><label>Khối lớp</label><select name="grade">${opt(Array.from({length:12},(_,i)=>i+1),11)}</select></div></div>
    <div class="grid2"><div class="field"><label>Thời gian (phút)</label><input name="duration_minutes" type="number" min="1" max="180" value="15" required/></div><div class="field"><label>Giao cho lớp (tùy chọn)</label><select name="classroom_id" id="examclass"><option value="">Mở cho người có mã</option></select></div></div>
    <div class="divider"></div><h3 class="panel-title">GỢI Ý CÂU HỎI BẰNG AI</h3><div class="field"><label>Chủ đề</label><input id="examtopic" placeholder="VD: Phương trình bậc hai"/></div><div class="grid2"><div class="field"><label>Số câu</label><input id="examcount" type="number" min="1" max="15" value="5"/></div><div class="field"><label>Độ khó</label><select id="examdiff">${opt(['Dễ','Trung bình','Khó'],'Trung bình')}</select></div></div><button class="btn secondary full" type="button" id="generatequestions">✦ Nhờ Gemini soạn đề</button>
    <div class="divider"></div><div class="row"><h3 class="panel-title" style="margin:0">CÂU HỎI TRONG ĐỀ</h3><button class="btn small light" type="button" id="addquestion">+ Thêm câu</button></div><div class="notice">Xem lại và chỉnh sửa các câu do AI tạo. Chỉ đề đã bấm “Xuất bản” mới cho học sinh truy cập.</div><div id="question-editor"></div><button class="btn full" type="submit">Lưu đề nháp</button></form></section></div>
  <section class="panel" id="teacher-detail" style="margin-top:18px" hidden></section></main>`));bindNav();
  draftQuestions=draftQuestions.length?draftQuestions:[blankQuestion()];qEditor();
  $('#addquestion').onclick=()=>{if(draftQuestions.length>=80)return toast('Tối đa 80 câu.',true);draftQuestions.push(blankQuestion());qEditor();};
  $('#createclass').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const r=await api('/classes',{method:'POST',body:{title:f.get('title'),grade:Number(f.get('grade'))}});toast(`Đã tạo lớp. Mã tham gia: ${r.join_code}`);e.target.reset();teacherLoad();}catch(err){toast(err.message,true);}};
  $('#generatequestions').onclick=async()=>{
    const topic=$('#examtopic').value.trim();if(!topic)return toast('Hãy nhập chủ đề để tạo câu hỏi.',true);
    const form=$('#examform');const btn=$('#generatequestions');btn.disabled=true;btn.textContent='Gemini đang biên soạn…';
    try{const generated=await api('/teacher/generate-exam',{method:'POST',body:{subject:form.elements.subject.value,grade:Number(form.elements.grade.value),topic,count:Number($('#examcount').value),difficulty:$('#examdiff').value}});draftQuestions=generated.questions;qEditor();toast('Đã tạo câu hỏi. Hãy kiểm tra nội dung trước khi lưu.');}catch(err){toast(err.message,true);}
    btn.disabled=false;btn.textContent='✦ Nhờ Gemini soạn đề';
  };
  $('#examform').onsubmit=async e=>{
    e.preventDefault();$$('[data-editq] textarea[data-prop="prompt"]').forEach(el=>el.dispatchEvent(new Event('change')));
    const f=new FormData(e.target);
    const questions=draftQuestions.map((q,i)=>({...q,id:'q'+(i+1)}));
    try{const result=await api('/exams',{method:'POST',body:{title:f.get('title'),subject:f.get('subject'),grade:Number(f.get('grade')),duration_minutes:Number(f.get('duration_minutes')),classroom_id:f.get('classroom_id')||null,questions}});toast('Đã lưu đề nháp. Có thể xuất bản ở danh sách bên trái.');draftQuestions=[blankQuestion()];qEditor();teacherLoad();}
    catch(err){toast(err.message,true);}
  };
  teacherLoad();
}
async function teacherLoad(){
  try{
    const [stats,classes,exams]=await Promise.all([api('/teacher/summary'),api('/classes'),api('/exams')]);
    $('#teacherstats').innerHTML=[['Học sinh',stats.students],['Lớp học',stats.classes],['Đề kiểm tra',stats.exams],['Bài đã nộp',stats.submitted]].map(([label,value])=>`<div class="card"><div class="metric">${fmt(value)}</div><div class="muted text-sm">${label}</div></div>`).join('');
    $('#teacherclasses').innerHTML=classes.length?classes.map(c=>`<div class="muted-box" style="margin:7px 0"><div class="row"><strong>${esc(c.title)}</strong><span class="smalltag">${c.members} HS</span></div>Khối ${c.grade} · Mã: <strong style="display:inline;color:#584ae2">${esc(c.join_code)}</strong><div><button class="linkbtn" data-students="${c.id}">Xem học sinh</button></div></div>`).join(''):'<p class="lead">Chưa có lớp nào.</p>';
    $('#examclass').innerHTML='<option value="">Mở cho người có mã</option>'+classes.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');
    $('#teacherexams').innerHTML=exams.length?exams.map(e=>`<div class="muted-box" style="margin-bottom:9px"><strong>${esc(e.title)}</strong><div class="text-sm">${esc(e.subject)} · Lớp ${e.grade} · ${esc(e.status)}</div>${e.access_code?`<div class="stat-pill">Mã: ${esc(e.access_code)}</div>`:''}<div style="margin-top:8px" class="toolbar">${e.status==='draft'?`<button class="btn small secondary" data-publish="${e.id}">Xuất bản</button>`:''}<button class="btn small light" data-results="${e.id}">Bài làm</button><button class="btn small light" data-preview="${e.id}">Xem đề</button>${e.status==='published'?`<button class="btn small danger" data-close="${e.id}">Đóng đề</button>`:''}</div></div>`).join(''):'<p class="lead">Chưa có đề kiểm tra.</p>';
    $$('[data-publish]').forEach(b=>b.onclick=async()=>{try{const r=await api(`/exams/${b.dataset.publish}/publish`,{method:'POST'});toast('Đã xuất bản, mã truy cập: '+r.access_code);teacherLoad();}catch(err){toast(err.message,true);}});
    $$('[data-close]').forEach(b=>b.onclick=async()=>{if(!confirm('Đóng bài kiểm tra này?'))return;try{await api(`/exams/${b.dataset.close}/close`,{method:'POST'});teacherLoad();}catch(err){toast(err.message,true);}});
    $$('[data-results]').forEach(b=>b.onclick=()=>teacherResults(b.dataset.results));
    $$('[data-preview]').forEach(b=>b.onclick=()=>teacherPreview(b.dataset.preview));
    $$('[data-students]').forEach(b=>b.onclick=async()=>{try{const r=await api(`/classes/${b.dataset.students}/students`);$('#teacher-detail').hidden=false;$('#teacher-detail').innerHTML=`<h3>Danh sách lớp (${r.length} học sinh)</h3>${r.length?r.map(x=>`<p class="text-sm">${esc(x.name)} · ${esc(x.email)}</p>`).join(''):'<p class="lead">Chưa có học sinh tham gia.</p>'}`;$('#teacher-detail').scrollIntoView({behavior:'smooth'});}catch(err){toast(err.message,true);}});
  }catch(err){toast(err.message,true);}
}
async function teacherPreview(examId){
  try{const exam=await api('/exams/'+examId);const panel=$('#teacher-detail');panel.hidden=false;
    panel.innerHTML=`<h3>Đề: ${esc(exam.title)} <span class="smalltag">${esc(exam.status)}</span></h3><p class="hint">Giáo viên mới được xem đáp án đúng trước khi đề kết thúc.</p>${exam.questions.map((q,i)=>`<div class="q-card"><strong>Câu ${i+1}. ${esc(q.prompt)}</strong><div class="text-sm">${q.type==='choice'?q.options.map((o,n)=>`<div>${n===q.correct?'✓ ':''}${esc(o)}</div>`).join(''):q.type==='boolean'?(q.correct?'Đúng':'Sai'):esc(q.correct)}</div><p class="hint">${esc(q.explanation)}</p></div>`).join('')}`;
    panel.scrollIntoView({behavior:'smooth'});
  }catch(err){toast(err.message,true);}
}
async function teacherResults(examId){
  try{const rows=await api(`/exams/${examId}/attempts`);const panel=$('#teacher-detail');panel.hidden=false;
    panel.innerHTML=`<h3>Bài làm học sinh (${rows.length})</h3><p class="hint">Sự kiện rời trang chỉ là dữ liệu quan sát, không phải kết luận về gian lận.</p>${rows.length?rows.map(row=>`<div class="q-card"><div class="row"><strong>${esc(row.name)}</strong><span class="smalltag">${esc(row.status)}</span></div><p class="text-sm">Điểm tự động: ${row.auto_score??'Chưa nộp'} · Điểm cuối: ${row.final_score??'Chờ giáo viên'}</p><div class="muted-box"><strong>Câu trả lời</strong><pre class="preline" style="font:inherit">${esc(JSON.stringify(row.answers,null,2))}</pre></div><p class="hint">Sự kiện: ${row.events?.length?row.events.map(x=>esc(x.event_type)+' @ '+new Date(x.occurred_at*1000).toLocaleTimeString('vi-VN')).join('; '):'Không có'}</p>${row.status==='submitted'?`<div class="grid2"><div class="field"><label>Điểm cuối (0–10)</label><input type="number" min="0" max="10" step="0.1" id="score-${row.id}" value="${row.final_score??0}"/></div><div class="field"><label>Nhận xét</label><input id="feedback-${row.id}" value="${esc(row.feedback||'')}" /></div></div><button class="btn small secondary" data-review="${row.id}">Lưu đánh giá</button>`:''}</div>`).join(''):'<p class="lead">Chưa có lượt làm bài nào.</p>'}`;
    $$('[data-review]').forEach(b=>b.onclick=async()=>{try{await api(`/attempts/${b.dataset.review}/review`,{method:'PATCH',body:{final_score:Number($('#score-'+b.dataset.review).value),feedback:$('#feedback-'+b.dataset.review).value}});toast('Đã lưu kết quả.');teacherResults(examId);}catch(err){toast(err.message,true);}});
    panel.scrollIntoView({behavior:'smooth'});
  }catch(err){toast(err.message,true);}
}
async function init(){
  try{state.health=await api('/health');}catch{state.health={ok:false,ai_configured:false};}
  try{state.user=await api('/auth/me');state.grade=state.user.grade||11;state.messages=await api('/chat');}
  catch{state.user=null;}
  render();
}
init();
