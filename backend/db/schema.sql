CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'github')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The `projects` table already existed before `status` was added, so
-- CREATE TABLE IF NOT EXISTS above won't add the column to it — only a
-- brand-new database gets it from the CREATE TABLE. This ALTER TABLE
-- is what actually updates an existing database, and it's safe to
-- re-run (IF NOT EXISTS) if this script runs again later.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'));

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enables the `vector` column type + similarity operators (cosine distance,
-- etc.) used below for the Nik-Blog Assistant's retrieval (RAG) pipeline.
CREATE EXTENSION IF NOT EXISTS vector;

-- One row per indexed chunk of text (a slice of a project description or a
-- note's content) plus its embedding, used for similarity search at query
-- time. Exactly one of project_id / note_id is set per row (never both,
-- never neither) — enforced below, not just assumed.
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    note_id INTEGER REFERENCES notes(id),
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT document_chunks_exactly_one_source CHECK (
        (project_id IS NOT NULL)::INTEGER + (note_id IS NOT NULL)::INTEGER = 1
    )
);

-- Same existing-table situation as `status` above: these ALTERs are what
-- actually add the column to a database that already has these tables.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Lets Nikan hand-pick what shows first on the homepage preview, instead
-- of always being pure recency order.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

-- GitHub's real "last push" time for a project — the Live Pulse data
-- (notes/11), populated by sync-github.js, not hand-entered.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_pushed_at TIMESTAMPTZ;

-- Note category went from a fixed 5-value CHECK to a free-text tag Nikan
-- types himself — he owns keeping the naming consistent, not the schema.
-- This drops the old constraint on a database that already has it (a
-- brand-new database never gets it in the first place, since the
-- CREATE TABLE above no longer declares it).
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_category_check;