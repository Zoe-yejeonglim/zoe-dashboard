export interface XiaohongshuNote {
  id: string
  created_at: string
  title: string
  category: string
  post_date: string | null
  impressions: number
  likes: number
  saves: number
  comments: number
  followers_gained: number
  notes: string | null
}

export interface XiaohongshuAction {
  id: string
  created_at: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string | null
  priority: string
}

export interface XiaohongshuMonetization {
  id: string
  created_at: string
  brand: string
  collaboration_type: string
  income: number
  product_value: number
  status: string
  date: string | null
  notes: string | null
}

export interface XiaohongshuGoal {
  id: string
  created_at: string
  goal_type: string
  target_value: number
  current_value: number
  deadline: string | null
  notes: string | null
}

export interface FinanceExpense {
  id: string
  created_at: string
  date: string
  category: string
  amount: number
  description: string | null
  payment_method: string | null
}

export interface FinanceFixedCost {
  id: string
  created_at: string
  name: string
  amount: number
  due_day: number
  category: string
  notes: string | null
  is_active: boolean
}

export interface FinanceSaving {
  id: string
  created_at: string
  month: string
  target_amount: number
  actual_amount: number
  notes: string | null
}

export interface FinanceIncome {
  id: string
  created_at: string
  date: string
  source: string
  amount: number
  category: string
  notes: string | null
}

export interface FinanceSavingsGoal {
  id: string
  created_at: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  priority: number
  notes: string | null
  is_active: boolean
}

export interface FinanceDebt {
  id: string
  created_at: string
  name: string
  original_amount: number
  remaining_amount: number
  currency: string
  interest_rate: number
  monthly_payment: number
  notes: string | null
}

export interface WorkAchievement {
  id: string
  created_at: string
  title: string
  achievement_date: string | null
  category: string
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
  skills: string[] | null
  metrics: string | null
  notes: string | null
}

export interface SidejobTeaching {
  id: string
  created_at: string
  date: string
  student_name: string
  hours: number
  income: number
  notes: string | null
}

export interface SidejobXiaohongshu {
  id: string
  created_at: string
  date: string
  brand: string
  collaboration_type: string
  income: number
  product_value: number
  status: string
  notes: string | null
}

export interface OpicDaily {
  id: string
  created_at: string
  date: string
  study_content: string
  duration_minutes: number
  notes: string | null
}

// Personal Development
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
