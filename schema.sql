-- D1 schema for contact form submissions (already created in the "lovesciencetoday" database).
-- To recreate: npx wrangler d1 execute lovesciencetoday --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  comments   TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  emailed    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);
-- Read new messages:  SELECT created_at, name, email, comments FROM contact_messages ORDER BY id DESC LIMIT 20;
