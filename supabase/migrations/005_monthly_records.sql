-- 月度记录表：记录每个月实际的固定支出和还债金额
CREATE TABLE IF NOT EXISTS finance_monthly_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  month TEXT NOT NULL UNIQUE, -- 格式: "2026-01", "2026-02" 等
  fixed_costs_total INTEGER NOT NULL DEFAULT 0, -- 当月固定支出总额（韩币）
  debt_payment INTEGER NOT NULL DEFAULT 0, -- 当月还债金额（韩币）
  salary INTEGER NOT NULL DEFAULT 0, -- 当月工资收入（韩币）
  notes TEXT
);

-- 启用 RLS
ALTER TABLE finance_monthly_records ENABLE ROW LEVEL SECURITY;

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "finance_monthly_records_select" ON finance_monthly_records;
DROP POLICY IF EXISTS "finance_monthly_records_insert" ON finance_monthly_records;
DROP POLICY IF EXISTS "finance_monthly_records_update" ON finance_monthly_records;
DROP POLICY IF EXISTS "finance_monthly_records_delete" ON finance_monthly_records;

-- 创建 RLS 策略
CREATE POLICY "finance_monthly_records_select" ON finance_monthly_records FOR SELECT USING (true);
CREATE POLICY "finance_monthly_records_insert" ON finance_monthly_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "finance_monthly_records_update" ON finance_monthly_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "finance_monthly_records_delete" ON finance_monthly_records FOR DELETE USING (auth.role() = 'authenticated');

SELECT '月度记录表创建完成！' as status;
