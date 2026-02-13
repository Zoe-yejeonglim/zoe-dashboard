'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { LearningProject, LearningRecord } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

interface ProjectCardProps {
  project: LearningProject
  records: LearningRecord[]
  isExpanded: boolean
  onToggle: () => void
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  onEditProject: (project: LearningProject) => void
  onAddRecord: (projectId: string) => void
  onEditRecord: (projectId: string, record: LearningRecord) => void
}

export function ProjectCard({
  project,
  records,
  isExpanded,
  onToggle,
  isAuthenticated,
  supabase,
  onDataChange,
  onEditProject,
  onAddRecord,
  onEditRecord,
}: ProjectCardProps) {
  const projectRecords = records.filter(r => r.project_id === project.id)

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-[#EF4444]'
    if (progress < 70) return 'bg-[#FBBF24]'
    return 'bg-gradient-to-r from-[#34D399] to-[#10B981]'
  }

  const getProjectProgress = () => {
    if (projectRecords.length === 0) return 0
    return Math.round(projectRecords.reduce((sum, r) => sum + r.progress, 0) / projectRecords.length)
  }

  const deleteProject = async () => {
    if (!confirm('确定要删除这个板块吗？相关的学习记录也会被删除。')) return
    try {
      await supabase.from('learning_records').delete().eq('project_id', project.id)
      const { error } = await supabase.from('learning_projects').delete().eq('id', project.id)
      if (error) throw error
      toast.success('板块已删除')
      onDataChange()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('删除失败')
    }
  }

  const deleteRecord = async (recordId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      const { error } = await supabase.from('learning_records').delete().eq('id', recordId)
      if (error) throw error
      toast.success('记录已删除')
      onDataChange()
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('删除失败')
    }
  }

  const progress = getProjectProgress()

  return (
    <Card className="border-[#992755]/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-[#75728F]" />
            ) : (
              <ChevronRight className="h-5 w-5 text-[#75728F]" />
            )}
            <CardTitle className="text-lg text-white">{project.name}</CardTitle>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-24 h-2 bg-[#150B18] rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(progress)} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-[#B09FB5]">{progress}%</span>
            </div>
          </div>
          {isAuthenticated && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddRecord(project.id)}
                className="text-[#B09FB5] hover:text-[#C9909A]"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditProject(project)}
                className="text-[#B09FB5] hover:text-[#C9909A]"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteProject}
                className="text-[#B09FB5] hover:text-[#EF4444]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-[#B09FB5] ml-7">{project.description}</p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {projectRecords.length === 0 ? (
            <p className="text-sm text-[#75728F] text-center py-4">暂无学习记录</p>
          ) : (
            <div className="space-y-3">
              {projectRecords.map(record => (
                <div
                  key={record.id}
                  className="flex items-start justify-between p-3 bg-[#992755]/5 rounded-lg border border-[#992755]/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-[#B09FB5] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {record.record_date}
                      </span>
                      <span className="text-sm flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-[#75728F]" />
                        <span className={`font-medium ${
                          record.progress >= 70 ? 'text-[#34D399]' :
                          record.progress >= 30 ? 'text-[#FBBF24]' : 'text-[#EF4444]'
                        }`}>
                          {record.progress}%
                        </span>
                      </span>
                    </div>
                    <p className="text-white">{record.content}</p>
                    {record.notes && (
                      <p className="text-sm text-[#B09FB5] mt-1">{record.notes}</p>
                    )}
                  </div>
                  {isAuthenticated && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRecord(project.id, record)}
                        className="text-[#75728F] hover:text-[#C9909A]"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecord(record.id)}
                        className="text-[#75728F] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
