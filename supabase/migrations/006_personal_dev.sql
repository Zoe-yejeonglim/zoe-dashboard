-- Personal Development Tables
-- 学习板块表
CREATE TABLE IF NOT EXISTS learning_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE learning_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;

-- Policies for learning_projects
CREATE POLICY "Allow public read access on learning_projects" ON learning_projects
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on learning_projects" ON learning_projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on learning_projects" ON learning_projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on learning_projects" ON learning_projects
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for learning_records
CREATE POLICY "Allow public read access on learning_records" ON learning_records
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on learning_records" ON learning_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on learning_records" ON learning_records
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on learning_records" ON learning_records
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_records_project_id ON learning_records(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_record_date ON learning_records(record_date);
