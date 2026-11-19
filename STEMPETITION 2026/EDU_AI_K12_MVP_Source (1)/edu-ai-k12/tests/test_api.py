"""Integration tests run against isolated disposable SQLite, no Gemini credential."""
import os
import pytest
from fastapi.testclient import TestClient
from backend import config
from backend.database import init_db
from backend.main import app

H={'X-Requested-With':'XMLHttpRequest'}

@pytest.fixture()
def clients(tmp_path,monkeypatch):
    monkeypatch.setattr(config,'DB_PATH',tmp_path/'test.db')
    monkeypatch.setattr(config,'UPLOAD_DIR',tmp_path/'uploads')
    config.UPLOAD_DIR.mkdir()
    monkeypatch.setattr(config,'TEACHER_INVITE_CODE','test-invite-code-should-be-server-only')
    monkeypatch.setattr(config,'GEMINI_API_KEY','')
    init_db()
    teacher=TestClient(app)
    student=TestClient(app)
    stranger=TestClient(app)
    tr=teacher.post('/api/auth/register',json={'name':'Giáo viên Lan','email':'lan@example.com','password':'correct-password-2026','role':'teacher','teacher_code':'test-invite-code-should-be-server-only'},headers=H)
    sr=student.post('/api/auth/register',json={'name':'Học sinh An','email':'an@example.com','password':'student-password-2026','role':'student','grade':11},headers=H)
    rr=stranger.post('/api/auth/register',json={'name':'Học sinh Bình','email':'binh@example.com','password':'student-password-2026','role':'student','grade':10},headers=H)
    assert tr.status_code==sr.status_code==rr.status_code==200
    yield teacher, student, stranger
    teacher.close();student.close();stranger.close()

def test_register_role_invite_and_csrf(clients):
    t,s,_=clients
    unauth=TestClient(app)
    assert unauth.post('/api/auth/register',headers=H,json={'name':'Giáo viên lạ','email':'badteacher@example.com','password':'passwordpassword','role':'teacher','teacher_code':'wrong'}).status_code==403
    assert t.post('/api/classes',json={'title':'Unauthorized','grade':11}).status_code==403 # no custom request header
    assert s.post('/api/classes',json={'title':'Unauthorized','grade':11},headers=H).status_code==403
    assert s.get('/api/auth/me').json()['role']=='student'
    assert t.get('/api/auth/me').json()['role']=='teacher'

def test_classroom_isolation(clients):
    t,s,other=clients
    c=t.post('/api/classes',headers=H,json={'title':'11A1','grade':11}).json()
    assert len(c['join_code'])==8
    assert s.post('/api/classes/join',headers=H,json={'code':c['join_code']}).status_code==200
    assert other.get('/api/classes').json()==[]
    members=t.get('/api/classes/'+c['id']+'/students').json()
    assert len(members)==1 and members[0]['name']=='Học sinh An'
    assert s.get('/api/classes/'+c['id']+'/students').status_code==403

def test_file_upload_and_reading(clients):
    t,s,other=clients
    r=s.post('/api/files',headers=H,files={'file':('lesson.txt','Điều kiện xác định là gì?'.encode(),'text/plain')})
    assert r.status_code==200,r.text
    fid=r.json()['id']
    assert r.json()['text_extracted']
    assert other.post('/api/chat',headers=H,json={'message':'Tóm tắt bài này','file_id':fid}).status_code==404
    assert s.post('/api/files',headers=H,files={'file':('virus.exe',b'hello','application/octet-stream')}).status_code==415
    assert s.post('/api/chat',headers=H,json={'message':'Xin chào','grade':11}).status_code==503
    assert len(s.get('/api/chat').json())==0 # do not save a failed response as a real conversation

def exam_example(classroom_id=None):
    return {'title':'Kiểm tra hàm số','subject':'Toán học','grade':11,'duration_minutes':15,'classroom_id':classroom_id,
            'questions':[{'id':'q1','type':'choice','prompt':'2+2=?','options':['3','4','5','6'],'correct':1,'points':5,'explanation':'Phép cộng'},
                         {'id':'q2','type':'boolean','prompt':'5 là số nguyên tố','correct':True,'points':3,'explanation':'5 chỉ có 2 ước dương'},
                         {'id':'q3','type':'short','prompt':'Viết công thức tổng quát','correct':'a+b','points':2}]}

def test_exam_flow_and_answer_secrecy(clients):
    t,s,other=clients
    c=t.post('/api/classes',headers=H,json={'title':'11A3','grade':11}).json()
    s.post('/api/classes/join',headers=H,json={'code':c['join_code']})
    er=t.post('/api/exams',headers=H,json=exam_example(c['id']))
    assert er.status_code==200,er.text
    eid=er.json()['id']
    assert er.json()['status']=='draft'
    assert s.post('/api/exams/join',headers=H,json={'code':'INVALID'}).status_code==404
    pub=t.post('/api/exams/'+eid+'/publish',headers=H).json()
    assert len(pub['access_code'])==10
    assert other.post('/api/exams/join',headers=H,json={'code':pub['access_code']}).status_code==403
    ar=s.post('/api/exams/join',headers=H,json={'code':pub['access_code']}); assert ar.status_code==200
    aid=ar.json()['attempt_id']
    detail=s.get('/api/attempts/'+aid).json()
    assert len(detail['questions'])==3
    assert all('correct' not in q and 'explanation' not in q for q in detail['questions'])
    assert 'correct' not in s.get('/api/exams/'+eid).text
    assert other.get('/api/attempts/'+aid).status_code==404
    assert s.put('/api/attempts/'+aid+'/answers',headers=H,json={'answers':{'q1':1,'q2':True,'q3':'a+b'}}).status_code==200
    assert s.post('/api/attempts/'+aid+'/events',headers=H,json={'event_type':'hidden'}).status_code==200
    result=s.post('/api/attempts/'+aid+'/submit',headers=H).json()
    assert result['status']=='submitted' and result['auto_score']==8.0 and result['final_score'] is None
    assert s.put('/api/attempts/'+aid+'/answers',headers=H,json={'answers':{'q1':0}}).status_code==409
    attempts=t.get('/api/exams/'+eid+'/attempts').json()
    assert attempts[0]['events'][0]['event_type']=='hidden'
    assert other.get('/api/exams/'+eid+'/attempts').status_code==403
    assert t.patch('/api/attempts/'+aid+'/review',headers=H,json={'final_score':9.5,'feedback':'Khá tốt'}).status_code==200
    assert s.get('/api/attempts/'+aid).json()['final_score']==9.5

def test_closed_exam_auto_submit(clients):
    t,s,_=clients
    exam=t.post('/api/exams',headers=H,json=exam_example()).json()
    code=t.post('/api/exams/'+exam['id']+'/publish',headers=H).json()['access_code']
    aid=s.post('/api/exams/join',headers=H,json={'code':code}).json()['attempt_id']
    close=t.post('/api/exams/'+exam['id']+'/close',headers=H)
    assert close.status_code==200 and close.json()['auto_submitted']==1
    assert s.get('/api/attempts/'+aid).json()['status']=='submitted'

def test_invalid_question_rejected(clients):
    t,s,_=clients
    exam=exam_example();exam['questions'][0]['correct']=99
    res=t.post('/api/exams',headers=H,json=exam)
    assert res.status_code==422

def test_frontend_served_without_secret(clients):
    t,s,_=clients
    page=s.get('/')
    assert page.status_code==200
    assert 'EDU AI K-12' in page.text
    assert 'GEMINI_API_KEY' not in page.text
    js=s.get('/assets/app.js')
    assert js.status_code==200
    assert 'AQ.Ab8R' not in js.text
