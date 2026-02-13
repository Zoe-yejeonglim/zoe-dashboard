'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Calculator, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getPraise } from '@/lib/praise'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  FinanceFixedCost,
  FinanceDailyExpense,
  FinanceDebtSettings,
  FinanceMonthlySettings,
} from '@/lib/types'
import { EXPENSE_CATEGORIES, COLORS } from './constants'

interface DailyTabProps {
  fixedCosts: FinanceFixedCost[]
  dailyExpenses: FinanceDailyExpense[]
  debtSettings: FinanceDebtSettings
  monthlySettings: FinanceMonthlySettings
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  setDebtSettings: (settings: FinanceDebtSettings | ((prev: FinanceDebtSettings) => FinanceDebtSettings)) => void
  setMonthlySettings: (settings: FinanceMonthlySettings | ((prev: FinanceMonthlySettings) => FinanceMonthlySettings)) => void
}

export function DailyTab({
  fixedCosts,
  dailyExpenses,
  debtSettings,
  monthlySettings,
  isAuthenticated,
  supabase,
  onDataChange,
  setDebtSettings,
  setMonthlySettings,
}: DailyTabProps) {
  // Dialog states
  const [fixedCostDialogOpen, setFixedCostDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingFixedCost, setEditingFixedCost] = useState<FinanceFixedCost | null>(null)
  const [editingExpense, setEditingExpense] = useState<FinanceDailyExpense | null>(null)

  const currentMonth = new Date().toISOString().slice(0, 7)

  // 计算
  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0)
  const debtInKRW = Math.round(debtSettings.cny_amount * debtSettings.exchange_rate)
  const disposableIncome = monthlySettings.monthly_salary - totalFixedCosts - debtInKRW - monthlySettings.target_savings

  const currentMonthExpenses = dailyExpenses.filter(e => {
    const dateStr = typeof e.expense_date === 'string' ? e.expense_date : new Date(e.expense_date).toISOString().slice(0, 10)
    return dateStr.startsWith(currentMonth)
  })
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => {
    const amount = currentMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    return { name: cat, value: amount }
  }).filter(item => item.value > 0)

  // CRUD handlers
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
        toast.success('固定支出已更新 - ' + getPraise('expense'))
      } else {
        await supabase.from('finance_fixed_costs').insert(data)
        toast.success('固定支出已添加 - ' + getPraise('expense'))
      }
      setFixedCostDialogOpen(false)
      setEditingFixedCost(null)
      onDataChange()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteFixedCost = async (item: FinanceFixedCost) => {
    if (!confirm('确定删除这项固定支出吗？')) return
    try {
      await supabase.from('finance_fixed_costs').delete().eq('id', item.id)
      toast.success('已删除')
      onDataChange()
    } catch (error) {
      toast.error('删除失败')
    }
  }

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
        toast.success('支出已记录 - ' + getPraise('expense'))
      } else {
        await supabase.from('finance_expenses').insert(data)
        toast.success('记录成功 - ' + getPraise('expense'))
      }
      setExpenseDialogOpen(false)
      setEditingExpense(null)
      onDataChange()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteExpense = async (item: FinanceDailyExpense) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_expenses').delete().eq('id', item.id)
      toast.success('已删除')
      onDataChange()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleUpdateDebtSettings = async () => {
    try {
      if (debtSettings.id) {
        const { error } = await supabase.from('finance_debt').update({
          original_amount: debtSettings.cny_amount,
          interest_rate: debtSettings.exchange_rate,
        }).eq('id', debtSettings.id)
        if (error) {
          toast.error(`保存失败: ${error.message}`)
          return
        }
      } else {
        const { data, error } = await supabase.from('finance_debt').insert({
          name: '留学基金还款',
          original_amount: debtSettings.cny_amount,
          remaining_amount: debtSettings.cny_amount,
          currency: 'CNY',
          interest_rate: debtSettings.exchange_rate,
          monthly_payment: debtSettings.cny_amount * debtSettings.exchange_rate,
        }).select()
        if (error) {
          toast.error(`保存失败: ${error.message}`)
          return
        }
        if (data && data[0]) {
          setDebtSettings(prev => ({ ...prev, id: data[0].id }))
        }
      }
      toast.success('还债设置已保存')
    } catch {
      toast.error('保存失败')
    }
  }

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

  return (
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
                    <Button type="submit" className="w-full ">保存</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 text-sm font-medium text-[#75728F] border-b pb-2">
                <span>项目</span>
                <span className="text-right">金额(韩币)</span>
                <span className="text-right">操作</span>
              </div>
              {fixedCosts.map(item => (
                <div key={item.id} className="grid grid-cols-3 text-sm py-2 border-b border-[#992755]/10">
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
              <div className="grid grid-cols-3 text-sm font-bold pt-2 bg-[#992755]/10 -mx-6 px-6 py-2">
                <span>固定支出合计</span>
                <span className="text-right text-[#C9909A]">{totalFixedCosts.toLocaleString()}</span>
                <span className="text-right text-xs text-[#75728F]">自动计算</span>
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
                <span className="text-xs text-[#75728F] ml-2 self-center">每月还款</span>
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
                <span className="text-xs text-[#75728F] ml-2 self-center">汇率变动时修改</span>
              </div>
              <div className="grid grid-cols-3 text-sm font-bold bg-[#992755]/10 -mx-6 px-6 py-2">
                <span>韩币金额</span>
                <span className="text-[#C9909A]">{debtInKRW.toLocaleString()}</span>
                <span className="text-xs text-[#75728F]">自动计算</span>
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
              <div className="grid grid-cols-3 text-sm font-bold bg-[#992755]/10 -mx-6 px-6 py-3 mt-2">
                <span>可支配生活费</span>
                <span className="text-[#C9909A]">{disposableIncome.toLocaleString()}</span>
                <span className="text-xs text-[#75728F]">收入-固定-还债-储蓄</span>
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

      {/* 右侧：每日支出明细 + 本月支出统计 */}
      <div className="space-y-6">
        {/* 每日支出明细 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">每日支出明细</CardTitle>
            {isAuthenticated && (
              <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="" onClick={() => setEditingExpense(null)}>
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
                    <Button type="submit" className="w-full ">保存</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-4 text-xs font-medium text-[#75728F] border-b pb-2 sticky top-0 bg-[#0D0710]">
                <span>日期</span>
                <span>分类</span>
                <span className="text-right">金额</span>
                <span className="text-right">操作</span>
              </div>
              {currentMonthExpenses.length === 0 ? (
                <p className="text-center text-[#75728F] py-4 text-sm">本月暂无支出记录</p>
              ) : (
                currentMonthExpenses.map(item => {
                  const dateStr = typeof item.expense_date === 'string' ? item.expense_date : new Date(item.expense_date).toISOString().slice(0, 10)
                  return (
                    <div key={item.id} className="grid grid-cols-4 text-sm py-1.5 border-b border-[#992755]/10">
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
              <div className="grid grid-cols-3 text-xs font-medium text-[#75728F] border-b pb-2">
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
                    <span className="text-right text-[#75728F]">{percentage}%</span>
                  </div>
                )
              })}
              <div className="grid grid-cols-3 text-sm font-bold bg-[#992755]/10 -mx-6 px-6 py-2 mt-2">
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
  )
}
