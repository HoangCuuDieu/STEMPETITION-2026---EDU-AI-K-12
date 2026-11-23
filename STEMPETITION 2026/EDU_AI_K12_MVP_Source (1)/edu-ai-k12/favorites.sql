BEGIN;
CREATE TABLE IF NOT EXISTS favorites (
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL CHECK (domain IN ('physics', 'chemistry')),
    item_id TEXT NOT NULL,
    PRIMARY KEY (owner_id, domain, item_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON favorites FROM PUBLIC, anon, authenticated;
COMMIT;
