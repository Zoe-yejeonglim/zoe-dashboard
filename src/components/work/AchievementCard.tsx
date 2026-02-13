'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { WorkAchievement } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'

interface AchievementCardProps {
  achievement: WorkAchievement
  isExpanded: boolean
  onToggle: () => void
  isAuthenticated: boolean
  supabase: SupabaseClient
  onDataChange: () => void
  onEdit: (achievement: WorkAchievement) => void
}

export function AchievementCard({
  achievement,
  isExpanded,
  onToggle,
  isAuthenticated,
  supabase,
  onDataChange,
  onEdit,
}: AchievementCardProps) {
  const handleDelete = async () => {
    if (!confirm('确定要删除这条成果记录吗？')) return
    try {
      await supabase.from('work_achievements').delete().eq('id', achievement.id)
      toast.success('成果已删除')
      onDataChange()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {achievement.title}
              {achievement.category && (
                <Badge variant="secondary">{achievement.category}</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-[#75728F]">
              {achievement.achievement_date || '未设置日期'}
            </p>
            {achievement.skills && achievement.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {achievement.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-[#60A5FA]/20 border-[#60A5FA]/30">
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
                    onEdit(achievement)
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
                    handleDelete()
                  }}
                >
                  删除
                </Button>
              </>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#75728F]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#75728F]" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t bg-[#992755]/5">
          <div className="grid gap-4 md:grid-cols-2">
            {achievement.situation && (
              <div>
                <h4 className="font-medium text-sm text-[#C9909A] mb-1">S - Situation</h4>
                <p className="text-sm">{achievement.situation}</p>
              </div>
            )}
            {achievement.task && (
              <div>
                <h4 className="font-medium text-sm text-[#C9909A] mb-1">T - Task</h4>
                <p className="text-sm">{achievement.task}</p>
              </div>
            )}
            {achievement.action && (
              <div>
                <h4 className="font-medium text-sm text-[#C9909A] mb-1">A - Action</h4>
                <p className="text-sm">{achievement.action}</p>
              </div>
            )}
            {achievement.result && (
              <div>
                <h4 className="font-medium text-sm text-[#C9909A] mb-1">R - Result</h4>
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
  )
}
