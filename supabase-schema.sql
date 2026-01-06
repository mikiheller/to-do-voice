-- Supabase Schema for Voice Todo App
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Items table (flat structure, parent_id creates the hierarchy)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID REFERENCES items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster parent lookups
CREATE INDEX idx_items_parent_id ON items(parent_id);

-- Index for ordering
CREATE INDEX idx_items_position ON items(parent_id, position);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (single user)
-- Later we can add user_id column and proper policies
CREATE POLICY "Allow all operations" ON items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime for items table
ALTER PUBLICATION supabase_realtime ADD TABLE items;

-- Insert sample data
INSERT INTO items (id, content, parent_id, position) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Brendy to do''s', NULL, 0),
  ('00000000-0000-0000-0000-000000000002', 'Clean the ice machine', '00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-000000000003', 'Organize the pantry', '00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-000000000004', 'Karlo to do''s', NULL, 1),
  ('00000000-0000-0000-0000-000000000005', 'Dimmer switches', '00000000-0000-0000-0000-000000000004', 0),
  ('00000000-0000-0000-0000-000000000006', 'Install dimmer switch in closet', '00000000-0000-0000-0000-000000000005', 0),
  ('00000000-0000-0000-0000-000000000007', 'Install dimmer switch in garage', '00000000-0000-0000-0000-000000000005', 1),
  ('00000000-0000-0000-0000-000000000008', 'Things to learn', NULL, 2),
  ('00000000-0000-0000-0000-000000000009', 'Differential equations / linear algebra', '00000000-0000-0000-0000-000000000008', 0),
  ('00000000-0000-0000-0000-000000000010', 'Electrical engineering basics', '00000000-0000-0000-0000-000000000008', 1),
  ('00000000-0000-0000-0000-000000000011', 'Biology', '00000000-0000-0000-0000-000000000008', 2),
  ('00000000-0000-0000-0000-000000000012', 'Miscellaneous', NULL, 3);

