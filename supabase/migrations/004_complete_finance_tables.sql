-- ============================================
-- 完整的资金规划表结构
-- 请在 Supabase SQL Editor 中运行此文件
-- ============================================

-- 1. 固定支出表
CREATE TABLE IF NOT EXISTS finance_fixed_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  due_day INTEGER DEFAULT 1,
  category TEXT DEFAULT '固定支出',
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 2. 每日支出表
CREATE TABLE IF NOT EXISTS finance_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  payment_method TEXT
);

-- 3. 储蓄记录表
CREATE TABLE IF NOT EXISTS finance_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  month TEXT NOT NULL,
  target_amount INTEGER DEFAULT 1000000,
  actual_amount INTEGER DEFAULT 0,
  notes TEXT
);

-- 4. 副业教学收入表
CREATE TABLE IF NOT EXISTS sidejob_teaching (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  date DATE NOT NULL,
  student_name TEXT NOT NULL,
  hours DECIMAL(4,2) DEFAULT 1,
  income INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- 5. 还债设置表
CREATE TABLE IF NOT EXISTS finance_debt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name TEXT DEFAULT '留学基金还款',
  original_amount DECIMAL(10,2) DEFAULT 3250,
  remaining_amount DECIMAL(10,2) DEFAULT 3250,
  currency TEXT DEFAULT 'CNY',
  interest_rate DECIMAL(6,2) DEFAULT 190,
  monthly_payment DECIMAL(10,2) DEFAULT 617500,
  notes TEXT
);

-- 6. 月度设置表
CREATE TABLE IF NOT EXISTS finance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  monthly_salary INTEGER DEFAULT 2820000,
  target_savings INTEGER DEFAULT 1000000
);

-- ============================================
-- 启用 RLS (Row Level Security)
-- ============================================

ALTER TABLE finance_fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidejob_teaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 删除旧的策略（如果存在）
-- ============================================

DROP POLICY IF EXISTS "finance_fixed_costs_select" ON finance_fixed_costs;
DROP POLICY IF EXISTS "finance_fixed_costs_insert" ON finance_fixed_costs;
DROP POLICY IF EXISTS "finance_fixed_costs_update" ON finance_fixed_costs;
DROP POLICY IF EXISTS "finance_fixed_costs_delete" ON finance_fixed_costs;

DROP POLICY IF EXISTS "finance_expenses_select" ON finance_expenses;
DROP POLICY IF EXISTS "finance_expenses_insert" ON finance_expenses;
DROP POLICY IF EXISTS "finance_expenses_update" ON finance_expenses;
DROP POLICY IF EXISTS "finance_expenses_delete" ON finance_expenses;

DROP POLICY IF EXISTS "finance_savings_select" ON finance_savings;
DROP POLICY IF EXISTS "finance_savings_insert" ON finance_savings;
DROP POLICY IF EXISTS "finance_savings_update" ON finance_savings;
DROP POLICY IF EXISTS "finance_savings_delete" ON finance_savings;

DROP POLICY IF EXISTS "sidejob_teaching_select" ON sidejob_teaching;
DROP POLICY IF EXISTS "sidejob_teaching_insert" ON sidejob_teaching;
DROP POLICY IF EXISTS "sidejob_teaching_update" ON sidejob_teaching;
DROP POLICY IF EXISTS "sidejob_teaching_delete" ON sidejob_teaching;

DROP POLICY IF EXISTS "finance_debt_select" ON finance_debt;
DROP POLICY IF EXISTS "finance_debt_insert" ON finance_debt;
DROP POLICY IF EXISTS "finance_debt_update" ON finance_debt;
DROP POLICY IF EXISTS "finance_debt_delete" ON finance_debt;

DROP POLICY IF EXISTS "finance_settings_select" ON finance_settings;
DROP POLICY IF EXISTS "finance_settings_insert" ON finance_settings;
DROP POLICY IF EXISTS "finance_settings_update" ON finance_settings;

-- ============================================
-- 创建新的 RLS 策略
-- 所有人可读，只有登录用户可写
-- ============================================

-- finance_fixed_costs
CREATE POLICY "finance_fixed_costs_select" ON finance_fixed_costs FOR SELECT USING (true);
CREATE POLICY "finance_fixed_costs_insert" ON finance_fixed_costs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_fixed_costs_update" ON finance_fixed_costs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "finance_fixed_costs_delete" ON finance_fixed_costs FOR DELETE USING (auth.role() = 'authenticated');

-- finance_expenses
CREATE POLICY "finance_expenses_select" ON finance_expenses FOR SELECT USING (true);
CREATE POLICY "finance_expenses_insert" ON finance_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_expenses_update" ON finance_expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "finance_expenses_delete" ON finance_expenses FOR DELETE USING (auth.role() = 'authenticated');

-- finance_savings
CREATE POLICY "finance_savings_select" ON finance_savings FOR SELECT USING (true);
CREATE POLICY "finance_savings_insert" ON finance_savings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_savings_update" ON finance_savings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "finance_savings_delete" ON finance_savings FOR DELETE USING (auth.role() = 'authenticated');

-- sidejob_teaching
CREATE POLICY "sidejob_teaching_select" ON sidejob_teaching FOR SELECT USING (true);
CREATE POLICY "sidejob_teaching_insert" ON sidejob_teaching FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sidejob_teaching_update" ON sidejob_teaching FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sidejob_teaching_delete" ON sidejob_teaching FOR DELETE USING (auth.role() = 'authenticated');

-- finance_debt
CREATE POLICY "finance_debt_select" ON finance_debt FOR SELECT USING (true);
CREATE POLICY "finance_debt_insert" ON finance_debt FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_debt_update" ON finance_debt FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "finance_debt_delete" ON finance_debt FOR DELETE USING (auth.role() = 'authenticated');

-- finance_settings
CREATE POLICY "finance_settings_select" ON finance_settings FOR SELECT USING (true);
CREATE POLICY "finance_settings_insert" ON finance_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_settings_update" ON finance_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 插入默认数据（如果表为空）
-- ============================================

-- 默认固定支出
INSERT INTO finance_fixed_costs (name, amount, notes)
SELECT '手机费', 47000, NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_fixed_costs WHERE name = '手机费');

INSERT INTO finance_fixed_costs (name, amount, notes)
SELECT '交通费', 50000, NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_fixed_costs WHERE name = '交通费');

INSERT INTO finance_fixed_costs (name, amount, notes)
SELECT '仓库', 100000, NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_fixed_costs WHERE name = '仓库');

INSERT INTO finance_fixed_costs (name, amount, notes)
SELECT 'Claude', 40000, NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_fixed_costs WHERE name = 'Claude');

-- 默认还债设置
INSERT INTO finance_debt (name, original_amount, interest_rate)
SELECT '留学基金还款', 3250, 190
WHERE NOT EXISTS (SELECT 1 FROM finance_debt);

-- 默认月度设置
INSERT INTO finance_settings (monthly_salary, target_savings)
SELECT 2820000, 1000000
WHERE NOT EXISTS (SELECT 1 FROM finance_settings);

-- ============================================
-- 完成！
-- ============================================
SELECT '数据库表创建完成！' as status;
