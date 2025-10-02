DO $$ BEGIN
  CREATE TYPE sector AS ENUM ('SOCIAL','AGRI','CORPORATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('LOW','MEDIUM','HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS bills (
  id           BIGSERIAL PRIMARY KEY,
  rada_id      TEXT UNIQUE NOT NULL,
  number       TEXT,
  title        TEXT NOT NULL,
  status       TEXT,
  url          TEXT NOT NULL,
  sector       sector,
  risk_score   INTEGER NOT NULL DEFAULT 0,
  risk_level   risk_level NOT NULL DEFAULT 'LOW',
  tags         JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_versions (
  id              BIGSERIAL PRIMARY KEY,
  bill_id         BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  content_hash    TEXT NOT NULL,
  content         TEXT NOT NULL,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  diff_from_prev  TEXT,
  UNIQUE (bill_id, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_bills_updated_at ON bills(updated_at);
CREATE INDEX IF NOT EXISTS idx_bills_risk_level ON bills(risk_level);
CREATE INDEX IF NOT EXISTS idx_bill_versions_bill_time ON bill_versions(bill_id, fetched_at);

-- тригер оновлення updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON bills;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bills
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS registered_at DATE;

CREATE INDEX IF NOT EXISTS idx_bills_registered_at
  ON bills(registered_at DESC);

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS law_title TEXT;