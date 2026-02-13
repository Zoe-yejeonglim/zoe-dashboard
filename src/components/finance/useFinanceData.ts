'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  FinanceFixedCost,
  FinanceDailyExpense,
  FinanceMonthlySaving,
  FinanceSidejobIncome,
  FinanceDebtSettings,
  FinanceMonthlySettings,
  FinanceMonthlyRecord,
} from '@/lib/types'

export function useFinanceData() {
  const [fixedCosts, setFixedCosts] = useState<FinanceFixedCost[]>([])
  const [dailyExpenses, setDailyExpenses] = useState<FinanceDailyExpense[]>([])
  const [monthlySavings, setMonthlySavings] = useState<FinanceMonthlySaving[]>([])
  const [sidejobIncome, setSidejobIncome] = useState<FinanceSidejobIncome[]>([])
  const [monthlyRecords, setMonthlyRecords] = useState<FinanceMonthlyRecord[]>([])
  const [debtSettings, setDebtSettings] = useState<FinanceDebtSettings>({ id: '', cny_amount: 3250, exchange_rate: 190 })
  const [monthlySettings, setMonthlySettings] = useState<FinanceMonthlySettings>({ id: '', monthly_salary: 2820000, target_savings: 1000000 })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      const [fixedRes, expensesRes, savingsRes, sidejobRes, debtRes, settingsRes, monthlyRecordsRes] = await Promise.all([
        supabase.from('finance_fixed_costs').select('*').eq('is_active', true).order('name'),
        supabase.from('finance_expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('finance_savings').select('*').order('month'),
        supabase.from('sidejob_teaching').select('*').order('date', { ascending: false }),
        supabase.from('finance_debt').select('*').limit(1),
        supabase.from('finance_settings').select('*').limit(1),
        supabase.from('finance_monthly_records').select('*').order('month'),
      ])

      setFixedCosts(fixedRes.data || [])
      setDailyExpenses(expensesRes.data || [])
      setMonthlySavings(savingsRes.data || [])
      setMonthlyRecords(monthlyRecordsRes.data || [])
      setSidejobIncome(sidejobRes.data?.map(item => ({
        id: item.id,
        date: item.date,
        source: item.student_name || '中文老师',
        amount: item.income,
        notes: item.notes
      })) || [])

      if (debtRes.data && debtRes.data[0]) {
        const debt = debtRes.data[0]
        setDebtSettings({
          id: debt.id,
          cny_amount: debt.original_amount ?? 3250,
          exchange_rate: debt.interest_rate ?? 190
        })
      }

      if (settingsRes.data && settingsRes.data[0]) {
        setMonthlySettings({
          id: settingsRes.data[0].id,
          monthly_salary: settingsRes.data[0].monthly_salary || 2820000,
          target_savings: settingsRes.data[0].target_savings || 1000000
        })
      }
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
      toast.error('数据加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // Data
    fixedCosts,
    dailyExpenses,
    monthlySavings,
    sidejobIncome,
    monthlyRecords,
    debtSettings,
    monthlySettings,
    loading,
    // Setters
    setDebtSettings,
    setMonthlySettings,
    // Actions
    fetchData,
    supabase,
  }
}
