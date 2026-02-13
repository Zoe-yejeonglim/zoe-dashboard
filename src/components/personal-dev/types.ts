export interface LearningProject {
  id: string
  name: string
  description: string | null
  created_at: string
  is_active: boolean
}

export interface LearningRecord {
  id: string
  project_id: string
  content: string
  record_date: string
  progress: number
  notes: string | null
  created_at: string
}
