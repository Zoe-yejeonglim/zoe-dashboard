'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Briefcase, Calendar, CalendarDays, CalendarClock } from 'lucide-react'
import { WorkAchievement } from '@/lib/types'
import {
  AchievementForm,
  AchievementCard,
  KeywordFilter,
  KeywordManager,
  DEFAULT_KEYWORDS,
} from '@/components/work'

const STORAGE_KEY = 'work_keywords'

export default function WorkPage() {
  const [achievements, setAchievements] = useState<WorkAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkAchievement | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 关键词管理 - 修复：初始化为null，等localStorage加载后再设置
  const [allKeywords, setAllKeywords] = useState<string[] | null>(null)
  const [filterKeyword, setFilterKeyword] = useState<string>('')

  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  // 从localStorage加载关键词
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      // localStorage有值（包括空数组），使用保存的值
      try {
        const parsed = JSON.parse(saved)
        setAllKeywords(Array.isArray(parsed) ? parsed : DEFAULT_KEYWORDS)
      } catch {
        setAllKeywords(DEFAULT_KEYWORDS)
      }
    } else {
      // localStorage没有这个key，首次使用，用默认值
      setAllKeywords(DEFAULT_KEYWORDS)
    }
  }, [])

  // 实际使用的关键词列表（加载前显示空数组防止闪烁）
  const keywords = allKeywords || []

  const saveKeywords = (newKeywords: string[]) => {
    setAllKeywords(newKeywords)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeywords))
  }

  // Extract all unique keywords used in achievements for filtering
  const usedKeywords = useMemo(() => {
    const kws = achievements.flatMap(a => a.skills || [])
    return [...new Set(kws)].sort()
  }, [achievements])

  // Combine managed keywords with used keywords for complete filter list
  const filterKeywords = useMemo(() => {
    const combined = new Set([...keywords, ...usedKeywords])
    return [...combined].sort()
  }, [keywords, usedKeywords])

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('work_achievements')
        .select('*')
        .order('achievement_date', { ascending: false })

      setAchievements(data || [])
    } catch (error) {
      console.error('Failed to fetch work achievements:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEditDialog = (achievement: WorkAchievement) => {
    setEditing(achievement)
    setDialogOpen(true)
  }

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0]

  const totalAchievements = achievements.length
  const thisYearAchievements = achievements.filter(a =>
    a.achievement_date && a.achievement_date >= startOfYear
  ).length
  const thisMonthAchievements = achievements.filter(a =>
    a.achievement_date && a.achievement_date >= startOfMonth
  ).length
  const thisWeekAchievements = achievements.filter(a =>
    a.achievement_date && a.achievement_date >= startOfWeek
  ).length

  const filteredAchievements = filterKeyword
    ? achievements.filter(a => a.skills?.includes(filterKeyword))
    : achievements

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-8">
      <PageHeader title="工作发展" description="STAR法则记录工作成果，积累简历素材">
        {isAuthenticated && (
          <div className="flex gap-2">
            <KeywordManager
              isAuthenticated={isAuthenticated}
              allKeywords={keywords}
              saveKeywords={saveKeywords}
              setFilterKeyword={setFilterKeyword}
            />
            <AchievementForm
              isAuthenticated={isAuthenticated}
              supabase={supabase}
              onDataChange={fetchData}
              allKeywords={keywords}
              editing={editing}
              setEditing={setEditing}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
            />
          </div>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="总成果数" value={totalAchievements} icon={Briefcase} iconClassName="bg-[#FBBF24]/20" />
        <StatCard title="本年" value={thisYearAchievements} icon={Calendar} iconClassName="bg-[#60A5FA]/20" />
        <StatCard title="本月" value={thisMonthAchievements} icon={CalendarDays} iconClassName="bg-[#60A5FA]/20" />
        <StatCard title="本周" value={thisWeekAchievements} icon={CalendarClock} iconClassName="bg-[#A78BFA]/20" />
      </div>

      <KeywordFilter
        achievements={achievements}
        filterKeywords={filterKeywords}
        filterKeyword={filterKeyword}
        setFilterKeyword={setFilterKeyword}
        filteredCount={filteredAchievements.length}
      />

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#992755]/10 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-[#75728F]">
              {filterKeyword ? `没有找到与「${filterKeyword}」相关的成果` : '暂无工作成果记录'}
            </CardContent>
          </Card>
        ) : (
          filteredAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isExpanded={expandedId === achievement.id}
              onToggle={() => setExpandedId(expandedId === achievement.id ? null : achievement.id)}
              isAuthenticated={isAuthenticated}
              supabase={supabase}
              onDataChange={fetchData}
              onEdit={openEditDialog}
            />
          ))
        )}
      </div>
    </div>
  )
}
