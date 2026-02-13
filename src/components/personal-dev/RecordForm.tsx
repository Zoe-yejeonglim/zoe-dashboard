'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LearningRecord } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

interface RecordFormProps {
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  editing: LearningRecord | null
  selectedProjectId: string | null
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  recordForm: { content: string; record_date: string; progress: number; notes: string }
  setRecordForm: (form: { content: string; record_date: string; progress: number; notes: string }) => void
}

export function RecordForm({
  isAuthenticated,
  supabase,
  onDataChange,
  editing,
  selectedProjectId,
  dialogOpen,
  setDialogOpen,
  recordForm,
  setRecordForm,
}: RecordFormProps) {
  const saveRecord = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      return
    }
    if (!recordForm.content.trim()) {
      toast.error('请输入学习内容')
      return
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('learning_records')
          .update({
            content: recordForm.content,
            record_date: recordForm.record_date,
            progress: recordForm.progress,
            notes: recordForm.notes || null
          })
          .eq('id', editing.id)
        if (error) throw error
        toast.success('记录已更新')
      } else {
        const { error } = await supabase
          .from('learning_records')
          .insert({
            project_id: selectedProjectId,
            content: recordForm.content,
            record_date: recordForm.record_date,
            progress: recordForm.progress,
            notes: recordForm.notes || null
          })
        if (error) throw error
        toast.success('记录已添加')
      }
      setDialogOpen(false)
      onDataChange()
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('保存失败')
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md border-[#992755]/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editing ? '编辑学习记录' : '添加学习记录'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="record-date" className="text-[#B09FB5]">日期</Label>
            <Input
              id="record-date"
              type="date"
              value={recordForm.record_date}
              onChange={(e) => setRecordForm({ ...recordForm, record_date: e.target.value })}
              className="border-[#992755]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="record-content" className="text-[#B09FB5]">学习内容</Label>
            <Textarea
              id="record-content"
              value={recordForm.content}
              onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })}
              placeholder="今天学了什么？"
              className="border-[#992755]/20"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="record-progress" className="text-[#B09FB5]">
              进度：{recordForm.progress}%
            </Label>
            <input
              id="record-progress"
              type="range"
              min="0"
              max="100"
              value={recordForm.progress}
              onChange={(e) => setRecordForm({ ...recordForm, progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#150B18] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#75728F]">
              <span>刚开始</span>
              <span>进行中</span>
              <span>已完成</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="record-notes" className="text-[#B09FB5]">备注（可选）</Label>
            <Textarea
              id="record-notes"
              value={recordForm.notes}
              onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
              placeholder="其他备注信息"
              className="border-[#992755]/20"
              rows={2}
            />
          </div>
          <Button onClick={saveRecord} className="w-full ">
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
