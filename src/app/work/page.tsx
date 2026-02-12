'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { getPraise } from '@/lib/praise'
import {
  Briefcase,
  Plus,
  Calendar,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
  Filter,
  Settings,
} from 'lucide-react'
import { WorkAchievement } from '@/lib/types'

const WORK_CATEGORIES = ['B2G项目', '翻译', '展会', '数据分析', '其他']

const DEFAULT_KEYWORDS = [
  '项目管理', '数据分析', '沟通协调', '报告撰写', '翻译',
  'Excel', 'PPT', '客户对接', '团队协作', '问题解决'
]

export default function WorkPage() {
  const [achievements, setAchievements] = useState<WorkAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkAchievement | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [allKeywords, setAllKeywords] = useState<string[]>(DEFAULT_KEYWORDS)
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  const [formSkills, setFormSkills] = useState<string[]>([])

  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  // Extract all unique keywords used in achievements for filtering
  const usedKeywords = useMemo(() => {
    const keywords = achievements.flatMap(a => a.skills || [])
    return [...new Set(keywords)].sort()
  }, [achievements])

  useEffect(() => {
    const saved = localStorage.getItem('work_keywords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllKeywords(parsed)
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [])

  const saveKeywords = (keywords: string[]) => {
    setAllKeywords(keywords)
    localStorage.setItem('work_keywords', JSON.stringify(keywords))
  }

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('work_achievements')
        .select('*')
        .order('achievement_date', { ascending: false })

      setAchievements(data || [])
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      fetchData()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (item: WorkAchievement) => {
    if (!confirm('确定要删除这条成果记录吗？')) return
    try {
      await supabase.from('work_achievements').delete().eq('id', item.id)
      toast.success('成果已删除')
      fetchData()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const openEditDialog = (achievement: WorkAchievement) => {
    setEditing(achievement)
    setFormSkills(achievement.skills || [])
    setDialogOpen(true)
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

  const addNewKeyword = () => {
    if (newKeyword.trim() && !allKeywords.includes(newKeyword.trim())) {
      saveKeywords([...allKeywords, newKeyword.trim()].sort())
      setNewKeyword('')
      toast.success('关键词已添加')
    }
  }

  const deleteKeyword = (keyword: string) => {
    saveKeywords(allKeywords.filter(k => k !== keyword))
    setFilterKeyword('')
    toast.success('关键词已删除')
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
    <div className="space-y-8">
      <PageHeader title="工作发展" description="STAR法则记录工作成果，积累简历素材">
        {isAuthenticated && (
          <div className="flex gap-2">
            <Dialog open={keywordDialogOpen} onOpenChange={setKeywordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" /> 管理关键词
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="pb-4">管理关键词标签</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>添加新关键词</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="输入新关键词"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewKeyword())}
                      />
                      <Button onClick={addNewKeyword} className="bg-slate-800 hover:bg-slate-700 text-white">
                        添加
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>现有关键词（点击删除）</Label>
                    <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                      {allKeywords.map(keyword => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                          onClick={() => deleteKeyword(keyword)}
                        >
                          {keyword} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">点击关键词可删除</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700 text-white" onClick={openNewDialog}>
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

                  <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                    <Label className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" /> 关键词标签（用于筛选简历素材）
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formSkills.map(skill => (
                        <Badge key={skill} className="bg-sky-500 text-white">
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
                          className="cursor-pointer hover:bg-sky-100 transition-colors"
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
                        <Label htmlFor="situation" className="text-sky-500">S - Situation（背景情况）</Label>
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
                        <Label htmlFor="task" className="text-sky-500">T - Task（任务目标）</Label>
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
                        <Label htmlFor="action" className="text-sky-500">A - Action（采取行动）</Label>
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
                        <Label htmlFor="result" className="text-sky-500">R - Result（成果结果）</Label>
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

                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white">保存</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="总成果数" value={totalAchievements} icon={Briefcase} iconClassName="bg-amber-100" />
        <StatCard title="本年" value={thisYearAchievements} icon={Calendar} iconClassName="bg-sky-100" />
        <StatCard title="本月" value={thisMonthAchievements} icon={CalendarDays} iconClassName="bg-sky-100" />
        <StatCard title="本周" value={thisWeekAchievements} icon={CalendarClock} iconClassName="bg-indigo-100" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> 按关键词筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filterKeyword === '' ? 'default' : 'outline'}
              className={`cursor-pointer ${filterKeyword === '' ? 'bg-sky-500' : 'hover:bg-sky-100'}`}
              onClick={() => setFilterKeyword('')}
            >
              全部
            </Badge>
            {/* Use usedKeywords from achievements instead of allKeywords for filtering */}
            {usedKeywords.map(keyword => {
              const count = achievements.filter(a => a.skills?.includes(keyword)).length
              return (
                <Badge
                  key={keyword}
                  variant={filterKeyword === keyword ? 'default' : 'outline'}
                  className={`cursor-pointer ${filterKeyword === keyword ? 'bg-sky-500' : 'hover:bg-sky-100'}`}
                  onClick={() => setFilterKeyword(keyword)}
                >
                  {keyword} ({count})
                </Badge>
              )
            })}
          </div>
          {filterKeyword && (
            <p className="mt-3 text-sm text-muted-foreground">
              找到 {filteredAchievements.length} 条与「{filterKeyword}」相关的成果
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {filterKeyword ? `没有找到与「${filterKeyword}」相关的成果` : '暂无工作成果记录'}
            </CardContent>
          </Card>
        ) : (
          filteredAchievements.map(achievement => (
            <Card key={achievement.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === achievement.id ? null : achievement.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {achievement.title}
                      {achievement.category && (
                        <Badge variant="secondary">{achievement.category}</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {achievement.achievement_date || '未设置日期'}
                    </p>
                    {achievement.skills && achievement.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {achievement.skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-sky-100 border-sky-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAuthenticated && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(achievement)
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(achievement)
                          }}
                        >
                          删除
                        </Button>
                      </>
                    )}
                    {expandedId === achievement.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === achievement.id && (
                <CardContent className="border-t bg-slate-50">
                  <div className="grid gap-4 md:grid-cols-2">
                    {achievement.situation && (
                      <div>
                        <h4 className="font-medium text-sm text-sky-500 mb-1">S - Situation</h4>
                        <p className="text-sm">{achievement.situation}</p>
                      </div>
                    )}
                    {achievement.task && (
                      <div>
                        <h4 className="font-medium text-sm text-sky-500 mb-1">T - Task</h4>
                        <p className="text-sm">{achievement.task}</p>
                      </div>
                    )}
                    {achievement.action && (
                      <div>
                        <h4 className="font-medium text-sm text-sky-500 mb-1">A - Action</h4>
                        <p className="text-sm">{achievement.action}</p>
                      </div>
                    )}
                    {achievement.result && (
                      <div>
                        <h4 className="font-medium text-sm text-sky-500 mb-1">R - Result</h4>
                        <p className="text-sm">{achievement.result}</p>
                      </div>
                    )}
                  </div>
                  {achievement.metrics && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-1">可量化数据</h4>
                      <p className="text-sm">{achievement.metrics}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
