'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getPraise } from '@/lib/praise'
import {
  FinanceFixedCost,
  FinanceDailyExpense,
  FinanceMonthlySaving,
  FinanceMonthlySettings,
  FinanceMonthlyRecord,
  FinanceDebtSettings,
} from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'

interface MonthlyTabProps {
  monthlyRecords: FinanceMonthlyRecord[]
  dailyExpenses: FinanceDailyExpense[]
  monthlySavings: FinanceMonthlySaving[]
  monthlySettings: FinanceMonthlySettings
  debtSettings: FinanceDebtSettings
  fixedCosts: FinanceFixedCost[]
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
}

export function MonthlyTab({
  monthlyRecords,
  dailyExpenses,
  monthlySavings,
  monthlySettings,
  debtSettings,
  fixedCosts,
  isAuthenticated,
  supabase,
  onDataChange,
}: MonthlyTabProps) {
  const [monthlyRecordDialogOpen, setMonthlyRecordDialogOpen] = useState(false)
  const [editingMonthlyRecord, setEditingMonthlyRecord] = useState<FinanceMonthlyRecord | null>(null)
  const [editingSaving, setEditingSaving] = useState<number>(0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentYear = new Date().getFullYear()

  // 计算值
  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0)
  const debtInKRW = Math.round(debtSettings.cny_amount * debtSettings.exchange_rate)

  // 年度储蓄计算
  const yearSavings = monthlySavings.filter(s => s.month.startsWith(String(currentYear)))
  const totalActualSavings = yearSavings.reduce((sum, s) => sum + s.actual_amount, 0)

  // 月份列表
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    return `${currentYear}-${month}`
  })

  // 从实际记录计算年度总和
  const yearRecords = monthlyRecords.filter(r => r.month.startsWith(String(currentYear)))
  const yearTotalSalary = yearRecords.reduce((sum, r) => sum + r.salary, 0)
  const yearTotalFixedCosts = yearRecords.reduce((sum, r) => sum + r.fixed_costs_total, 0)
  const yearTotalDebt = yearRecords.reduce((sum, r) => sum + r.debt_payment, 0)
  const yearTotalExpenses = dailyExpenses
    .filter(e => e.expense_date.startsWith(String(currentYear)))
    .reduce((sum, e) => sum + e.amount, 0)

  // 月度记录 CRUD
  const handleSaveMonthlyRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const month = formData.get('month') as string
    const savingAmount = parseInt(formData.get('saving') as string) || 0

    const data = {
      month,
      fixed_costs_total: parseInt(formData.get('fixed_costs_total') as string) || 0,
      debt_payment: parseInt(formData.get('debt_payment') as string) || 0,
      salary: parseInt(formData.get('salary') as string) || 0,
      notes: formData.get('notes') as string || null,
    }

    try {
      // 保存月度记录
      if (editingMonthlyRecord?.id) {
        const { error } = await supabase.from('finance_monthly_records').update(data).eq('id', editingMonthlyRecord.id)
        if (error) {
          toast.error(`更新失败: ${error.message}`)
          return
        }
      } else {
        const { error } = await supabase.from('finance_monthly_records').insert(data)
        if (error) {
          toast.error(`添加失败: ${error.message}`)
          return
        }
      }

      // 保存储蓄记录
      const existingSaving = monthlySavings.find(s => s.month === month)
      if (existingSaving) {
        // 更新现有储蓄记录
        await supabase.from('finance_savings').update({
          actual_amount: savingAmount,
          target_amount: monthlySettings.target_savings,
        }).eq('id', existingSaving.id)
      } else if (savingAmount > 0) {
        // 插入新储蓄记录
        await supabase.from('finance_savings').insert({
          month,
          actual_amount: savingAmount,
          target_amount: monthlySettings.target_savings,
          notes: null,
        })
      }

      toast.success(editingMonthlyRecord?.id ? '月度记录已更新' : '月度记录已添加')
      setMonthlyRecordDialogOpen(false)
      setEditingMonthlyRecord(null)
      setEditingSaving(0)
      onDataChange()
    } catch (error) {
      toast.error('操作失败，请检查数据库表是否存在')
    }
  }

  const handleDeleteMonthlyRecord = async (item: FinanceMonthlyRecord) => {
    if (!confirm('确定删除这个月的记录吗？')) return
    try {
      await supabase.from('finance_monthly_records').delete().eq('id', item.id)
      toast.success('已删除')
      onDataChange()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 年度汇总卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-[#34D399]/20 to-transparent border-[#34D399]/30">
          <CardContent className="p-4">
            <p className="text-sm text-[#B09FB5]">年度总收入</p>
            <p className="text-2xl font-bold text-[#34D399]">₩{yearTotalSalary.toLocaleString()}</p>
            <p className="text-xs text-[#75728F] mt-1">来自{yearRecords.length}个月记录</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#75728F]/20 to-transparent border-[#75728F]/30">
          <CardContent className="p-4">
            <p className="text-sm text-[#B09FB5]">年度固定支出</p>
            <p className="text-2xl font-bold text-[#B09FB5]">₩{yearTotalFixedCosts.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#60A5FA]/20 to-transparent border-[#60A5FA]/30">
          <CardContent className="p-4">
            <p className="text-sm text-[#B09FB5]">年度还债</p>
            <p className="text-2xl font-bold text-[#60A5FA]">₩{yearTotalDebt.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FBBF24]/20 to-transparent border-[#FBBF24]/30">
          <CardContent className="p-4">
            <p className="text-sm text-[#B09FB5]">年度生活支出</p>
            <p className="text-2xl font-bold text-[#FBBF24]">₩{yearTotalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 月度记录表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>月度记录</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">记录每个月的实际收入、固定支出和还债金额</p>
          </div>
          {isAuthenticated && (
            <Dialog open={monthlyRecordDialogOpen} onOpenChange={setMonthlyRecordDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingMonthlyRecord(null); setEditingSaving(0); }}>
                  <Plus className="h-4 w-4 mr-2" /> 添加月度记录
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="pb-4">
                  <DialogTitle>{editingMonthlyRecord?.id ? '编辑月度记录' : '添加月度记录'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveMonthlyRecord} className="space-y-4">
                  <div>
                    <Label>月份</Label>
                    <Input name="month" type="month" defaultValue={editingMonthlyRecord?.month || currentMonth} required className="mt-1" />
                  </div>
                  <div>
                    <Label>当月工资收入（韩币）</Label>
                    <Input name="salary" type="number" defaultValue={editingMonthlyRecord?.salary || monthlySettings.monthly_salary} required className="mt-1" />
                  </div>
                  <div>
                    <Label>当月固定支出总额（韩币）</Label>
                    <Input name="fixed_costs_total" type="number" defaultValue={editingMonthlyRecord?.fixed_costs_total || totalFixedCosts} required className="mt-1" />
                    <p className="text-xs text-[#75728F] mt-1">当前固定支出合计: ₩{totalFixedCosts.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>当月还债金额（韩币）</Label>
                    <Input name="debt_payment" type="number" defaultValue={editingMonthlyRecord?.debt_payment || debtInKRW} required className="mt-1" />
                    <p className="text-xs text-[#75728F] mt-1">当前还债金额: ₩{debtInKRW.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>本月储蓄（韩币）</Label>
                    <Input name="saving" type="number" defaultValue={editingSaving || monthlySettings.target_savings} className="mt-1" />
                    <p className="text-xs text-[#75728F] mt-1">目标储蓄: ₩{monthlySettings.target_savings.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>备注</Label>
                    <Input name="notes" defaultValue={editingMonthlyRecord?.notes || ''} className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full">保存</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#992755]/20">
                  <th className="text-left py-3 px-2 text-[#B09FB5]">月份</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">工资收入</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">固定支出</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">还债</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">生活支出</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">储蓄</th>
                  <th className="text-right py-3 px-2 text-[#B09FB5]">纯结余</th>
                  <th className="text-left py-3 px-2 text-[#B09FB5]">备注</th>
                  {isAuthenticated && <th className="text-right py-3 px-2 text-[#B09FB5]">操作</th>}
                </tr>
              </thead>
              <tbody>
                {months.map(m => {
                  const record = monthlyRecords.find(r => r.month === m)
                  const monthExpenses = dailyExpenses
                    .filter(e => e.expense_date.startsWith(m))
                    .reduce((sum, e) => sum + e.amount, 0)
                  const monthSaving = monthlySavings.find(s => s.month === m)
                  const salary = record?.salary || 0
                  const fixed = record?.fixed_costs_total || 0
                  const debt = record?.debt_payment || 0
                  const saving = monthSaving?.actual_amount || 0
                  const balance = salary - fixed - debt - monthExpenses - saving

                  return (
                    <tr key={m} className="border-b border-[#992755]/10 hover:bg-[#992755]/5 transition-colors">
                      <td className="py-3 px-2 font-medium text-white">{parseInt(m.slice(5))}月</td>
                      <td className="text-right py-3 px-2 text-[#34D399]">
                        {record ? `₩${salary.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right py-3 px-2 text-[#B09FB5]">
                        {record ? `₩${fixed.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right py-3 px-2 text-[#60A5FA]">
                        {record ? `₩${debt.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right py-3 px-2 text-[#FBBF24]">
                        {monthExpenses > 0 ? `₩${monthExpenses.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right py-3 px-2 text-[#A78BFA] font-medium">
                        {saving > 0 ? `₩${saving.toLocaleString()}` : '-'}
                      </td>
                      <td className={`text-right py-3 px-2 font-medium ${balance >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                        {record ? `₩${balance.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-[#75728F] text-xs">{record?.notes || '-'}</td>
                      {isAuthenticated && (
                        <td className="text-right py-2 px-2">
                          {record ? (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingMonthlyRecord(record); setEditingSaving(saving); setMonthlyRecordDialogOpen(true) }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteMonthlyRecord(record)}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setEditingMonthlyRecord({
                                  id: '',
                                  month: m,
                                  fixed_costs_total: totalFixedCosts,
                                  debt_payment: debtInKRW,
                                  salary: monthlySettings.monthly_salary,
                                  notes: null
                                });
                                setEditingSaving(saving);
                                setMonthlyRecordDialogOpen(true)
                              }}
                            >
                              记录
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#992755]/10 font-bold">
                  <td className="py-3 px-2 text-white">年度合计</td>
                  <td className="text-right py-3 px-2 text-[#34D399]">₩{yearTotalSalary.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#B09FB5]">₩{yearTotalFixedCosts.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#60A5FA]">₩{yearTotalDebt.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#FBBF24]">₩{yearTotalExpenses.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#A78BFA]">₩{totalActualSavings.toLocaleString()}</td>
                  <td className={`text-right py-3 px-2 ${yearTotalSalary - yearTotalFixedCosts - yearTotalDebt - yearTotalExpenses - totalActualSavings >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                    ₩{(yearTotalSalary - yearTotalFixedCosts - yearTotalDebt - yearTotalExpenses - totalActualSavings).toLocaleString()}
                  </td>
                  <td colSpan={isAuthenticated ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 柱状图 */}
      <Card>
        <CardHeader>
          <CardTitle>月度支出趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months.map(m => {
                const monthNum = parseInt(m.slice(5))
                const record = monthlyRecords.find(r => r.month === m)
                const monthSaving = monthlySavings.find(s => s.month === m)
                const expenses = dailyExpenses.filter(e => e.expense_date.startsWith(m)).reduce((sum, e) => sum + e.amount, 0)
                return {
                  month: `${monthNum}月`,
                  生活支出: expenses,
                  固定支出: record?.fixed_costs_total || 0,
                  还债: record?.debt_payment || 0,
                  储蓄: monthSaving?.actual_amount || 0
                }
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#992755" opacity={0.2} />
                <XAxis dataKey="month" stroke="#B09FB5" />
                <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} stroke="#B09FB5" />
                <Tooltip
                  formatter={(value) => `₩${Number(value).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0D0710', border: '1px solid rgba(153, 39, 85, 0.3)', borderRadius: '12px' }}
                  labelStyle={{ color: '#B09FB5' }}
                />
                <Legend />
                <Bar dataKey="生活支出" fill="#FBBF24" />
                <Bar dataKey="固定支出" fill="#75728F" />
                <Bar dataKey="还债" fill="#60A5FA" />
                <Bar dataKey="储蓄" fill="#A78BFA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 储蓄进度 */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#A78BFA]/20 to-transparent rounded-t-2xl border-b border-[#992755]/20">
          <CardTitle className="text-base text-white">年度储蓄进度</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-[#75728F]">年度目标</p>
              <p className="text-xl font-bold text-white">₩{(monthlySettings.target_savings * 12).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#75728F]">已储蓄</p>
              <p className="text-xl font-bold text-[#34D399]">₩{totalActualSavings.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#75728F]">完成率</p>
              <p className="text-xl font-bold text-[#A78BFA]">
                {((totalActualSavings / (monthlySettings.target_savings * 12)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#75728F]">还需储蓄</p>
              <p className="text-xl font-bold text-[#FBBF24]">
                ₩{Math.max(0, monthlySettings.target_savings * 12 - totalActualSavings).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-full bg-[#150B18] rounded-full h-4 mt-6">
            <div
              className="bg-gradient-to-r from-[#A78BFA] to-[#C9909A] h-4 rounded-full transition-all shadow-lg shadow-[#A78BFA]/30"
              style={{ width: `${Math.min((totalActualSavings / (monthlySettings.target_savings * 12)) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
