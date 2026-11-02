-- Sana Digital D1 schema. Patient data is encrypted at the application layer (AES-256-GCM).
-- Do not store names, DOB, diagnoses, signatures or contact information as unencrypted columns.
CREATE TABLE IF NOT EXISTS intakes (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed','archived')),
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_intakes_created_at ON intakes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intakes_status_date ON intakes (status, created_at DESC);
