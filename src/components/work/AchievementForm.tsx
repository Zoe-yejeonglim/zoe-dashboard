'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Tag, X } from 'lucide-react'
import { getPraise } from '@/lib/praise'
import { WorkAchievement } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { WORK_CATEGORIES } from './constants'

interface AchievementFormProps {
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  allKeywords: string[]
  editing: WorkAchievement | null
  setEditing: (a: WorkAchievement | null) => void
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
}

export function AchievementForm({
  isAuthenticated,
  supabase,
  onDataChange,
  allKeywords,
  editing,
  setEditing,
  dialogOpen,
  setDialogOpen,
}: AchievementFormProps) {
  const [formSkills, setFormSkills] = useState<string[]>(editing?.skills || [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      achievement_date: formData.get('achievement_date') as string || null,
      category: formData.get('category') as string,
      situation: formData.get('situation') as string || null,
      task: formData.get('task') as string || null,
      action: formData.get('action') as string || null,
      result: formData.get('result') as string || null,
      skills: formSkills.length > 0 ? formSkills : null,
      metrics: formData.get('metrics') as string || null,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editing) {
        await supabase.from('work_achievements').update(data).eq('id', editing.id)
        toast.success('成果已更新 - ' + getPraise('work'))
      } else {
        await supabase.from('work_achievements').insert(data)
        toast.success('工作成果已记录 - ' + getPraise('work'))
      }
      setDialogOpen(false)
      setEditing(null)
      setFormSkills([])
      onDataChange()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const openNewDialog = () => {
    setEditing(null)
    setFormSkills([])
    setDialogOpen(true)
  }

  const addKeywordToForm = (keyword: string) => {
    if (!formSkills.includes(keyword)) {
      setFormSkills([...formSkills, keyword])
    }
  }

  const removeKeywordFromForm = (keyword: string) => {
    setFormSkills(formSkills.filter(k => k !== keyword))
  }

  // Sync formSkills when editing changes
  if (editing && formSkills.length === 0 && editing.skills && editing.skills.length > 0) {
    setFormSkills(editing.skills)
  }

  if (!isAuthenticated) return null

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="" onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" /> 添加成果
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">{editing ? '编辑成果' : '添加成果'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-base">成果标题 *</Label>
              <Input id="title" name="title" defaultValue={editing?.title} required className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="achievement_date">时间</Label>
                <Input id="achievement_date" name="achievement_date" type="date" defaultValue={editing?.achievement_date || ''} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="category">分类</Label>
                <Select name="category" defaultValue={editing?.category || '其他'}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-[#992755]/5">
            <Label className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" /> 关键词标签（用于筛选简历素材）
            </Label>
            <div className="flex flex-wrap gap-2">
              {formSkills.map(skill => (
                <Badge key={skill} className="bg-[#C9909A] text-white">
                  {skill}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => removeKeywordFromForm(skill)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {allKeywords.filter(k => !formSkills.includes(k)).map(keyword => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="cursor-pointer hover:bg-[#992755]/10 transition-colors"
                  onClick={() => addKeywordToForm(keyword)}
                >
                  + {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-base">STAR 法则</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="situation" className="text-[#C9909A]">S - Situation（背景情况）</Label>
                <Textarea
                  id="situation"
                  name="situation"
                  placeholder="描述当时的背景和情况..."
                  defaultValue={editing?.situation || ''}
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="task" className="text-[#C9909A]">T - Task（任务目标）</Label>
                <Textarea
                  id="task"
                  name="task"
                  placeholder="你需要完成的任务或目标..."
                  defaultValue={editing?.task || ''}
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="action" className="text-[#C9909A]">A - Action（采取行动）</Label>
                <Textarea
                  id="action"
                  name="action"
                  placeholder="你采取了哪些具体行动..."
                  defaultValue={editing?.action || ''}
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="result" className="text-[#C9909A]">R - Result（成果结果）</Label>
                <Textarea
                  id="result"
                  name="result"
                  placeholder="最终取得了什么成果..."
                  defaultValue={editing?.result || ''}
                  rows={2}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metrics">可量化数据</Label>
              <Input
                id="metrics"
                name="metrics"
                placeholder="如：节省成本20%"
                defaultValue={editing?.metrics || ''}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notes">其他备注</Label>
              <Input id="notes" name="notes" defaultValue={editing?.notes || ''} className="mt-2" />
            </div>
          </div>

          <Button type="submit" className="w-full ">保存</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
