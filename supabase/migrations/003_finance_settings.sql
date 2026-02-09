-- 创建 finance_settings 表来存储月收入和目标储蓄设置
CREATE TABLE IF NOT EXISTS finance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  monthly_salary INTEGER DEFAULT 2820000,
  target_savings INTEGER DEFAULT 1000000
);

-- 插入默认设置
INSERT INTO finance_settings (monthly_salary, target_savings) VALUES (2820000, 1000000);

-- 启用 RLS
ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "finance_settings_select" ON finance_settings FOR SELECT USING (true);

-- 只有认证用户可以修改
CREATE POLICY "finance_settings_update" ON finance_settings FOR UPDATE USING (auth.role() = 'authenticated');
