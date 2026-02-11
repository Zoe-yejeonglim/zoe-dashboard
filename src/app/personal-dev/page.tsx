'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
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
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  BookOpen,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

// Types
interface LearningProject {
  id: string
  name: string
  description: string | null
  created_at: string
  is_active: boolean
}

interface LearningRecord {
  id: string
  project_id: string
  content: string
  record_date: string
  progress: number // 0-100
  notes: string | null
  created_at: string
}

export default function PersonalDevPage() {
  const { isAuthenticated } = useAuth()
  const supabase = createClient()

  // State
  const [projects, setProjects] = useState<LearningProject[]>([])
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<LearningProject | null>(null)
  const [editingRecord, setEditingRecord] = useState<LearningRecord | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [recordForm, setRecordForm] = useState({
    content: '',
    record_date: new Date().toISOString().split('T')[0],
    progress: 0,
    notes: ''
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [projectsRes, recordsRes] = await Promise.all([
        supabase.from('learning_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('learning_records').select('*').order('record_date', { ascending: false })
      ])

      if (projectsRes.error) throw projectsRes.error
      if (recordsRes.error) throw recordsRes.error

      setProjects(projectsRes.data || [])
      setRecords(recordsRes.data || [])

      // Auto-expand all projects initially
      if (projectsRes.data) {
        setExpandedProjects(new Set(projectsRes.data.map(p => p.id)))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // Project CRUD
  const openProjectDialog = (project?: LearningProject) => {
    if (project) {
      setEditingProject(project)
      setProjectForm({ name: project.name, description: project.description || '' })
    } else {
      setEditingProject(null)
      setProjectForm({ name: '', description: '' })
    }
    setProjectDialogOpen(true)
  }

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
      if (editingProject) {
        const { error } = await supabase
          .from('learning_projects')
          .update({ name: projectForm.name, description: projectForm.description || null })
          .eq('id', editingProject.id)
        if (error) throw error
        toast.success('板块已更新')
      } else {
        const { error } = await supabase
          .from('learning_projects')
          .insert({ name: projectForm.name, description: projectForm.description || null, is_active: true })
        if (error) throw error
        toast.success('板块已创建')
      }
      setProjectDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('保存失败')
    }
  }

  const deleteProject = async (id: string) => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      return
    }
    if (!confirm('确定要删除这个板块吗？相关的学习记录也会被删除。')) return

    try {
      // Delete related records first
      await supabase.from('learning_records').delete().eq('project_id', id)
      const { error } = await supabase.from('learning_projects').delete().eq('id', id)
      if (error) throw error
      toast.success('板块已删除')
      fetchData()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('删除失败')
    }
  }

  // Record CRUD
  const openRecordDialog = (projectId: string, record?: LearningRecord) => {
    setSelectedProjectId(projectId)
    if (record) {
      setEditingRecord(record)
      setRecordForm({
        content: record.content,
        record_date: record.record_date,
        progress: record.progress,
        notes: record.notes || ''
      })
    } else {
      setEditingRecord(null)
      setRecordForm({
        content: '',
        record_date: new Date().toISOString().split('T')[0],
        progress: 0,
        notes: ''
      })
    }
    setRecordDialogOpen(true)
  }

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
      if (editingRecord) {
        const { error } = await supabase
          .from('learning_records')
          .update({
            content: recordForm.content,
            record_date: recordForm.record_date,
            progress: recordForm.progress,
            notes: recordForm.notes || null
          })
          .eq('id', editingRecord.id)
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
      setRecordDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('保存失败')
    }
  }

  const deleteRecord = async (id: string) => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      return
    }
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const { error } = await supabase.from('learning_records').delete().eq('id', id)
      if (error) throw error
      toast.success('记录已删除')
      fetchData()
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('删除失败')
    }
  }

  // Get records for a specific project
  const getProjectRecords = (projectId: string) => {
    return records.filter(r => r.project_id === projectId)
  }

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-400'
    if (progress < 70) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  // Calculate average progress for a project
  const getProjectProgress = (projectId: string) => {
    const projectRecords = getProjectRecords(projectId)
    if (projectRecords.length === 0) return 0
    return Math.round(projectRecords.reduce((sum, r) => sum + r.progress, 0) / projectRecords.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:pl-60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="个人开发"
            description="记录你的学习进度和成长"
          />

          {/* Add Project Button */}
          <div className="mb-6">
            <Button
              onClick={() => openProjectDialog()}
              className="bg-slate-700 hover:bg-slate-600 text-white"
              disabled={!isAuthenticated}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              添加学习板块
            </Button>
            {!isAuthenticated && (
              <p className="text-sm text-slate-500 mt-2">请登录后添加内容</p>
            )}
          </div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">还没有学习板块</p>
                <p className="text-sm text-slate-400 mt-1">点击上方按钮创建你的第一个学习板块</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <Card key={project.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() => toggleProject(project.id)}
                      >
                        {expandedProjects.has(project.id) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                        <CardTitle className="text-lg text-slate-700">{project.name}</CardTitle>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(getProjectProgress(project.id))} transition-all`}
                              style={{ width: `${getProjectProgress(project.id)}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-500">{getProjectProgress(project.id)}%</span>
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRecordDialog(project.id)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openProjectDialog(project)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProject(project.id)}
                            className="text-slate-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-500 ml-7">{project.description}</p>
                    )}
                  </CardHeader>

                  {expandedProjects.has(project.id) && (
                    <CardContent>
                      {getProjectRecords(project.id).length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">暂无学习记录</p>
                      ) : (
                        <div className="space-y-3">
                          {getProjectRecords(project.id).map(record => (
                            <div
                              key={record.id}
                              className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm text-slate-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {record.record_date}
                                  </span>
                                  <span className="text-sm flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-slate-400" />
                                    <span className={`font-medium ${
                                      record.progress >= 70 ? 'text-green-600' :
                                      record.progress >= 30 ? 'text-yellow-600' : 'text-red-500'
                                    }`}>
                                      {record.progress}%
                                    </span>
                                  </span>
                                </div>
                                <p className="text-slate-700">{record.content}</p>
                                {record.notes && (
                                  <p className="text-sm text-slate-500 mt-1">{record.notes}</p>
                                )}
                              </div>
                              {isAuthenticated && (
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openRecordDialog(project.id, record)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRecord(record.id)}
                                    className="text-slate-400 hover:text-red-500"
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
              ))}
            </div>
          )}

          {/* Project Dialog */}
          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogContent className="sm:max-w-md border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-700">
                  {editingProject ? '编辑板块' : '添加学习板块'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-slate-600">板块名称</Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="例如：Python学习、日语N1备考"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description" className="text-slate-600">描述（可选）</Label>
                  <Textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    placeholder="简单描述这个学习板块的目标"
                    className="border-slate-200"
                    rows={3}
                  />
                </div>
                <Button onClick={saveProject} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Record Dialog */}
          <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
            <DialogContent className="sm:max-w-md border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-700">
                  {editingRecord ? '编辑学习记录' : '添加学习记录'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="record-date" className="text-slate-600">日期</Label>
                  <Input
                    id="record-date"
                    type="date"
                    value={recordForm.record_date}
                    onChange={(e) => setRecordForm({ ...recordForm, record_date: e.target.value })}
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="record-content" className="text-slate-600">学习内容</Label>
                  <Textarea
                    id="record-content"
                    value={recordForm.content}
                    onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })}
                    placeholder="今天学了什么？"
                    className="border-slate-200"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="record-progress" className="text-slate-600">
                    进度：{recordForm.progress}%
                  </Label>
                  <input
                    id="record-progress"
                    type="range"
                    min="0"
                    max="100"
                    value={recordForm.progress}
                    onChange={(e) => setRecordForm({ ...recordForm, progress: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>刚开始</span>
                    <span>进行中</span>
                    <span>已完成</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="record-notes" className="text-slate-600">备注（可选）</Label>
                  <Textarea
                    id="record-notes"
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    placeholder="其他备注信息"
                    className="border-slate-200"
                    rows={2}
                  />
                </div>
                <Button onClick={saveRecord} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
