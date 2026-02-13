'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getPraise } from '@/lib/praise'
import { FinanceSidejobIncome } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { INCOME_SOURCES } from './constants'

interface SidejobTabProps {
  sidejobIncome: FinanceSidejobIncome[]
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
}

export function SidejobTab({
  sidejobIncome,
  isAuthenticated,
  supabase,
  onDataChange,
}: SidejobTabProps) {
  const [sidejobDialogOpen, setSidejobDialogOpen] = useState(false)
  const [editingSidejob, setEditingSidejob] = useState<FinanceSidejobIncome | null>(null)

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
        toast.success('副业收入已更新 - ' + getPraise('sidejob'))
      } else {
        await supabase.from('sidejob_teaching').insert(data)
        toast.success('副业收入已添加 - ' + getPraise('sidejob'))
      }
      setSidejobDialogOpen(false)
      setEditingSidejob(null)
      onDataChange()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDeleteSidejob = async (item: FinanceSidejobIncome) => {
    if (!confirm('确定删除？')) return
    try {
      await supabase.from('sidejob_teaching').delete().eq('id', item.id)
      toast.success('已删除')
      onDataChange()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>副业收入追踪</CardTitle>
        {isAuthenticated && (
          <Dialog open={sidejobDialogOpen} onOpenChange={setSidejobDialogOpen}>
            <DialogTrigger asChild>
              <Button className="" onClick={() => setEditingSidejob(null)}>
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
                <Button type="submit" className="w-full ">保存</Button>
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
                  <td colSpan={isAuthenticated ? 5 : 4} className="text-center py-8 text-[#75728F]">
                    暂无副业收入记录
                  </td>
                </tr>
              ) : (
                sidejobIncome.map(item => (
                  <tr key={item.id} className="border-b hover:bg-[#992755]/5">
                    <td className="py-2 px-2">{item.date}</td>
                    <td className="py-2 px-2">{item.source}</td>
                    <td className="text-right py-2 px-2 font-medium text-[#34D399]">{item.amount.toLocaleString()}</td>
                    <td className="py-2 px-2 text-[#75728F]">{item.notes || '-'}</td>
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
                <tr className="bg-[#992755]/10 font-medium">
                  <td className="py-2 px-2" colSpan={2}>合计</td>
                  <td className="text-right py-2 px-2 text-[#34D399]">
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
  )
}
