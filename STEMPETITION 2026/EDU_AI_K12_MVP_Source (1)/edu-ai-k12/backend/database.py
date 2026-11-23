"""Small, parameterized SQLite data layer. One connection per transaction."""
import os
import sqlite3
from contextlib import contextmanager
from . import config

USE_POSTGRES = os.getenv('DB_BACKEND') == 'postgres'
CHAT_ORDER_COLUMN = 'message_order' if USE_POSTGRES else 'rowid'


class PostgresConnection:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, params=()):
        return self.conn.execute(sql.replace('?', '%s'), params)

SCHEMA = '''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','teacher')),
 grade INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS classrooms (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES users(id),
 title TEXT NOT NULL, grade INTEGER NOT NULL, join_code TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS enrollments (
 classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY(classroom_id,student_id)
);
CREATE TABLE IF NOT EXISTS files (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
 filename TEXT NOT NULL, mime TEXT NOT NULL, kind TEXT NOT NULL,
 extracted TEXT, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_messages (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
 role TEXT NOT NULL CHECK(role IN ('user','assistant')),
 content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS favorites (
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL CHECK (domain IN ('physics', 'chemistry')),
    item_id TEXT NOT NULL,
    PRIMARY KEY (owner_id, domain, item_id)
);
CREATE TABLE IF NOT EXISTS saved_models (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
 title TEXT NOT NULL, kind TEXT NOT NULL, data_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exams (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES users(id),
 classroom_id TEXT REFERENCES classrooms(id), title TEXT NOT NULL,
 subject TEXT NOT NULL, grade INTEGER NOT NULL, duration_minutes INTEGER NOT NULL,
 questions_json TEXT NOT NULL, access_code TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES exams(id),
 student_id TEXT NOT NULL REFERENCES users(id), answers_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','submitted')),
 started_at INTEGER NOT NULL, submitted_at INTEGER,
 auto_score REAL, final_score REAL, feedback TEXT,
 UNIQUE(exam_id,student_id)
);
CREATE TABLE IF NOT EXISTS exam_events (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL, occurred_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_usage (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, used_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id,kind,used_at);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exam_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attempt_exam ON attempts(exam_id);
'''

@contextmanager
def connection():
    if USE_POSTGRES:
        import psycopg
        from psycopg.rows import dict_row

        with psycopg.connect(
            os.environ['DATABASE_URL'],
            connect_timeout=5,
            sslmode='require',
            prepare_threshold=None,
            row_factory=dict_row,
        ) as conn:
            yield PostgresConnection(conn)
        return
     
    conn = sqlite3.connect(config.DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA busy_timeout = 10000')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    if USE_POSTGRES:
        return
    with connection() as db:
        db.executescript(SCHEMA)

