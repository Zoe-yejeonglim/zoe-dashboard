'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LearningProject } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

interface ProjectFormProps {
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  editing: LearningProject | null
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  projectForm: { name: string; description: string }
  setProjectForm: (form: { name: string; description: string }) => void
}

export function ProjectForm({
  isAuthenticated,
  supabase,
  onDataChange,
  editing,
  dialogOpen,
  setDialogOpen,
  projectForm,
  setProjectForm,
}: ProjectFormProps) {
  const saveProject = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      return
    }
    if (!projectForm.name.trim()) {
      toast.error('请输入板块名称')
      return
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('learning_projects')
          .update({ name: projectForm.name, description: projectForm.description || null })
          .eq('id', editing.id)
        if (error) throw error
        toast.success('板块已更新')
      } else {
        const { error } = await supabase
          .from('learning_projects')
          .insert({ name: projectForm.name, description: projectForm.description || null, is_active: true })
        if (error) throw error
        toast.success('板块已创建')
      }
      setDialogOpen(false)
      onDataChange()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('保存失败')
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md border-[#992755]/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editing ? '编辑板块' : '添加学习板块'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-[#B09FB5]">板块名称</Label>
            <Input
              id="project-name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              placeholder="例如：Python学习、日语N1备考"
              className="border-[#992755]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-[#B09FB5]">描述（可选）</Label>
            <Textarea
              id="project-description"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="简单描述这个学习板块的目标"
              className="border-[#992755]/20"
              rows={3}
            />
          </div>
          <Button onClick={saveProject} className="w-full ">
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
