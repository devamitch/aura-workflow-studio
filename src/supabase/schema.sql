-- ============================================================
-- Aura AI — Supabase Database Schema
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  is_premium  BOOLEAN DEFAULT FALSE,
  is_admin    BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role has full access to users"
  ON users FOR ALL USING (auth.role() = 'service_role');

-- ── User API Keys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_api_keys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL DEFAULT 'gemini',
  encrypted_key TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages api keys"
  ON user_api_keys FOR ALL USING (auth.role() = 'service_role');

-- ── Pipelines ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  graph       JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  node_count  INT DEFAULT 0,
  edge_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pipelines"
  ON pipelines FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all pipelines"
  ON pipelines FOR ALL USING (auth.role() = 'service_role');

-- ── Documents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  chunk_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents"
  ON documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all documents"
  ON documents FOR ALL USING (auth.role() = 'service_role');

-- ── Document Chunks (pgvector) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  text        TEXT NOT NULL,
  embedding   VECTOR(1536),  -- OpenAI text-embedding-3-small / Gemini embedding-001
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages chunks"
  ON document_chunks FOR ALL USING (auth.role() = 'service_role');

-- IVFFlat index for fast similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── pgvector RPC: semantic similarity search ──────────────────────────────────
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_count     INT DEFAULT 5,
  user_id_filter  UUID DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  document_id UUID,
  text        TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.text,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  INNER JOIN documents d ON d.id = dc.document_id
  WHERE (user_id_filter IS NULL OR d.user_id = user_id_filter)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── Updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DONE. Tables: users, user_api_keys, pipelines, documents, document_chunks
-- ============================================================
