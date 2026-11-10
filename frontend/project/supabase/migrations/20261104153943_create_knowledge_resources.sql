/*
# Create knowledge_resources table

1. New Tables
- `knowledge_resources`
  - `id` (uuid, primary key)
  - `title` (text, required) - name of the learning resource
  - `resource_type` (text) - one of document, video, article, notes
  - `source_url` (text, optional) - link to the resource
  - `notes` (text, optional) - free-form description
  - `status` (text) - processing state: queued, processing, ready, failed
  - `created_at` (timestamptz) - when the resource was added

2. Security
- Enables row level security on `knowledge_resources`.
- Grants SELECT, INSERT and DELETE to `anon` and `authenticated`, because the app has no sign-in and every visitor works with the same shared library.
- Policies allow anon and authenticated users to read, add and remove resources. No updates are permitted from the client.

3. Notes
- Table is single-tenant and intentionally shared, so the policies use `true`.
- Status checks and resource type checks guard against invalid values.
*/

CREATE TABLE IF NOT EXISTS knowledge_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  resource_type text NOT NULL DEFAULT 'document' CHECK (resource_type IN ('document', 'video', 'article', 'notes')),
  source_url text,
  notes text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_resources_created_at_idx ON knowledge_resources (created_at DESC);

ALTER TABLE knowledge_resources ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON knowledge_resources TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_knowledge_resources" ON knowledge_resources;
CREATE POLICY "anon_select_knowledge_resources" ON knowledge_resources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_knowledge_resources" ON knowledge_resources;
CREATE POLICY "anon_insert_knowledge_resources" ON knowledge_resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_knowledge_resources" ON knowledge_resources;
CREATE POLICY "anon_delete_knowledge_resources" ON knowledge_resources FOR DELETE
  TO anon, authenticated USING (true);
