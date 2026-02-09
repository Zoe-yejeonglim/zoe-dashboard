'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Calculator,
  PiggyBank,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

// 支出分类（按照Excel）
const EXPENSE_CATEGORIES = ['工作日餐饮', '休闲餐饮', '娱乐项目', '购物', '美丽基金', '其他']
const INCOME_SOURCES = ['中文老师', '小红书', '其他收入']

const COLORS = ['#F4A4A4', '#FFE4E6', '#E0F2FE', '#D1FAE5', '#FEF3C7', '#E0E7FF']

// Types
interface FixedCost {
  id: string
  name: string
  amount: number
  notes: string | null
  is_active: boolean
}

interface DailyExpense {
  id: string
  expense_date: string
  category: string
  amount: number
  notes: string | null
}

interface MonthlyIncome {
  id: string
  month: string // YYYY-MM
  salary: number
  chinese_teaching: number
  xiaohongshu: number
  other_income: number
}

interface MonthlySaving {
  id: string
  month: string // YYYY-MM format like "2025-01"
  target_amount: number
  actual_amount: number
  notes: string | null
}

interface SidejobIncome {
  id: string
  date: string
  source: string
  amount: number
  notes: string | null
}

interface DebtSettings {
  id: string
  cny_amount: number
  exchange_rate: number
}

interface MonthlySettings {
  id: string
  monthly_salary: number
  target_savings: number
}

export default function FinancePage() {
  // State
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([])
  const [monthlySavings, setMonthlySavings] = useState<MonthlySaving[]>([])
  const [sidejobIncome, setSidejobIncome] = useState<SidejobIncome[]>([])
  const [debtSettings, setDebtSettings] = useState<DebtSettings>({ id: '', cny_amount: 3250, exchange_rate: 190 })
  const [monthlySettings, setMonthlySettings] = useState<MonthlySettings>({ id: '', monthly_salary: 2820000, target_savings: 1000000 })
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [fixedCostDialogOpen, setFixedCostDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false)
  const [sidejobDialogOpen, setSidejobDialogOpen] = useState(false)
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null)
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null)
  const [editingSaving, setEditingSaving] = useState<MonthlySaving | null>(null)
  const [editingSidejob, setEditingSidejob] = useState<SidejobIncome | null>(null)

  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const currentYear = new Date().getFullYear()

  const fetchData = useCallback(async () => {
    try {
      const [fixedRes, expensesRes, savingsRes, sidejobRes, debtRes, settingsRes] = await Promise.all([
        supabase.from('finance_fixed_costs').select('*').eq('is_active', true).order('name'),
        supabase.from('finance_expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('finance_savings').select('*').order('month'),
        supabase.from('sidejob_teaching').select('*').order('date', { ascending: false }),
        supabase.from('finance_debt').select('*').limit(1),
        supabase.from('finance_settings').select('*').limit(1),
      ])

      setFixedCosts(fixedRes.data || [])
      setDailyExpenses(expensesRes.data || [])
      setMonthlySavings(savingsRes.data || [])
      setSidejobIncome(sidejobRes.data?.map(item => ({
        id: item.id,
        date: item.date,
        source: item.student_name || '中文老师',
        amount: item.income,
        notes: item.notes
      })) || [])

      if (debtRes.data && debtRes.data[0]) {
        setDebtSettings({
          id: debtRes.data[0].id,
          cny_amount: debtRes.data[0].original_amount || 3250,
          exchange_rate: debtRes.data[0].interest_rate || 190 // 借用interest_rate字段存汇率
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
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ========== 自动计算部分 ==========

  // 固定支出合计
  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0)

  // 还债金额（韩币）= 人民币 * 汇率
  const debtInKRW = Math.round(debtSettings.cny_amount * debtSettings.exchange_rate)

  // 可支配生活费 = 收入 - 固定支出 - 还债 - 目标储蓄
  const disposableIncome = monthlySettings.monthly_salary - totalFixedCosts - debtInKRW - monthlySettings.target_savings

  // 本月支出（按当前月份筛选）
  // 处理日期格式：可能是字符串 "2026-02-09" 或 Date 对象
  const currentMonthExpenses = dailyExpenses.filter(e => {
    const dateStr = typeof e.expense_date === 'string' ? e.expense_date : new Date(e.expense_date).toISOString().slice(0, 10)
    return dateStr.startsWith(currentMonth)
  })
  const totalCurrentMonthExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Debug: 打印到控制台
  console.log('Current month:', currentMonth)
  console.log('All expenses:', dailyExpenses)
  console.log('Filtered expenses:', currentMonthExpenses)

  // 按分类统计本月支出
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => {
    const amount = currentMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    return { name: cat, value: amount }
  }).filter(item => item.value > 0)

  // 本月已花合计
  const totalSpentThisMonth = expenseByCategory.reduce((sum, item) => sum + item.value, 0)

  // 预计能存 = 可支配生活费 - 本月已花
  const predictedSavings = disposableIncome - totalSpentThisMonth

  // vs 目标差额
  const savingsGap = predictedSavings - monthlySettings.target_savings

  // 能否达标
  const canMeetTarget = predictedSavings >= monthlySettings.target_savings

  // 本月副业收入
  const currentMonthSidejob = sidejobIncome.filter(s => s.date.startsWith(currentMonth))
  const totalSidejobThisMonth = currentMonthSidejob.reduce((sum, s) => sum + s.amount, 0)

  // ========== CRUD 操作 ==========

  // 固定支出
  const handleSaveFixedCost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      amount: parseInt(formData.get('amount') as string) || 0,
      notes: formData.get('notes') as string || null,
      is_active: true,
      category: '固定支出',
      due_day: 1,
    }

    try {
      if (editingFixedCost) {
        await supabase.from('finance_fixed_costs').update(data).eq('id', editingFixedCost.id)
        toast.success('固定支出已更新')
      } else {
        await supabase.from('finance_fixed_costs').insert(data)
        toast.success('固定支出已添加')
      }
      setFixedCostDialogOpen(false)
      setEditingFixedCost(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteFixedCost = async (item: FixedCost) => {
    if (!confirm('确定删除这项固定支出吗？')) return
    try {
      await supabase.from('finance_fixed_costs').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 每日支出
  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      expense_date: formData.get('date') as string,
      category: formData.get('category') as string,
      amount: parseInt(formData.get('amount') as string) || 0,
      notes: formData.get('description') as string || null,
    }

    try {
      if (editingExpense) {
        await supabase.from('finance_expenses').update(data).eq('id', editingExpense.id)
        toast.success('支出已更新')
      } else {
        await supabase.from('finance_expenses').insert(data)
        toast.success('支出已添加')
      }
      setExpenseDialogOpen(false)
      setEditingExpense(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteExpense = async (item: DailyExpense) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_expenses').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 储蓄记录
  const handleSaveSaving = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      month: formData.get('month') as string,
      target_amount: parseInt(formData.get('target_amount') as string) || 1000000,
      actual_amount: parseInt(formData.get('actual_amount') as string) || 0,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editingSaving) {
        await supabase.from('finance_savings').update(data).eq('id', editingSaving.id)
        toast.success('储蓄记录已更新')
      } else {
        await supabase.from('finance_savings').insert(data)
        toast.success('储蓄记录已添加')
      }
      setSavingsDialogOpen(false)
      setEditingSaving(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteSaving = async (item: MonthlySaving) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_savings').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 副业收入
  const handleSaveSidejob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      student_name: formData.get('source') as string,
      income: parseInt(formData.get('amount') as string) || 0,
      hours: 1,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editingSidejob) {
        await supabase.from('sidejob_teaching').update(data).eq('id', editingSidejob.id)
        toast.success('副业收入已更新')
      } else {
        await supabase.from('sidejob_teaching').insert(data)
        toast.success('副业收入已添加')
      }
      setSidejobDialogOpen(false)
      setEditingSidejob(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteSidejob = async (item: SidejobIncome) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('sidejob_teaching').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 更新还债设置
  const handleUpdateDebtSettings = async () => {
    try {
      if (debtSettings.id) {
        await supabase.from('finance_debt').update({
          original_amount: debtSettings.cny_amount,
          interest_rate: debtSettings.exchange_rate,
        }).eq('id', debtSettings.id)
      } else {
        const { data } = await supabase.from('finance_debt').insert({
          name: '留学基金还款',
          original_amount: debtSettings.cny_amount,
          remaining_amount: debtSettings.cny_amount,
          currency: 'CNY',
          interest_rate: debtSettings.exchange_rate,
          monthly_payment: debtSettings.cny_amount * debtSettings.exchange_rate,
        }).select()
        if (data && data[0]) {
          setDebtSettings(prev => ({ ...prev, id: data[0].id }))
        }
      }
      toast.success('还债设置已保存')
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 更新月度设置
  const handleUpdateMonthlySettings = async () => {
    try {
      if (monthlySettings.id) {
        await supabase.from('finance_settings').update({
          monthly_salary: monthlySettings.monthly_salary,
          target_savings: monthlySettings.target_savings,
        }).eq('id', monthlySettings.id)
      } else {
        const { data } = await supabase.from('finance_settings').insert({
          monthly_salary: monthlySettings.monthly_salary,
          target_savings: monthlySettings.target_savings,
        }).select()
        if (data && data[0]) {
          setMonthlySettings(prev => ({ ...prev, id: data[0].id }))
        }
      }
      toast.success('设置已保存')
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 年度储蓄计算
  const yearSavings = monthlySavings.filter(s => s.month.startsWith(String(currentYear)))
  const totalTargetSavings = yearSavings.reduce((sum, s) => sum + s.target_amount, 0)
  const totalActualSavings = yearSavings.reduce((sum, s) => sum + s.actual_amount, 0)

  // 月份列表（用于储蓄追踪）
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    return `${currentYear}-${month}`
  })

  return (
    <div className="space-y-8">
      <PageHeader title="资金规划" description="每月资金规划与储蓄追踪" />

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">每日记账</TabsTrigger>
          <TabsTrigger value="monthly">月度总览</TabsTrigger>
          <TabsTrigger value="savings">储蓄追踪</TabsTrigger>
          <TabsTrigger value="sidejob">副业收入</TabsTrigger>
        </TabsList>

        {/* ========== 每日记账 ========== */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 左侧：固定支出 + 还债 + 月收入概览 */}
            <div className="space-y-6">
              {/* 固定支出 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">固定支出</CardTitle>
                  {isAuthenticated && (
                    <Dialog open={fixedCostDialogOpen} onOpenChange={setFixedCostDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEditingFixedCost(null)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader className="pb-4">
                          <DialogTitle>{editingFixedCost ? '编辑固定支出' : '添加固定支出'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveFixedCost} className="space-y-4">
                          <div>
                            <Label>项目名称</Label>
                            <Input name="name" defaultValue={editingFixedCost?.name || ''} required className="mt-1" />
                          </div>
                          <div>
                            <Label>金额（韩币）</Label>
                            <Input name="amount" type="number" defaultValue={editingFixedCost?.amount || ''} required className="mt-1" />
                          </div>
                          <div>
                            <Label>备注</Label>
                            <Input name="notes" defaultValue={editingFixedCost?.notes || ''} className="mt-1" />
                          </div>
                          <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground border-b pb-2">
                      <span>项目</span>
                      <span className="text-right">金额(韩币)</span>
                      <span className="text-right">操作</span>
                    </div>
                    {fixedCosts.map(item => (
                      <div key={item.id} className="grid grid-cols-3 text-sm py-2 border-b border-dashed">
                        <span>{item.name}</span>
                        <span className="text-right">{item.amount.toLocaleString()}</span>
                        <div className="flex justify-end gap-1">
                          {isAuthenticated && (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingFixedCost(item); setFixedCostDialogOpen(true) }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteFixedCost(item)}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 text-sm font-bold pt-2 bg-gray-50 -mx-6 px-6 py-2">
                      <span>固定支出合计</span>
                      <span className="text-right text-[#F4A4A4]">{totalFixedCosts.toLocaleString()}</span>
                      <span className="text-right text-xs text-muted-foreground">自动计算</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 还债部分 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> 还债（汇率换算）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-sm">
                      <span>人民币金额</span>
                      <Input
                        type="number"
                        value={debtSettings.cny_amount}
                        onChange={(e) => setDebtSettings(prev => ({ ...prev, cny_amount: parseFloat(e.target.value) || 0 }))}
                        className="h-8"
                        disabled={!isAuthenticated}
                      />
                      <span className="text-xs text-muted-foreground ml-2 self-center">每月还款</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span>汇率(CNY→KRW)</span>
                      <Input
                        type="number"
                        value={debtSettings.exchange_rate}
                        onChange={(e) => setDebtSettings(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) || 0 }))}
                        className="h-8"
                        disabled={!isAuthenticated}
                      />
                      <span className="text-xs text-muted-foreground ml-2 self-center">汇率变动时修改</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm font-bold bg-gray-50 -mx-6 px-6 py-2">
                      <span>韩币金额</span>
                      <span className="text-[#F4A4A4]">{debtInKRW.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">自动计算</span>
                    </div>
                    {isAuthenticated && (
                      <Button size="sm" variant="outline" onClick={handleUpdateDebtSettings} className="w-full">
                        保存设置
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 月收入概览 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> 月收入概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-sm">
                      <span>月收入(税后)</span>
                      <Input
                        type="number"
                        value={monthlySettings.monthly_salary}
                        onChange={(e) => setMonthlySettings(prev => ({ ...prev, monthly_salary: parseInt(e.target.value) || 0 }))}
                        className="h-8"
                        disabled={!isAuthenticated}
                      />
                      <span></span>
                    </div>
                    <div className="grid grid-cols-3 text-sm py-1">
                      <span>固定支出合计</span>
                      <span className="text-right font-medium">{totalFixedCosts.toLocaleString()}</span>
                      <span></span>
                    </div>
                    <div className="grid grid-cols-3 text-sm py-1">
                      <span>还债</span>
                      <span className="text-right font-medium">{debtInKRW.toLocaleString()}</span>
                      <span></span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span>目标储蓄</span>
                      <Input
                        type="number"
                        value={monthlySettings.target_savings}
                        onChange={(e) => setMonthlySettings(prev => ({ ...prev, target_savings: parseInt(e.target.value) || 0 }))}
                        className="h-8"
                        disabled={!isAuthenticated}
                      />
                      <span></span>
                    </div>
                    <div className="grid grid-cols-3 text-sm font-bold bg-[#FFE4E6] -mx-6 px-6 py-3 mt-2">
                      <span>可支配生活费</span>
                      <span className="text-[#F4A4A4]">{disposableIncome.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">收入-固定-还债-储蓄</span>
                    </div>
                    {isAuthenticated && (
                      <Button size="sm" variant="outline" onClick={handleUpdateMonthlySettings} className="w-full mt-2">
                        保存设置
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：每日支出明细 + 本月支出统计 + 储蓄预测 */}
            <div className="space-y-6">
              {/* 每日支出明细 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">每日支出明细</CardTitle>
                  {isAuthenticated && (
                    <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingExpense(null)}>
                          <Plus className="h-4 w-4 mr-1" /> 添加
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader className="pb-4">
                          <DialogTitle>{editingExpense ? '编辑支出' : '添加支出'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                          <div>
                            <Label>日期</Label>
                            <Input name="date" type="date" defaultValue={editingExpense?.expense_date || new Date().toISOString().split('T')[0]} required className="mt-1" />
                          </div>
                          <div>
                            <Label>分类</Label>
                            <Select name="category" defaultValue={editingExpense?.category || '其他'}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPENSE_CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>金额（韩币）</Label>
                            <Input name="amount" type="number" defaultValue={editingExpense?.amount || ''} required className="mt-1" />
                          </div>
                          <div>
                            <Label>备注</Label>
                            <Input name="description" defaultValue={editingExpense?.notes || ''} className="mt-1" />
                          </div>
                          <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground border-b pb-2 sticky top-0 bg-white">
                      <span>日期</span>
                      <span>分类</span>
                      <span className="text-right">金额</span>
                      <span className="text-right">操作</span>
                    </div>
                    {currentMonthExpenses.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm">本月暂无支出记录</p>
                    ) : (
                      currentMonthExpenses.map(item => {
                        const dateStr = typeof item.expense_date === 'string' ? item.expense_date : new Date(item.expense_date).toISOString().slice(0, 10)
                        return (
                        <div key={item.id} className="grid grid-cols-4 text-sm py-1.5 border-b border-dashed">
                          <span className="text-xs">{dateStr.slice(5)}</span>
                          <span className="text-xs">{item.category}</span>
                          <span className="text-right text-xs">{item.amount.toLocaleString()}</span>
                          <div className="flex justify-end gap-1">
                            {isAuthenticated && (
                              <>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setEditingExpense(item); setExpenseDialogOpen(true) }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleDeleteExpense(item)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 本月支出统计 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">本月支出统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b pb-2">
                      <span>分类</span>
                      <span className="text-right">已花金额</span>
                      <span className="text-right">占比</span>
                    </div>
                    {EXPENSE_CATEGORIES.map(cat => {
                      const amount = currentMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
                      const percentage = totalSpentThisMonth > 0 ? (amount / totalSpentThisMonth * 100).toFixed(1) : '0'
                      return (
                        <div key={cat} className="grid grid-cols-3 text-sm py-1">
                          <span>{cat}</span>
                          <span className="text-right">{amount.toLocaleString()}</span>
                          <span className="text-right text-muted-foreground">{percentage}%</span>
                        </div>
                      )
                    })}
                    <div className="grid grid-cols-3 text-sm font-bold bg-gray-50 -mx-6 px-6 py-2 mt-2">
                      <span>本月已花合计</span>
                      <span className="text-right text-red-500">{totalSpentThisMonth.toLocaleString()}</span>
                      <span className="text-right">100%</span>
                    </div>
                  </div>

                  {/* 饼图 */}
                  {expenseByCategory.length > 0 && (
                    <div className="h-[200px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* ========== 月度总览 ========== */}
        <TabsContent value="monthly" className="space-y-6">
          {/* 年度汇总卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-[#D1FAE5]">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">年度总收入</p>
                <p className="text-2xl font-bold text-green-700">₩{(monthlySettings.monthly_salary * 12).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FFE4E6]">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">年度总支出</p>
                <p className="text-2xl font-bold text-[#F4A4A4]">₩{((totalFixedCosts + debtInKRW) * 12 + dailyExpenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#E0F2FE]">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">年度还债</p>
                <p className="text-2xl font-bold text-blue-600">₩{(debtInKRW * 12).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#E0E7FF]">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">年度储蓄</p>
                <p className="text-2xl font-bold text-purple-600">₩{totalActualSavings.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* 月度支出柱状图 */}
          <Card>
            <CardHeader>
              <CardTitle>月度支出趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months.map(m => {
                    const monthNum = parseInt(m.slice(5))
                    const expenses = dailyExpenses.filter(e => e.expense_date.startsWith(m)).reduce((sum, e) => sum + e.amount, 0)
                    const fixed = totalFixedCosts
                    const debt = debtInKRW
                    return { month: `${monthNum}月`, 生活支出: expenses, 固定支出: fixed, 还债: debt }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                    <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="生活支出" fill="#F4A4A4" />
                    <Bar dataKey="固定支出" fill="#FFE4E6" />
                    <Bar dataKey="还债" fill="#E0F2FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 三个板块 */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* 生活支出板块 */}
            <Card>
              <CardHeader className="bg-[#FFE4E6] rounded-t-lg">
                <CardTitle className="text-base">生活支出</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map(cat => {
                    const amount = dailyExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
                    return (
                      <div key={cat} className="flex justify-between text-sm">
                        <span>{cat}</span>
                        <span className="font-medium">{amount > 0 ? `₩${amount.toLocaleString()}` : '-'}</span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>合计</span>
                    <span className="text-[#F4A4A4]">₩{dailyExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 固定支出+还债板块 */}
            <Card>
              <CardHeader className="bg-[#E0F2FE] rounded-t-lg">
                <CardTitle className="text-base">固定支出 & 还债</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {fixedCosts.map(cost => (
                    <div key={cost.id} className="flex justify-between text-sm">
                      <span>{cost.name}</span>
                      <span className="font-medium">₩{cost.amount.toLocaleString()}/月</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm">
                    <span className="font-medium">固定支出小计</span>
                    <span className="font-medium">₩{totalFixedCosts.toLocaleString()}/月</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span>留学基金还款</span>
                    <span className="font-medium text-blue-600">₩{debtInKRW.toLocaleString()}/月</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>月度合计</span>
                    <span className="text-blue-600">₩{(totalFixedCosts + debtInKRW).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 储蓄板块 */}
            <Card>
              <CardHeader className="bg-[#E0E7FF] rounded-t-lg">
                <CardTitle className="text-base">储蓄进度</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>年度目标</span>
                    <span className="font-medium">₩{(monthlySettings.target_savings * 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>已储蓄</span>
                    <span className="font-medium text-green-600">₩{totalActualSavings.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div
                      className="bg-purple-500 h-4 rounded-full transition-all"
                      style={{ width: `${Math.min((totalActualSavings / (monthlySettings.target_savings * 12)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    完成 {((totalActualSavings / (monthlySettings.target_savings * 12)) * 100).toFixed(1)}%
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>还需储蓄</span>
                    <span className="text-purple-600">₩{Math.max(0, monthlySettings.target_savings * 12 - totalActualSavings).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== 储蓄追踪 ========== */}
        <TabsContent value="savings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> 储蓄目标追踪
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  年度储蓄目标：₩{(monthlySettings.target_savings * 12).toLocaleString()} （每月{(monthlySettings.target_savings / 10000).toFixed(0)}万 x 12个月）
                </p>
              </div>
              {isAuthenticated && (
                <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingSaving(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 记录储蓄
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingSaving ? '编辑储蓄记录' : '添加储蓄记录'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveSaving} className="space-y-4">
                      <div>
                        <Label>月份</Label>
                        <Input name="month" type="month" defaultValue={editingSaving?.month || currentMonth} required className="mt-1" />
                      </div>
                      <div>
                        <Label>目标金额</Label>
                        <Input name="target_amount" type="number" defaultValue={editingSaving?.target_amount || monthlySettings.target_savings} required className="mt-1" />
                      </div>
                      <div>
                        <Label>实际储蓄</Label>
                        <Input name="actual_amount" type="number" defaultValue={editingSaving?.actual_amount || 0} required className="mt-1" />
                      </div>
                      <div>
                        <Label>备注</Label>
                        <Input name="notes" defaultValue={editingSaving?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">月份</th>
                      <th className="text-right py-2 px-2">目标储蓄</th>
                      <th className="text-right py-2 px-2">实际储蓄</th>
                      <th className="text-right py-2 px-2">累计目标</th>
                      <th className="text-right py-2 px-2">累计实际</th>
                      <th className="text-right py-2 px-2">达成率</th>
                      <th className="text-left py-2 px-2">备注</th>
                      {isAuthenticated && <th className="text-right py-2 px-2">操作</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((m, index) => {
                      const saving = monthlySavings.find(s => s.month === m)
                      const target = monthlySettings.target_savings
                      const actual = saving?.actual_amount || 0
                      const cumulativeTarget = target * (index + 1)
                      const cumulativeActual = monthlySavings
                        .filter(s => s.month <= m)
                        .reduce((sum, s) => sum + s.actual_amount, 0)
                      const rate = cumulativeTarget > 0 ? (cumulativeActual / cumulativeTarget * 100).toFixed(1) : '0'

                      return (
                        <tr key={m} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{parseInt(m.slice(5))}月</td>
                          <td className="text-right py-2 px-2">{target.toLocaleString()}</td>
                          <td className="text-right py-2 px-2 font-medium text-green-600">
                            {actual > 0 ? actual.toLocaleString() : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground">{cumulativeTarget.toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-muted-foreground">{cumulativeActual.toLocaleString()}</td>
                          <td className="text-right py-2 px-2">
                            <span className={parseFloat(rate) >= 100 ? 'text-green-600' : parseFloat(rate) >= 80 ? 'text-yellow-600' : 'text-red-500'}>
                              {rate}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{saving?.notes || '-'}</td>
                          {isAuthenticated && (
                            <td className="text-right py-2 px-2">
                              {saving ? (
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingSaving(saving); setSavingsDialogOpen(true) }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteSaving(saving)}>
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setEditingSaving({ id: '', month: m, target_amount: target, actual_amount: 0, notes: null }); setSavingsDialogOpen(true) }}>
                                  记录
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 年度总结 */}
              <div className="mt-6 p-4 bg-[#FFE4E6] rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">年度目标</p>
                    <p className="text-xl font-bold">₩{(monthlySettings.target_savings * 12).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">已储蓄</p>
                    <p className="text-xl font-bold text-green-600">₩{totalActualSavings.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">完成率</p>
                    <p className="text-xl font-bold text-[#F4A4A4]">
                      {((totalActualSavings / (monthlySettings.target_savings * 12)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== 副业收入 ========== */}
        <TabsContent value="sidejob">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>副业收入追踪</CardTitle>
              {isAuthenticated && (
                <Dialog open={sidejobDialogOpen} onOpenChange={setSidejobDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingSidejob(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加收入
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingSidejob ? '编辑副业收入' : '添加副业收入'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveSidejob} className="space-y-4">
                      <div>
                        <Label>日期</Label>
                        <Input name="date" type="date" defaultValue={editingSidejob?.date || new Date().toISOString().split('T')[0]} required className="mt-1" />
                      </div>
                      <div>
                        <Label>收入来源</Label>
                        <Select name="source" defaultValue={editingSidejob?.source || '中文老师'}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_SOURCES.map(src => (
                              <SelectItem key={src} value={src}>{src}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>金额（韩币）</Label>
                        <Input name="amount" type="number" defaultValue={editingSidejob?.amount || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label>备注</Label>
                        <Input name="notes" defaultValue={editingSidejob?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">日期</th>
                      <th className="text-left py-2 px-2">收入来源</th>
                      <th className="text-right py-2 px-2">金额(韩币)</th>
                      <th className="text-left py-2 px-2">备注</th>
                      {isAuthenticated && <th className="text-right py-2 px-2">操作</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sidejobIncome.length === 0 ? (
                      <tr>
                        <td colSpan={isAuthenticated ? 5 : 4} className="text-center py-8 text-muted-foreground">
                          暂无副业收入记录
                        </td>
                      </tr>
                    ) : (
                      sidejobIncome.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{item.date}</td>
                          <td className="py-2 px-2">{item.source}</td>
                          <td className="text-right py-2 px-2 font-medium text-green-600">{item.amount.toLocaleString()}</td>
                          <td className="py-2 px-2 text-muted-foreground">{item.notes || '-'}</td>
                          {isAuthenticated && (
                            <td className="text-right py-2 px-2">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingSidejob(item); setSidejobDialogOpen(true) }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteSidejob(item)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {sidejobIncome.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td className="py-2 px-2" colSpan={2}>合计</td>
                        <td className="text-right py-2 px-2 text-green-600">
                          ₩{sidejobIncome.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                        </td>
                        <td colSpan={isAuthenticated ? 2 : 1}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
