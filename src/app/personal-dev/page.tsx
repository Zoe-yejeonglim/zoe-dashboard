'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { FolderPlus, BookOpen } from 'lucide-react'
import {
  ProjectCard,
  ProjectForm,
  RecordForm,
  LearningProject,
  LearningRecord,
} from '@/components/personal-dev'

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

  // Open project dialog
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

  // Open record dialog
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#B09FB5]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-8">
      <PageHeader title="个人开发" description="记录你的学习进度和成长" />

      {/* Add Project Button */}
      <div>
        <Button
          onClick={() => openProjectDialog()}
          className=""
          disabled={!isAuthenticated}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          添加学习板块
        </Button>
        {!isAuthenticated && (
          <p className="text-sm text-[#75728F] mt-2">请登录后添加内容</p>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card className="border-[#992755]/20">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-[#992755]/50 mx-auto mb-4" />
            <p className="text-[#75728F]">还没有学习板块</p>
            <p className="text-sm text-[#B09FB5] mt-1">点击上方按钮创建你的第一个学习板块</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              records={records}
              isExpanded={expandedProjects.has(project.id)}
              onToggle={() => toggleProject(project.id)}
              isAuthenticated={isAuthenticated}
              supabase={supabase}
              onDataChange={fetchData}
              onEditProject={openProjectDialog}
              onAddRecord={(projectId) => openRecordDialog(projectId)}
              onEditRecord={openRecordDialog}
            />
          ))}
        </div>
      )}

      {/* Project Dialog */}
      <ProjectForm
        isAuthenticated={isAuthenticated}
        supabase={supabase}
        onDataChange={fetchData}
        editing={editingProject}
        dialogOpen={projectDialogOpen}
        setDialogOpen={setProjectDialogOpen}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
      />

      {/* Record Dialog */}
      <RecordForm
        isAuthenticated={isAuthenticated}
        supabase={supabase}
        onDataChange={fetchData}
        editing={editingRecord}
        selectedProjectId={selectedProjectId}
        dialogOpen={recordDialogOpen}
        setDialogOpen={setRecordDialogOpen}
        recordForm={recordForm}
        setRecordForm={setRecordForm}
      />
    </div>
  )
}
