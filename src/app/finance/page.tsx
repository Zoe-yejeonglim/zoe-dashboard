'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
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
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
} from 'lucide-react'
import { FinanceExpense, FinanceFixedCost, FinanceIncome, FinanceSavingsGoal } from '@/lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '日用', '医疗', '教育', '其他']
const INCOME_CATEGORIES = ['工资', '副业', '投资', '其他']

const COLORS = ['#F4A4A4', '#FFE4E6', '#E0F2FE', '#D1FAE5', '#FEF3C7', '#E0E7FF', '#FCE7F3', '#CCFBF1']

export default function FinancePage() {
  const [expenses, setExpenses] = useState<FinanceExpense[]>([])
  const [fixedCosts, setFixedCosts] = useState<FinanceFixedCost[]>([])
  const [income, setIncome] = useState<FinanceIncome[]>([])
  const [savingsGoals, setSavingsGoals] = useState<FinanceSavingsGoal[]>([])
  const [loading, setLoading] = useState(true)

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(null)
  const [editingIncome, setEditingIncome] = useState<FinanceIncome | null>(null)
  const [editingSavings, setEditingSavings] = useState<FinanceSavingsGoal | null>(null)

  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      const [expensesRes, fixedRes, incomeRes, savingsRes] = await Promise.all([
        supabase.from('finance_expenses').select('*').order('date', { ascending: false }),
        supabase.from('finance_fixed_costs').select('*').order('name'),
        supabase.from('finance_income').select('*').order('date', { ascending: false }),
        supabase.from('finance_savings_goal').select('*').order('priority'),
      ])
      setExpenses(expensesRes.data || [])
      setFixedCosts(fixedRes.data || [])
      setIncome(incomeRes.data || [])
      setSavingsGoals(savingsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth))
  const monthlyIncome = income.filter(i => i.date.startsWith(currentMonth))

  const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalMonthlyIncome = monthlyIncome.reduce((sum, i) => sum + i.amount, 0)
  const totalFixedCosts = fixedCosts.filter(f => f.is_active).reduce((sum, f) => sum + f.amount, 0)
  const totalSavingsTarget = savingsGoals.filter(s => s.is_active).reduce((sum, s) => sum + s.target_amount, 0)
  const totalSavingsCurrent = savingsGoals.filter(s => s.is_active).reduce((sum, s) => sum + s.current_amount, 0)

  // Expense by category for pie chart
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    value: monthlyExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.value > 0)

  // CRUD handlers
  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      description: formData.get('description') as string || null,
      payment_method: formData.get('payment_method') as string || null,
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

  const handleDeleteExpense = async (item: FinanceExpense) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_expenses').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleSaveIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      source: formData.get('source') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      category: formData.get('category') as string,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editingIncome) {
        await supabase.from('finance_income').update(data).eq('id', editingIncome.id)
        toast.success('收入已更新')
      } else {
        await supabase.from('finance_income').insert(data)
        toast.success('收入已添加')
      }
      setIncomeDialogOpen(false)
      setEditingIncome(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteIncome = async (item: FinanceIncome) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_income').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleSaveSavings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      target_amount: parseFloat(formData.get('target_amount') as string) || 0,
      current_amount: parseFloat(formData.get('current_amount') as string) || 0,
      deadline: formData.get('deadline') as string || null,
      priority: parseInt(formData.get('priority') as string) || 1,
      notes: formData.get('notes') as string || null,
      is_active: true,
    }

    try {
      if (editingSavings) {
        await supabase.from('finance_savings_goal').update(data).eq('id', editingSavings.id)
        toast.success('储蓄目标已更新')
      } else {
        await supabase.from('finance_savings_goal').insert(data)
        toast.success('储蓄目标已添加')
      }
      setSavingsDialogOpen(false)
      setEditingSavings(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteSavings = async (item: FinanceSavingsGoal) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('finance_savings_goal').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="资金规划" description="每日记账与储蓄追踪" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="本月支出" value={`¥${totalMonthlyExpense.toLocaleString()}`} icon={CreditCard} iconClassName="bg-[#FFE4E6]" />
        <StatCard title="本月收入" value={`¥${totalMonthlyIncome.toLocaleString()}`} icon={TrendingUp} iconClassName="bg-[#D1FAE5]" />
        <StatCard title="固定支出" value={`¥${totalFixedCosts.toLocaleString()}`} icon={Wallet} iconClassName="bg-[#E0F2FE]" />
        <StatCard title="储蓄进度" value={`${totalSavingsTarget > 0 ? Math.round(totalSavingsCurrent / totalSavingsTarget * 100) : 0}%`} icon={PiggyBank} iconClassName="bg-[#FEF3C7]" />
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">每日记账</TabsTrigger>
          <TabsTrigger value="income">收入记录</TabsTrigger>
          <TabsTrigger value="savings">储蓄目标</TabsTrigger>
          <TabsTrigger value="overview">月度总览</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>每日支出</CardTitle>
              {isAuthenticated && (
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingExpense(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加支出
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingExpense ? '编辑支出' : '添加支出'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveExpense} className="space-y-4">
                      <div>
                        <Label htmlFor="date">日期</Label>
                        <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="category">分类</Label>
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
                        <Label htmlFor="amount">金额 (¥)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="description">描述</Label>
                        <Input id="description" name="description" defaultValue={editingExpense?.description || ''} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="payment_method">支付方式</Label>
                        <Input id="payment_method" name="payment_method" defaultValue={editingExpense?.payment_method || ''} className="mt-1" placeholder="如：微信、支付宝、现金" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无支出记录</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 20).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.description || item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.date} · {item.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-red-500">-¥{item.amount}</span>
                        {isAuthenticated && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingExpense(item); setExpenseDialogOpen(true) }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(item)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> 收入记录
              </CardTitle>
              {isAuthenticated && (
                <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingIncome(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加收入
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingIncome ? '编辑收入' : '添加收入'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveIncome} className="space-y-4">
                      <div>
                        <Label htmlFor="date">日期</Label>
                        <Input id="date" name="date" type="date" defaultValue={editingIncome?.date || new Date().toISOString().split('T')[0]} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="source">来源</Label>
                        <Input id="source" name="source" defaultValue={editingIncome?.source || ''} required className="mt-1" placeholder="如：公司名称" />
                      </div>
                      <div>
                        <Label htmlFor="category">分类</Label>
                        <Select name="category" defaultValue={editingIncome?.category || '其他'}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">金额 (¥)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingIncome?.amount || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="notes">备注</Label>
                        <Input id="notes" name="notes" defaultValue={editingIncome?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : income.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无收入记录</p>
              ) : (
                <div className="space-y-2">
                  {income.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.source}</p>
                        <p className="text-sm text-muted-foreground">{item.date} · {item.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-600">+¥{item.amount}</span>
                        {isAuthenticated && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingIncome(item); setIncomeDialogOpen(true) }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(item)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" /> 储蓄目标
              </CardTitle>
              {isAuthenticated && (
                <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingSavings(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加目标
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingSavings ? '编辑目标' : '添加储蓄目标'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveSavings} className="space-y-4">
                      <div>
                        <Label htmlFor="name">目标名称</Label>
                        <Input id="name" name="name" defaultValue={editingSavings?.name || ''} required className="mt-1" placeholder="如：买房首付、旅行基金" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="target_amount">目标金额 (¥)</Label>
                          <Input id="target_amount" name="target_amount" type="number" defaultValue={editingSavings?.target_amount || ''} required className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="current_amount">当前金额 (¥)</Label>
                          <Input id="current_amount" name="current_amount" type="number" defaultValue={editingSavings?.current_amount || 0} className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="deadline">截止日期</Label>
                          <Input id="deadline" name="deadline" type="date" defaultValue={editingSavings?.deadline || ''} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="priority">优先级</Label>
                          <Input id="priority" name="priority" type="number" min="1" max="10" defaultValue={editingSavings?.priority || 1} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">备注</Label>
                        <Input id="notes" name="notes" defaultValue={editingSavings?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : savingsGoals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无储蓄目标</p>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.filter(g => g.is_active).map(goal => {
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                    return (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{goal.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              ¥{goal.current_amount.toLocaleString()} / ¥{goal.target_amount.toLocaleString()}
                            </span>
                            {isAuthenticated && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingSavings(goal); setSavingsDialogOpen(true) }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteSavings(goal)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-[#F4A4A4] h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                          <span>{Math.round(progress)}% 完成</span>
                          {goal.deadline && <span>截止: {goal.deadline}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>本月支出分布</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">本月暂无支出数据</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `¥${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>本月收支汇总</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span>总收入</span>
                  <span className="font-bold text-green-600">+¥{totalMonthlyIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span>总支出</span>
                  <span className="font-bold text-red-500">-¥{totalMonthlyExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span>固定支出</span>
                  <span className="font-bold text-blue-600">¥{totalFixedCosts.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between p-3 bg-gray-100 rounded-lg">
                    <span className="font-medium">本月结余</span>
                    <span className={`font-bold ${totalMonthlyIncome - totalMonthlyExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ¥{(totalMonthlyIncome - totalMonthlyExpense).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
