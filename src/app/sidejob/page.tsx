'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import {
  GraduationCap,
  DollarSign,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { SidejobTeaching, SidejobXiaohongshu } from '@/lib/types'

export default function SidejobPage() {
  const [teaching, setTeaching] = useState<SidejobTeaching[]>([])
  const [xiaohongshu, setXiaohongshu] = useState<SidejobXiaohongshu[]>([])
  const [loading, setLoading] = useState(true)
  const [teachingDialogOpen, setTeachingDialogOpen] = useState(false)
  const [xhsDialogOpen, setXhsDialogOpen] = useState(false)
  const [editingTeaching, setEditingTeaching] = useState<SidejobTeaching | null>(null)
  const [editingXhs, setEditingXhs] = useState<SidejobXiaohongshu | null>(null)
  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      const [teachingRes, xhsRes] = await Promise.all([
        supabase.from('sidejob_teaching').select('*').order('date', { ascending: false }),
        supabase.from('sidejob_xiaohongshu').select('*').order('date', { ascending: false }),
      ])
      setTeaching(teachingRes.data || [])
      setXiaohongshu(xhsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveTeaching = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      student_name: formData.get('student_name') as string,
      hours: parseFloat(formData.get('hours') as string) || 0,
      income: parseFloat(formData.get('income') as string) || 0,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editingTeaching) {
        await supabase.from('sidejob_teaching').update(data).eq('id', editingTeaching.id)
        toast.success('记录已更新')
      } else {
        await supabase.from('sidejob_teaching').insert(data)
        toast.success('记录已添加')
      }
      setTeachingDialogOpen(false)
      setEditingTeaching(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteTeaching = async (item: SidejobTeaching) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await supabase.from('sidejob_teaching').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleSaveXhs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      brand: formData.get('brand') as string,
      collaboration_type: formData.get('collaboration_type') as string,
      income: parseFloat(formData.get('income') as string) || 0,
      product_value: parseFloat(formData.get('product_value') as string) || 0,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editingXhs) {
        await supabase.from('sidejob_xiaohongshu').update(data).eq('id', editingXhs.id)
        toast.success('记录已更新')
      } else {
        await supabase.from('sidejob_xiaohongshu').insert(data)
        toast.success('记录已添加')
      }
      setXhsDialogOpen(false)
      setEditingXhs(null)
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteXhs = async (item: SidejobXiaohongshu) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await supabase.from('sidejob_xiaohongshu').delete().eq('id', item.id)
      toast.success('已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const totalTeachingIncome = teaching.reduce((sum, t) => sum + t.income, 0)
  const totalTeachingHours = teaching.reduce((sum, t) => sum + t.hours, 0)
  const totalXhsIncome = xiaohongshu.reduce((sum, x) => sum + x.income, 0)

  return (
    <div className="space-y-8">
      <PageHeader title="副业" description="中文老师与小红书变现" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="教学收入" value={`¥${totalTeachingIncome.toLocaleString()}`} icon={DollarSign} iconClassName="bg-[#D1FAE5]" />
        <StatCard title="教学时长" value={`${totalTeachingHours}小时`} icon={Clock} iconClassName="bg-[#E0F2FE]" />
        <StatCard title="小红书收入" value={`¥${totalXhsIncome.toLocaleString()}`} icon={DollarSign} iconClassName="bg-[#FFE4E6]" />
        <StatCard title="总收入" value={`¥${(totalTeachingIncome + totalXhsIncome).toLocaleString()}`} icon={DollarSign} iconClassName="bg-[#FEF3C7]" />
      </div>

      <Tabs defaultValue="teaching" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teaching">中文老师</TabsTrigger>
          <TabsTrigger value="xiaohongshu">小红书变现</TabsTrigger>
        </TabsList>

        <TabsContent value="teaching">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> 中文老师记录
              </CardTitle>
              {isAuthenticated && (
                <Dialog open={teachingDialogOpen} onOpenChange={setTeachingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingTeaching(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加记录
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingTeaching ? '编辑记录' : '添加记录'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveTeaching} className="space-y-4">
                      <div>
                        <Label htmlFor="date">日期</Label>
                        <Input id="date" name="date" type="date" defaultValue={editingTeaching?.date || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="student_name">学生</Label>
                        <Input id="student_name" name="student_name" defaultValue={editingTeaching?.student_name || ''} required className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hours">课时</Label>
                          <Input id="hours" name="hours" type="number" step="0.5" defaultValue={editingTeaching?.hours || 0} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="income">收入 (¥)</Label>
                          <Input id="income" name="income" type="number" defaultValue={editingTeaching?.income || 0} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">备注</Label>
                        <Input id="notes" name="notes" defaultValue={editingTeaching?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : teaching.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无记录</p>
              ) : (
                <div className="space-y-2">
                  {teaching.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.student_name}</p>
                        <p className="text-sm text-muted-foreground">{item.date} · {item.hours}小时</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-600">¥{item.income}</span>
                        {isAuthenticated && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingTeaching(item); setTeachingDialogOpen(true) }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTeaching(item)}>
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

        <TabsContent value="xiaohongshu">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>小红书变现记录</CardTitle>
              {isAuthenticated && (
                <Dialog open={xhsDialogOpen} onOpenChange={setXhsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditingXhs(null)}>
                      <Plus className="h-4 w-4 mr-2" /> 添加记录
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="pb-4">
                      <DialogTitle>{editingXhs ? '编辑记录' : '添加记录'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveXhs} className="space-y-4">
                      <div>
                        <Label htmlFor="date">日期</Label>
                        <Input id="date" name="date" type="date" defaultValue={editingXhs?.date || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="brand">品牌</Label>
                        <Input id="brand" name="brand" defaultValue={editingXhs?.brand || ''} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="collaboration_type">合作形式</Label>
                        <Input id="collaboration_type" name="collaboration_type" defaultValue={editingXhs?.collaboration_type || ''} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="income">收入 (¥)</Label>
                          <Input id="income" name="income" type="number" defaultValue={editingXhs?.income || 0} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="product_value">产品价值 (¥)</Label>
                          <Input id="product_value" name="product_value" type="number" defaultValue={editingXhs?.product_value || 0} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="status">状态</Label>
                        <Input id="status" name="status" defaultValue={editingXhs?.status || '进行中'} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="notes">备注</Label>
                        <Input id="notes" name="notes" defaultValue={editingXhs?.notes || ''} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : xiaohongshu.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无记录</p>
              ) : (
                <div className="space-y-2">
                  {xiaohongshu.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.brand}</p>
                        <p className="text-sm text-muted-foreground">{item.date} · {item.collaboration_type} · {item.status}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-600">¥{item.income + item.product_value}</span>
                        {isAuthenticated && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingXhs(item); setXhsDialogOpen(true) }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteXhs(item)}>
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
      </Tabs>
    </div>
  )
}
