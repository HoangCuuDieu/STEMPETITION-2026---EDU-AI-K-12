"""AI Education Platform K-12: actual API, storage, role-scoped endpoints.
Run: uvicorn backend.main:app --reload
"""
import json
import secrets
import time
import sqlite3
from psycopg.errors import UniqueViolation
from pathlib import Path
from typing import Any, Literal
from fastapi import FastAPI, Request, Response, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr, field_validator
from . import config
from .database import CHAT_ORDER_COLUMN, connection, init_db
from .security import (uid, make_code, hash_password, verify_password,
                       new_session, session_digest, COOKIE_NAME, user_for_request, require_role)
from .parsers import extract, IMAGE_TYPES
from .ai import generate, image_part, TUTOR_INSTRUCTION, parse_json_response
from .storage import read_object, upload_object

app = FastAPI(title='AI Education Platform K-12', version='0.1.0', docs_url='/api/docs', openapi_url='/api/openapi.json')
init_db()

@app.middleware('http')
async def same_origin_mutations(request: Request, call_next):
    # A non-simple custom header is mandatory for cookie-authenticated mutations.
    if request.url.path.startswith('/api/') and request.method in {'POST','PUT','PATCH','DELETE'}:
        if request.headers.get('x-requested-with') != 'XMLHttpRequest':
            from fastapi.responses import JSONResponse
            return JSONResponse({'detail':'Thiếu tiêu đề bảo vệ yêu cầu.'}, status_code=403)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['X-Frame-Options'] = 'DENY'
    return response

class Register(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=10, max_length=200)
    role: Literal['student','teacher'] = 'student'
    grade: int | None = Field(default=None, ge=1, le=12)
    teacher_code: str = ''

class Login(BaseModel):
    email: EmailStr
    password: str

class ChatIn(BaseModel):
    message: str = Field(default='', max_length=5000)
    grade: int = Field(default=11, ge=1, le=12)
    subject: str = Field(default='Tự động', max_length=80)
    file_id: str | None = None

class ClassIn(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    grade: int = Field(ge=1, le=12)

class JoinCode(BaseModel):
    code: str = Field(min_length=4, max_length=50)

class ExamIn(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    grade: int = Field(ge=1, le=12)
    subject: str = Field(min_length=2, max_length=80)
    duration_minutes: int = Field(ge=1, le=180)
    classroom_id: str | None = None
    questions: list[dict[str, Any]] = Field(min_length=1, max_length=80)

class GenerateExam(BaseModel):
    subject: str = Field(min_length=2, max_length=80)
    grade: int = Field(ge=1, le=12)
    topic: str = Field(min_length=3, max_length=300)
    count: int = Field(default=5, ge=1, le=15)
    difficulty: Literal['Dễ','Trung bình','Khó'] = 'Trung bình'

class AnswerUpdate(BaseModel):
    answers: dict[str, Any]

class ExamEvent(BaseModel):
    event_type: Literal['hidden','visible','fullscreen_exit','offline','online','page_exit']

class ReviewIn(BaseModel):
    final_score: float = Field(ge=0, le=10)
    feedback: str = Field(default='', max_length=3000)

class ModelIn(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    kind: Literal['geometry','chemistry']
    data: dict[str, Any]


def check_ai_quota(user_id: str, kind: str, limit: int):
    """A conservative per-user request rate limit, shared via SQLite."""
    now = int(time.time())
    with connection() as db:
        db.execute('DELETE FROM ai_usage WHERE used_at<?',(now-3600,))
        recent=db.execute('SELECT COUNT(*) n FROM ai_usage WHERE user_id=? AND kind=? AND used_at>=?',
                          (user_id,kind,now-60)).fetchone()['n']
        if recent>=limit:
            raise HTTPException(429,'Bạn đã gửi quá nhiều yêu cầu AI trong một phút. Hãy thử lại sau.')
        db.execute('INSERT INTO ai_usage(id,user_id,kind,used_at) VALUES (?,?,?,?)',
                   (uid(),user_id,kind,now))

def clean_user(user):
    return {k:user[k] for k in ['id','name','email','role','grade']}

def cookie_login(response, user_id):
    response.set_cookie(COOKIE_NAME, new_session(user_id), httponly=True, secure=config.COOKIE_SECURE,
                        samesite='lax', max_age=config.SESSION_SECONDS, path='/')

def validate_questions(questions):
    if not isinstance(questions, list) or not (1 <= len(questions) <= 80):
        raise HTTPException(422,'Đề phải có từ 1 đến 80 câu hỏi.')
    ids = set()
    normalized = []
    for i,q in enumerate(questions):
        if not isinstance(q, dict):
            raise HTTPException(422,f'Câu {i+1} không hợp lệ.')
        typ = q.get('type')
        qid = str(q.get('id') or f'q{i+1}')[:32]
        prompt = str(q.get('prompt') or '').strip()[:1500]
        if qid in ids or not prompt or typ not in {'choice','boolean','short'}:
            raise HTTPException(422,f'Câu {i+1}: trùng mã, thiếu nội dung hoặc sai dạng.')
        ids.add(qid)
        score = float(q.get('points',1)) if str(q.get('points',1)).replace('.','',1).isdigit() else 0
        if not 0.1 <= score <= 10:
            raise HTTPException(422,f'Câu {i+1}: điểm phải từ 0,1 đến 10.')
        clean = {'id':qid,'prompt':prompt,'type':typ,'points':score}
        if typ == 'choice':
            opts = q.get('options',[])
            if not isinstance(opts,list) or not 2 <= len(opts) <= 6 or any(not str(o).strip() for o in opts):
                raise HTTPException(422,f'Câu {i+1}: cần 2–6 phương án.')
            correct = q.get('correct')
            if not isinstance(correct,int) or not (0 <= correct < len(opts)):
                raise HTTPException(422,f'Câu {i+1}: đáp án trắc nghiệm chưa hợp lệ.')
            clean.update(options=[str(o)[:300] for o in opts],correct=correct)
        elif typ == 'boolean':
            if not isinstance(q.get('correct'),bool):
                raise HTTPException(422,f'Câu {i+1}: đáp án đúng/sai phải là true/false.')
            clean['correct'] = q['correct']
        else:
            clean['correct'] = str(q.get('correct',''))[:800]
        clean['explanation'] = str(q.get('explanation',''))[:1000]
        normalized.append(clean)
    total = sum(q['points'] for q in normalized)
    if total <= 0:
        raise HTTPException(422,'Đề cần có điểm.')
    return normalized

def sanitize_exam(row):
    item = dict(row)
    qs = json.loads(item.pop('questions_json'))
    item['questions'] = [{k:v for k,v in q.items() if k not in ('correct','explanation')} for q in qs]
    return item

def load_exam(exam_id):
    with connection() as db:
        row = db.execute('SELECT * FROM exams WHERE id=?',(exam_id,)).fetchone()
    if not row:
        raise HTTPException(404,'Không thấy bài kiểm tra.')
    return dict(row)

def exam_for_teacher(exam_id, teacher_id):
    exam = load_exam(exam_id)
    if exam['teacher_id'] != teacher_id:
        raise HTTPException(403,'Bạn không sở hữu đề này.')
    return exam

@app.get('/api/health')
def health():
    return {'ok':True,'ai_configured':bool(config.GEMINI_API_KEY),'version':'0.1.0'}

@app.get('/api/health/database')
def database_health():
    import os

    import psycopg

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise HTTPException(503, 'Thiếu cấu hình DATABASE_URL.')

    try:
        with psycopg.connect(
            database_url, connect_timeout=5, sslmode='require',
            prepare_threshold=None,
        ) as db:
            db.execute('SELECT 1').fetchone()
    except psycopg.Error:
        raise HTTPException(503, 'Chưa kết nối được PostgreSQL.') from None

    return {'database': 'ok'}

@app.post('/api/auth/register')
def register(data: Register, response: Response):
    if data.role == 'teacher' and (not config.TEACHER_INVITE_CODE or
                                    not secrets.compare_digest(data.teacher_code, config.TEACHER_INVITE_CODE)):
        raise HTTPException(403,'Cần mã mời giáo viên hợp lệ, cấu hình từ máy chủ.')
    if data.role == 'student' and data.grade is None:
        raise HTTPException(422,'Học sinh cần chọn khối lớp.')
    user_id = uid()
    try:
        with connection() as db:
            db.execute('INSERT INTO users (id,name,email,password_hash,role,grade) VALUES (?,?,?,?,?,?)',
                    (user_id,data.name.strip(),str(data.email).lower(),hash_password(data.password),data.role,data.grade))
    except (sqlite3.IntegrityError, UniqueViolation):
        raise HTTPException(409,'Email đã được đăng ký.')
    cookie_login(response, user_id)
    return {'id':user_id,'name':data.name.strip(),'email':str(data.email).lower(),'role':data.role,'grade':data.grade}

@app.post('/api/auth/login')
def login(data: Login, response: Response):
    with connection() as db:
        row = db.execute('SELECT * FROM users WHERE email=?',(str(data.email).lower(),)).fetchone()
    if not row or not verify_password(data.password, row['password_hash']):
        raise HTTPException(401,'Email hoặc mật khẩu không đúng.')
    cookie_login(response, row['id'])
    return clean_user(row)

@app.post('/api/auth/logout')
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        with connection() as db:
            db.execute('DELETE FROM sessions WHERE token_hash=?',(session_digest(token),))
    response.delete_cookie(COOKIE_NAME,path='/')
    return {'ok':True}

@app.get('/api/auth/me')
def me(request: Request):
    return user_for_request(request)

@app.post('/api/files')
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = user_for_request(request)
    filename = Path(file.filename or '').name
    if not filename or len(filename)>180:
        raise HTTPException(400,'Tên tệp không hợp lệ.')
    data = await file.read(config.MAX_UPLOAD_BYTES + 1)
    mime, extracted = extract(filename,data)
    fid = uid()
    suffix = Path(filename).suffix.lower()
    await upload_object(f'{fid}{suffix}', data, mime)
    with connection() as db:
        db.execute('INSERT INTO files(id,owner_id,filename,mime,kind,extracted,size) VALUES (?,?,?,?,?,?,?)',
                (fid,user['id'],filename,mime,'image' if mime in IMAGE_TYPES else 'document',extracted,len(data)))
    return {'id':fid,'filename':filename,'kind':'image' if mime in IMAGE_TYPES else 'document',
            'size':len(data),'text_extracted':bool(extracted)}

@app.get('/api/files')
def my_files(request: Request):
    user = user_for_request(request)
    with connection() as db:
        return [dict(row) for row in db.execute('SELECT id,filename,kind,size,created_at FROM files WHERE owner_id=? ORDER BY created_at DESC LIMIT 60',(user['id'],))]

@app.get('/api/chat')
def chat_history(request: Request):
    user = user_for_request(request)
    with connection() as db:
        rows = db.execute(f'SELECT id,role,content,created_at FROM chat_messages WHERE user_id=? ORDER BY {CHAT_ORDER_COLUMN} DESC LIMIT 80',(user['id'],)).fetchall()
    return [dict(row) for row in reversed(rows)]

@app.delete('/api/chat')
def clear_chat(request: Request):
    user = user_for_request(request)
    with connection() as db:
        db.execute('DELETE FROM chat_messages WHERE user_id=?',(user['id'],))
    return {'ok':True}

@app.post('/api/chat')
async def chat(data: ChatIn, request: Request):
    user = user_for_request(request)
    if not data.message.strip() and not data.file_id:
        raise HTTPException(422,'Hãy nhập tin nhắn hoặc đính kèm tệp.')
    # avoid excessive usage per user, server-side
    with connection() as db:
        old = db.execute(f'SELECT role,content FROM chat_messages WHERE user_id=? ORDER BY {CHAT_ORDER_COLUMN} DESC LIMIT 12',(user['id'],)).fetchall()
        attachment = None
        if data.file_id:
            file_row = db.execute('SELECT * FROM files WHERE id=? AND owner_id=?',(data.file_id,user['id'])).fetchone()
            if not file_row:
                raise HTTPException(404,'Không thấy tệp của bạn.')
            attachment = dict(file_row)
    parts = [{'text':f'Khối lớp: {data.grade}. Môn học: {data.subject}.\nCâu hỏi: {data.message.strip() or "Hãy phân tích tài liệu đính kèm."}'}]
    if attachment:
        if attachment['kind']=='image':
            suffix = Path(attachment['filename']).suffix.lower()
            raw = await read_object(f'{attachment["id"]}{suffix}')
            parts.append(image_part(raw,attachment['mime']))
        elif attachment['mime']=='application/pdf':
            raw = await read_object(f'{attachment["id"]}.pdf')
            parts.append({'text':f'Tài liệu PDF: {attachment["filename"]}. Đọc cả trang chữ, sơ đồ và hình vẽ theo khả năng Gemini Vision.'})
            parts.append(image_part(raw,'application/pdf'))
        else:
            parts.append({'text':f'Tệp: {attachment["filename"]}. Nội dung trích xuất:\n{attachment["extracted"] or "Không trích xuất được."}'})
    hist = [(row['role'],row['content']) for row in reversed(old)]
    if config.GEMINI_API_KEY: check_ai_quota(user['id'],'chat',8)
    reply = await generate(parts, TUTOR_INSTRUCTION, hist)
    shown_message = data.message.strip() or f'[Đã gửi tệp {attachment["filename"]}]'
    with connection() as db:
        db.execute('INSERT INTO chat_messages(id,user_id,role,content) VALUES (?,?,?,?)',(uid(),user['id'],'user',shown_message))
        db.execute('INSERT INTO chat_messages(id,user_id,role,content) VALUES (?,?,?,?)',(uid(),user['id'],'assistant',reply))
    return {'reply':reply}

@app.post('/api/classes')
def create_class(data: ClassIn, request: Request):
    user = user_for_request(request); require_role(user,'teacher')
    cid,code = uid(),make_code()
    with connection() as db:
        db.execute('INSERT INTO classrooms(id,teacher_id,title,grade,join_code) VALUES (?,?,?,?,?)',
                   (cid,user['id'],data.title.strip(),data.grade,code))
    return {'id':cid,'title':data.title.strip(),'grade':data.grade,'join_code':code}

@app.get('/api/classes')
def classes(request: Request):
    user = user_for_request(request)
    with connection() as db:
        if user['role']=='teacher':
            rows = db.execute('''SELECT c.*, (SELECT COUNT(*) FROM enrollments e WHERE e.classroom_id=c.id) AS members
                 FROM classrooms c WHERE c.teacher_id=? ORDER BY c.created_at DESC''',(user['id'],)).fetchall()
        else:
            rows = db.execute('''SELECT c.id,c.title,c.grade,u.name teacher_name FROM classrooms c
                 JOIN enrollments e ON e.classroom_id=c.id JOIN users u ON u.id=c.teacher_id
                 WHERE e.student_id=?''',(user['id'],)).fetchall()
    return [dict(row) for row in rows]

@app.post('/api/classes/join')
def join_class(data: JoinCode, request: Request):
    user = user_for_request(request); require_role(user,'student')
    with connection() as db:
        cl = db.execute('SELECT id,title,grade FROM classrooms WHERE join_code=?',(data.code.strip().upper(),)).fetchone()
        if not cl:
            raise HTTPException(404,'Mã lớp không tồn tại.')
        db.execute(
            'INSERT INTO enrollments(classroom_id,student_id) VALUES (?,?) '
            'ON CONFLICT (classroom_id, student_id) DO NOTHING',
            (cl['id'], user['id']),
        )
    return dict(cl)

@app.get('/api/classes/{class_id}/students')
def class_students(class_id: str, request: Request):
    user = user_for_request(request); require_role(user,'teacher')
    with connection() as db:
        cl = db.execute('SELECT id FROM classrooms WHERE id=? AND teacher_id=?',(class_id,user['id'])).fetchone()
        if not cl:
            raise HTTPException(404,'Lớp không tồn tại hoặc không thuộc quyền quản lý.')
        rows = db.execute('''SELECT u.id,u.name,u.email,u.grade FROM users u JOIN enrollments e ON e.student_id=u.id
           WHERE e.classroom_id=? ORDER BY u.name''',(class_id,)).fetchall()
    return [dict(row) for row in rows]

@app.post('/api/teacher/generate-exam')
async def generate_exam(data: GenerateExam, request: Request):
    user = user_for_request(request); require_role(user,'teacher')
    instruction = '''Bạn là giáo viên soạn câu hỏi kiểm tra phổ thông tiếng Việt. Chỉ xuất JSON object có trường questions (array).
Mỗi câu có id (q1...), type (choice/boolean/short), prompt (string), points (number), correct, explanation.
Nếu choice: options là mảng 4 chuỗi và correct là số nguyên index 0..3. Nếu boolean: correct là boolean. Nếu short: correct là string.
Câu hỏi khoa học chính xác, không tạo bài nguy hiểm, không bịa dẫn chứng. Tổng điểm không bắt buộc 10, hệ thống sẽ chuẩn hóa.
'''
    prompt = (f'Hãy tạo {data.count} câu hỏi hỗn hợp về {data.topic}; môn {data.subject}, '
              f'lớp {data.grade}, độ khó {data.difficulty}.')
    if config.GEMINI_API_KEY: check_ai_quota(user['id'],'exam_generation',4)
    output = await generate([{'text':prompt}],instruction,json_mode=True)
    parsed = parse_json_response(output)
    if not isinstance(parsed,dict) or not isinstance(parsed.get('questions'),list):
        raise HTTPException(502,'AI trả về cấu trúc đề thiếu danh sách câu hỏi.')
    return {'questions':validate_questions(parsed['questions']),'notice':'Đề do AI đề xuất. Giáo viên phải xem, sửa và duyệt trước khi xuất bản.'}

@app.post('/api/exams')
def create_exam(data: ExamIn, request: Request):
    user = user_for_request(request); require_role(user,'teacher')
    qs = validate_questions(data.questions)
    if data.classroom_id:
        with connection() as db:
            found=db.execute('SELECT id FROM classrooms WHERE id=? AND teacher_id=?',(data.classroom_id,user['id'])).fetchone()
        if not found:
            raise HTTPException(403,'Không thể giao đề cho lớp không thuộc quyền quản lý.')
    eid=uid()
    with connection() as db:
        db.execute('''INSERT INTO exams(id,teacher_id,classroom_id,title,subject,grade,duration_minutes,questions_json)
             VALUES (?,?,?,?,?,?,?,?)''',(eid,user['id'],data.classroom_id,data.title.strip(),data.subject,data.grade,
                   data.duration_minutes,json.dumps(qs,ensure_ascii=False)))
    return {'id':eid,'status':'draft','questions':qs}

@app.get('/api/exams')
def my_exams(request: Request):
    user = user_for_request(request)
    with connection() as db:
        if user['role']=='teacher':
            rows=db.execute('''SELECT id,title,subject,grade,duration_minutes,access_code,status,created_at
                       FROM exams WHERE teacher_id=? ORDER BY created_at DESC''',(user['id'],)).fetchall()
        else:
            rows=db.execute('''SELECT e.id,e.title,e.subject,e.grade,e.duration_minutes,e.status,a.id attempt_id,a.status attempt_status,
                    a.auto_score,a.final_score FROM exams e JOIN attempts a ON a.exam_id=e.id
                    WHERE a.student_id=? ORDER BY a.started_at DESC''',(user['id'],)).fetchall()
    return [dict(row) for row in rows]

@app.get('/api/exams/{exam_id}')
def exam_detail(exam_id: str, request: Request):
    user = user_for_request(request)
    exam = load_exam(exam_id)
    if user['role']=='teacher':
        exam_for_teacher(exam_id,user['id'])
        exam['questions']=json.loads(exam.pop('questions_json'))
        return exam
    with connection() as db:
        attempt=db.execute('SELECT id FROM attempts WHERE exam_id=? AND student_id=?',(exam_id,user['id'])).fetchone()
    if not attempt:
        raise HTTPException(403,'Bạn chưa tham gia bài kiểm tra này.')
    return sanitize_exam(exam)

@app.post('/api/exams/{exam_id}/publish')
def publish_exam(exam_id: str, request: Request):
    user = user_for_request(request); require_role(user,'teacher')
    exam = exam_for_teacher(exam_id,user['id'])
    if exam['status']=='closed':
        raise HTTPException(409,'Bài kiểm tra đã đóng.')
    code = exam['access_code'] or make_code(10)
    with connection() as db:
        db.execute('UPDATE exams SET status=?,access_code=? WHERE id=?',('published',code,exam_id))
    return {'id':exam_id,'status':'published','access_code':code}

@app.post('/api/exams/{exam_id}/close')
def close_exam(exam_id: str, request: Request):
    user=user_for_request(request); require_role(user,'teacher')
    exam_for_teacher(exam_id,user['id'])
    with connection() as db:
        active = db.execute('''SELECT a.*,e.questions_json,e.duration_minutes FROM attempts a
            JOIN exams e ON e.id=a.exam_id WHERE a.exam_id=? AND a.status=?''',(exam_id, 'active')).fetchall()
        for attempt in active:
            submit_locked(dict(attempt),db)
        db.execute('UPDATE exams SET status=? WHERE id=?',('closed', exam_id))
    return {'status':'closed','auto_submitted':len(active)}

@app.post('/api/exams/join')
def join_exam(data: JoinCode, request: Request):
    user = user_for_request(request); require_role(user,'student')
    with connection() as db:
        exam = db.execute('SELECT * FROM exams WHERE access_code=? AND status=?',(data.code.strip().upper(), 'published')).fetchone()
        if not exam:
            raise HTTPException(404,'Mã bài kiểm tra không tồn tại hoặc đề chưa mở.')
        if exam['classroom_id']:
            belongs=db.execute('SELECT 1 FROM enrollments WHERE classroom_id=? AND student_id=?',
                               (exam['classroom_id'],user['id'])).fetchone()
            if not belongs:
                raise HTTPException(403,'Bài kiểm tra chỉ dành cho học sinh trong lớp được giao.')
        existing=db.execute('SELECT id FROM attempts WHERE exam_id=? AND student_id=?',(exam['id'],user['id'])).fetchone()
        if existing:
            aid=existing['id']
        else:
            aid=uid()
            db.execute('INSERT INTO attempts(id,exam_id,student_id,started_at) VALUES (?,?,?,?)',
                       (aid,exam['id'],user['id'],int(time.time())))
    return {'attempt_id':aid,'exam_id':exam['id']}

def current_attempt(attempt_id, user_id, db):
    row=db.execute('''SELECT a.*,e.questions_json,e.duration_minutes,e.status exam_status,
                           e.teacher_id,e.title,e.subject,e.grade FROM attempts a
                    JOIN exams e ON e.id=a.exam_id WHERE a.id=? AND a.student_id=?''',
                 (attempt_id,user_id)).fetchone()
    if not row:
        raise HTTPException(404,'Không tìm thấy lượt làm bài của bạn.')
    return dict(row)

def expired(row):
    return int(time.time()) >= row['started_at'] + row['duration_minutes']*60

def score_answers(questions, answers):
    possible=sum(float(q['points']) for q in questions)
    earned=0.0; subjective=False
    for q in questions:
        submitted=answers.get(q['id'])
        if q['type']=='short':
            if submitted not in (None,''):
                subjective=True
        elif q['type']=='choice' and type(submitted) is int and submitted==q['correct']:
            earned+=q['points']
        elif q['type']=='boolean' and type(submitted) is bool and submitted==q['correct']:
            earned+=q['points']
    return round(earned/possible*10,2),subjective

def submit_locked(row, db):
    if row['status']=='submitted':
        return {'status':'submitted','auto_score':row['auto_score'],'final_score':row['final_score']}
    qs=json.loads(row['questions_json']); answers=json.loads(row['answers_json'])
    score,subjective=score_answers(qs,answers)
    final = None if subjective else score
    db.execute('''UPDATE attempts SET status=?,submitted_at=?,auto_score=?,final_score=? WHERE id=?''',
               ('submitted', int(time.time()), score, final, row['id']))
    return {'status':'submitted','auto_score':score,'final_score':final,
            'notice':'Câu trả lời ngắn đang chờ giáo viên duyệt.' if subjective else 'Đã chấm các câu khách quan.'}

@app.get('/api/attempts/{attempt_id}')
def get_attempt(attempt_id: str, request: Request):
    user=user_for_request(request); require_role(user,'student')
    with connection() as db:
        row=current_attempt(attempt_id,user['id'],db)
        if row['status']=='active' and expired(row):
            submit_locked(row,db)
            row=current_attempt(attempt_id,user['id'],db)
    safe_qs=[{k:v for k,v in q.items() if k not in ('correct','explanation')}
             for q in json.loads(row['questions_json'])]
    return {'id':attempt_id,'exam_id':row['exam_id'],'title':row['title'],'subject':row['subject'],
            'grade':row['grade'],'duration_minutes':row['duration_minutes'],
            'started_at':row['started_at'],'server_time':int(time.time()),'status':row['status'],
            'answers':json.loads(row['answers_json']), 'questions':safe_qs,
            'auto_score':row['auto_score'],'final_score':row['final_score']}

@app.put('/api/attempts/{attempt_id}/answers')
def save_answers(attempt_id: str, data: AnswerUpdate, request: Request):
    user=user_for_request(request); require_role(user,'student')
    with connection() as db:
        row=current_attempt(attempt_id,user['id'],db)
        if row['status']!='active' or row['exam_status']!='published':
            raise HTTPException(409,'Bài đã nộp hoặc đã bị giáo viên đóng.')
        if expired(row):
            raise HTTPException(409,'Đã hết giờ. Tải lại bài thi để hệ thống khóa và nộp bài.')
        qs=json.loads(row['questions_json']); valid_ids={q['id'] for q in qs}
        clean={}
        if len(json.dumps(data.answers,ensure_ascii=False))>12000:
            raise HTTPException(413,'Câu trả lời quá dài.')
        for qid,answer in data.answers.items():
            if qid not in valid_ids:
                raise HTTPException(422,'Câu hỏi không hợp lệ.')
            typ=next(q['type'] for q in qs if q['id']==qid)
            if typ=='choice' and (answer is not None and type(answer) is not int):
                raise HTTPException(422,'Trắc nghiệm cần đáp án số nguyên.')
            if typ=='boolean' and (answer is not None and type(answer) is not bool):
                raise HTTPException(422,'Đáp án đúng/sai không hợp lệ.')
            if typ=='short' and (not isinstance(answer,str) or len(answer)>1200):
                raise HTTPException(422,'Câu trả lời ngắn không hợp lệ.')
            clean[qid]=answer
        db.execute('UPDATE attempts SET answers_json=? WHERE id=?',(json.dumps(clean,ensure_ascii=False),attempt_id))
    return {'saved':True,'timestamp':int(time.time())}

@app.post('/api/attempts/{attempt_id}/submit')
def submit_attempt(attempt_id: str, request: Request):
    user=user_for_request(request); require_role(user,'student')
    with connection() as db:
        row=current_attempt(attempt_id,user['id'],db)
        return submit_locked(row,db)

@app.post('/api/attempts/{attempt_id}/events')
def log_exam_event(attempt_id: str, data: ExamEvent, request: Request):
    user=user_for_request(request); require_role(user,'student')
    with connection() as db:
        row=current_attempt(attempt_id,user['id'],db)
        if row['status']!='active':
            return {'logged':False}
        db.execute('INSERT INTO exam_events(id,attempt_id,event_type,occurred_at) VALUES (?,?,?,?)',
                   (uid(),attempt_id,data.event_type,int(time.time())))
    return {'logged':True}

@app.get('/api/exams/{exam_id}/attempts')
def teacher_exam_attempts(exam_id: str, request: Request):
    user=user_for_request(request); require_role(user,'teacher')
    exam_for_teacher(exam_id,user['id'])
    with connection() as db:
        rows=db.execute('''SELECT a.id,a.student_id,u.name,u.email,a.started_at,a.submitted_at,
                    a.answers_json,a.status,a.auto_score,a.final_score,a.feedback
                    FROM attempts a JOIN users u ON a.student_id=u.id WHERE a.exam_id=? ORDER BY a.started_at DESC''',(exam_id,)).fetchall()
        result=[]
        for row in rows:
            item=dict(row); item['answers']=json.loads(item.pop('answers_json'))
            item['events']=[dict(x) for x in db.execute('SELECT event_type,occurred_at FROM exam_events WHERE attempt_id=? ORDER BY occurred_at',(item['id'],)).fetchall()]
            result.append(item)
    return result

@app.patch('/api/attempts/{attempt_id}/review')
def teacher_review(attempt_id: str, data: ReviewIn, request: Request):
    user=user_for_request(request); require_role(user,'teacher')
    with connection() as db:
        row=db.execute('''SELECT a.status,e.teacher_id FROM attempts a JOIN exams e ON e.id=a.exam_id WHERE a.id=?''',(attempt_id,)).fetchone()
        if not row:
            raise HTTPException(404,'Bài làm không tồn tại.')
        if row['teacher_id']!=user['id']:
            raise HTTPException(403,'Không được chấm bài của giáo viên khác.')
        if row['status']!='submitted':
            raise HTTPException(409,'Bài làm chưa nộp.')
        db.execute('UPDATE attempts SET final_score=?,feedback=? WHERE id=?',(data.final_score,data.feedback,attempt_id))
    return {'final_score':data.final_score,'feedback':data.feedback}

@app.get('/api/teacher/summary')
def teacher_summary(request: Request):
    user=user_for_request(request); require_role(user,'teacher')
    with connection() as db:
        c=db.execute('SELECT COUNT(*) n FROM classrooms WHERE teacher_id=?',(user['id'],)).fetchone()['n']
        e=db.execute('SELECT COUNT(*) n FROM exams WHERE teacher_id=?',(user['id'],)).fetchone()['n']
        a=db.execute('''SELECT COUNT(*) n FROM attempts a JOIN exams e ON e.id=a.exam_id
                      WHERE e.teacher_id=? AND a.status=?''',(user['id'], 'submitted')).fetchone()['n']
        s=db.execute('''SELECT COUNT(DISTINCT student_id) n FROM enrollments en JOIN classrooms c ON c.id=en.classroom_id
                      WHERE c.teacher_id=?''',(user['id'],)).fetchone()['n']
        avg=db.execute('''SELECT AVG(a.final_score) v FROM attempts a JOIN exams e ON e.id=a.exam_id
                       WHERE e.teacher_id=? AND a.final_score IS NOT NULL''',(user['id'],)).fetchone()['v']
    return {'classes':c,'exams':e,'submitted':a,'students':s,'average_score':round(avg,2) if avg is not None else None}

FavoriteDomain = Literal['physics', 'chemistry']

@app.get('/api/favorites/{domain}')
def list_favorites(domain: FavoriteDomain, request: Request):
    with connection() as db:
        owner = user_for_request(request, db)['id']
        rows = db.execute('SELECT item_id FROM favorites WHERE owner_id=? AND domain=? ORDER BY item_id',
                          (owner, domain)).fetchall()
    return [row['item_id'] for row in rows]

@app.put('/api/favorites/{domain}/{item_id}')
@app.delete('/api/favorites/{domain}/{item_id}')
def set_favorite(domain: FavoriteDomain, item_id: str, request: Request):
    if len(item_id) > 100:
        raise HTTPException(422, 'Mã mô hình quá dài.')
    with connection() as db:
        owner = user_for_request(request, db)['id']
        params = (owner, domain, item_id)
        if request.method == 'PUT':
            db.execute('INSERT INTO favorites(owner_id,domain,item_id) VALUES (?,?,?) ON CONFLICT DO NOTHING', params)
        else:
            db.execute('DELETE FROM favorites WHERE owner_id=? AND domain=? AND item_id=?', params)
    return {'saved': request.method == 'PUT'}

@app.post('/api/models')
def save_model(data: ModelIn, request: Request):
    user=user_for_request(request)
    content=json.dumps(data.data,ensure_ascii=False)
    if len(content)>120_000:
        raise HTTPException(413,'Mô hình quá lớn.')
    mid=uid()
    with connection() as db:
        db.execute('INSERT INTO saved_models(id,owner_id,title,kind,data_json) VALUES (?,?,?,?,?)',
                   (mid,user['id'],data.title,data.kind,content))
    return {'id':mid,'title':data.title}

@app.get('/api/models')
def list_models(request: Request):
    user=user_for_request(request)
    with connection() as db:
        return [dict(x) for x in db.execute('SELECT id,title,kind,created_at FROM saved_models WHERE owner_id=? ORDER BY created_at DESC',(user['id'],))]

@app.get('/api/models/{model_id}')
def get_model(model_id: str, request: Request):
    user=user_for_request(request)
    with connection() as db:
        row=db.execute('SELECT * FROM saved_models WHERE id=? AND owner_id=?',(model_id,user['id'])).fetchone()
    if not row:
        raise HTTPException(404,'Không tìm thấy mô hình của bạn.')
    item=dict(row); item['data']=json.loads(item.pop('data_json'))
    return item

# AI grading uses real Gemini inference; teacher must review low-confidence/handwriting outcomes.
@app.post('/api/grade')
async def grade_submission(request: Request, work_id: str = Form(...), rubric_id: str = Form(default=''),
                           subject: str = Form(default='Tự động'), grade: int = Form(default=11)):
    user=user_for_request(request)
    if not (1 <= grade <= 12):
        raise HTTPException(422,'Khối lớp không hợp lệ.')
    with connection() as db:
        work=db.execute('SELECT * FROM files WHERE id=? AND owner_id=?',(work_id,user['id'])).fetchone()
        rubric=db.execute('SELECT * FROM files WHERE id=? AND owner_id=?',(rubric_id,user['id'])).fetchone() if rubric_id else None
    if not work:
        raise HTTPException(404,'Không thấy bài làm của bạn.')
    parts=[{'text':f'Môn dự kiến: {subject}, khối {grade}. Hãy kiểm tra bài có đúng môn không trước khi chấm.'}]
    for title,doc in [('Bài học sinh',work),('Barem/đáp án',rubric)]:
        if doc is None: continue
        if doc['kind']=='image':
            raw = await read_object(f'{doc["id"]}{Path(doc["filename"]).suffix.lower()}')
            parts.extend([{'text':f'{title} ({doc["filename"]})'},image_part(raw,doc['mime'])])
        elif doc['mime']=='application/pdf':
            raw = await read_object(f'{doc["id"]}.pdf')
            parts.extend([{'text':f'{title}: {doc["filename"]}'},image_part(raw,'application/pdf')])
        else:
            parts.append({'text':f'{title} ({doc["filename"]}):\n{doc["extracted"]}'})
    instruction='''Bạn là trợ lý chấm bài cho giáo viên Việt Nam; kiểm tra môn học và đề bài trước khi chấm.
Nếu không đủ thông tin đề hoặc ảnh mờ, nói rõ không thể chấm. Nếu có barem của giáo viên PHẢI ưu tiên và trích tiêu chí.
Nếu không có barem, nêu rõ thang điểm dự kiến do AI tự xây dựng, không phải barem chính thức.
Kết quả bằng tiếng Việt: tính hợp lệ, loại thang điểm, điểm từng câu/ý, tổng điểm/10 (nếu đủ dữ kiện), lý do, chỗ chưa chắc chắn, gợi ý sửa.
Không đoán chữ khó đọc; không coi kết quả AI là quyết định cuối cùng. Không tự khẳng định độ chính xác tuyệt đối.'''
    if config.GEMINI_API_KEY: check_ai_quota(user['id'],'grading',4)
    result=await generate(parts,instruction)
    return {'report':result,'has_teacher_rubric':bool(rubric),'warning':'Chấm điểm AI chỉ mang tính hỗ trợ; giáo viên phải kiểm duyệt.'}

# Serve static frontend on same origin, with relative /api calls and no permissive CORS.
FRONTEND = config.ROOT / 'frontend'
if (FRONTEND / 'assets').is_dir():
    app.mount('/assets',StaticFiles(directory=FRONTEND / 'assets'),name='assets')
@app.get('/')
def frontend_index():
    return FileResponse(FRONTEND / 'index.html')

@app.get('/{path:path}',include_in_schema=False)
def spa_fallback(path: str):
    if path.startswith('api/'):
        raise HTTPException(404,'API không tồn tại.')
    return FileResponse(FRONTEND / 'index.html')



