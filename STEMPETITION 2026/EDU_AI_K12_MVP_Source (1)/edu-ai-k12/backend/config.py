"""Server-side configuration. Never send secrets to the browser."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
DB_PATH = Path(os.getenv('DATABASE_PATH', str(ROOT / 'data' / 'education.db'))).resolve()
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', str(ROOT / 'data' / 'uploads'))).resolve()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip()
TEACHER_INVITE_CODE = os.getenv('TEACHER_INVITE_CODE', '').strip()
COOKIE_SECURE = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
SESSION_SECONDS = 7 * 24 * 3600
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
