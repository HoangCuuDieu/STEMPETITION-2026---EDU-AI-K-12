"""Authentication and role checks. Teacher self-signup requires server invite code."""
import hashlib
from contextlib import nullcontext
import hmac
import secrets
import time
import uuid
from fastapi import HTTPException, Request
from .database import connection
from .config import SESSION_SECONDS

COOKIE_NAME = 'edu_session'

def uid():
    return str(uuid.uuid4())

def make_code(length=8):
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def hash_password(password):
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f'scrypt${salt.hex()}${key.hex()}'

def verify_password(password, stored):
    try:
        method, salt, expected = stored.split('$')
        if method != 'scrypt':
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
        return hmac.compare_digest(actual, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False

def session_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()

def new_session(user_id):
    token = secrets.token_urlsafe(40)
    with connection() as db:
        db.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)',
                   (session_digest(token), user_id, int(time.time())+SESSION_SECONDS))
    return token

def user_for_request(request: Request, db=None):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(401, 'Bạn cần đăng nhập.')
    with (connection() if db is None else nullcontext(db)) as db:
        user = db.execute('''SELECT u.id,u.name,u.email,u.role,u.grade
            FROM users u JOIN sessions s ON u.id=s.user_id
            WHERE s.token_hash=? AND s.expires_at>?''',
            (session_digest(token), int(time.time()))).fetchone()
    if not user:
        raise HTTPException(401, 'Phiên đăng nhập đã hết hạn.')
    return dict(user)

def require_role(user, role):
    if user['role'] != role:
        raise HTTPException(403, 'Bạn không có quyền thực hiện thao tác này.')

