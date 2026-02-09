'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import {
  GraduationCap,
  Calendar,
  Clock,
  Target,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { OpicDaily } from '@/lib/types'

export default function OpicPage() {
  const [records, setRecords] = useState<OpicDaily[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OpicDaily | null>(null)
  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('opic_daily')
        .select('*')
        .order('date', { ascending: false })
      setRecords(data || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      study_content: formData.get('study_content') as string,
      duration_minutes: parseInt(formData.get('duration_minutes') as string) || 0,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editing) {
        await supabase.from('opic_daily').update(data).eq('id', editing.id)
        toast.success('记录已更新')
      } else {
        await supabase.from('opic_daily').insert(data)
        toast.success('记录已添加')
      }
      setDialogOpen(false)
      setEditing(null)
      fetchRecords()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (record: OpicDaily) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      await supabase.from('opic_daily').delete().eq('id', record.id)
      toast.success('记录已删除')
      fetchRecords()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const totalDays = records.length
  const totalMinutes = records.reduce((sum, r) => sum + r.duration_minutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  // Calculate streak
  const today = new Date()
  let streak = 0
  const sortedDates = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  for (let i = 0; i < sortedDates.length; i++) {
    const recordDate = new Date(sortedDates[i].date)
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    if (recordDate.toDateString() === expectedDate.toDateString()) {
      streak++
    } else {
      break
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="OPIC学习" description="每日学习记录与进度追踪">
        {isAuthenticated && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F4A4A4] hover:bg-[#E89090]" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" /> 添加记录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="pb-4">
                <DialogTitle>{editing ? '编辑记录' : '添加学习记录'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="date">日期</Label>
                  <Input id="date" name="date" type="date" defaultValue={editing?.date || new Date().toISOString().split('T')[0]} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="study_content">学习内容</Label>
                  <Textarea
                    id="study_content"
                    name="study_content"
                    defaultValue={editing?.study_content || ''}
                    placeholder="今天学习了什么？"
                    required
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_minutes">学习时长 (分钟)</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={editing?.duration_minutes || 30} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="notes">笔记/总结</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={editing?.notes || ''}
                    placeholder="学习笔记或心得..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]">保存</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="学习天数" value={totalDays} icon={Calendar} iconClassName="bg-[#FFE4E6]" />
        <StatCard title="总学习时长" value={`${totalHours}小时`} icon={Clock} iconClassName="bg-[#E0F2FE]" />
        <StatCard title="连续打卡" value={`${streak}天`} icon={Target} iconClassName="bg-[#D1FAE5]" />
        <StatCard title="平均每天" value={totalDays > 0 ? `${Math.round(totalMinutes / totalDays)}分钟` : '0分钟'} icon={GraduationCap} iconClassName="bg-[#FEF3C7]" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>学习记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无学习记录，开始你的第一天吧！</p>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">{record.date}</span>
                        <span className="text-sm text-[#F4A4A4]">{record.duration_minutes}分钟</span>
                      </div>
                      <p className="mt-2 font-medium">{record.study_content}</p>
                      {record.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">{record.notes}</p>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(record); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(record)}>
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
    </div>
  )
}
