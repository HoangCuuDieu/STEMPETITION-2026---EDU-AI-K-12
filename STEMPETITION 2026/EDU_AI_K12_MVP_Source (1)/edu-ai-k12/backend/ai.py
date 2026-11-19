"""Gemini REST provider; secret remains on server. Provider can be replaced here."""
import base64
import json
import re
import httpx
from fastapi import HTTPException
from .config import GEMINI_API_KEY, GEMINI_MODEL

BASE = 'https://generativelanguage.googleapis.com/v1beta'
TUTOR_INSTRUCTION = '''Bạn là Trợ giảng AI giáo dục K–12 bằng tiếng Việt.
- Nhận diện ý định từ nội dung: học tập, trò chuyện đời thường, chia sẻ cảm xúc, thông tin khác; KHÔNG bắt người dùng chọn chế độ.
- Bài tập: bắt đầu từ kiến thức và gợi mở, gợi ý từng bước, khuyến khích tự suy nghĩ. Khi học sinh yêu cầu lời giải đầy đủ, hãy giải chi tiết chính xác.
- Luôn kiểm tra dữ kiện, phép tính, ký hiệu toán học, không bịa số liệu hay nội dung tệp.
- Hỗ trợ cảm xúc: lắng nghe, không phán xét, không giả làm con người, không khuyến khích phụ thuộc AI. Trong tình huống khẩn cấp, hướng đến người lớn đáng tin cậy và hỗ trợ an toàn.
- Phù hợp lứa tuổi, giữ riêng tư học sinh. Không khẳng định đã đọc nội dung không trích xuất được.
- Không tự nhận có công cụ, truy cập Internet, hay kiểm tra đáp án nếu không có dữ liệu.
'''

async def generate(parts, system_instruction, history=None, json_mode=False):
    if not GEMINI_API_KEY:
        raise HTTPException(503, 'Chưa cấu hình Gemini API. Quản trị viên cần đặt GEMINI_API_KEY trong file .env ở máy chủ.')
    contents = []
    for role, text in (history or []):
        if text.strip():
            contents.append({'role': 'user' if role=='user' else 'model', 'parts':[{'text':text[:7000]}]})
    contents.append({'role':'user','parts':parts})
    body = {
        'systemInstruction': {'parts':[{'text':system_instruction}]},
        'contents': contents,
        'generationConfig': {'temperature': 0.35, 'maxOutputTokens': 3500},
    }
    if json_mode:
        body['generationConfig']['responseMimeType'] = 'application/json'
    try:
        async with httpx.AsyncClient(timeout=75) as client:
            response = await client.post(f'{BASE}/models/{GEMINI_MODEL}:generateContent',
                headers={'x-goog-api-key': GEMINI_API_KEY, 'Content-Type':'application/json'}, json=body)
    except httpx.TimeoutException:
        raise HTTPException(504, 'Gemini phản hồi quá chậm. Vui lòng thử lại.')
    except httpx.HTTPError:
        raise HTTPException(502, 'Không thể kết nối đến Gemini. Kiểm tra mạng máy chủ.')
    if response.status_code != 200:
        messages = {400:'Yêu cầu Gemini không hợp lệ.', 401:'API key bị từ chối (401). Hãy kiểm tra hoặc tạo khóa mới.',
                    403:'Không có quyền dùng mô hình Gemini (403).', 404:'Mô hình Gemini chưa khả dụng; kiểm tra GEMINI_MODEL.',
                    429:'Đã đạt giới hạn sử dụng Gemini (429).', 500:'Gemini đang gặp lỗi máy chủ.',503:'Gemini tạm thời không khả dụng.'}
        raise HTTPException(502, messages.get(response.status_code, f'Gemini trả lỗi HTTP {response.status_code}.'))
    data = response.json()
    chunks = [part.get('text','') for candidate in data.get('candidates', [])
              for part in candidate.get('content',{}).get('parts',[]) if part.get('text')]
    text = '\n'.join(chunks).strip()
    if not text:
        raise HTTPException(502,'Gemini không trả về nội dung (có thể do bộ lọc an toàn).')
    return text

def image_part(content: bytes, mime: str):
    return {'inlineData': {'mimeType': mime, 'data': base64.b64encode(content).decode('ascii')}}

def parse_json_response(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        found = re.search(r'\{.*\}', text, flags=re.DOTALL)
        if found:
            try:
                return json.loads(found.group(0))
            except json.JSONDecodeError:
                pass
    raise HTTPException(502, 'AI chưa trả về dữ liệu cấu trúc hợp lệ. Vui lòng thử lại.')
