'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter } from 'lucide-react'
import { WorkAchievement } from '@/lib/types'

interface KeywordFilterProps {
  achievements: WorkAchievement[]
  filterKeywords: string[]
  filterKeyword: string
  setFilterKeyword: (keyword: string) => void
  filteredCount: number
}

export function KeywordFilter({
  achievements,
  filterKeywords,
  filterKeyword,
  setFilterKeyword,
  filteredCount,
}: KeywordFilterProps) {
  return (
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
            className={`cursor-pointer ${filterKeyword === '' ? 'bg-[#C9909A]' : 'hover:bg-[#992755]/10'}`}
            onClick={() => setFilterKeyword('')}
          >
            全部
          </Badge>
          {filterKeywords.map(keyword => {
            const count = achievements.filter(a => a.skills?.includes(keyword)).length
            return (
              <Badge
                key={keyword}
                variant={filterKeyword === keyword ? 'default' : 'outline'}
                className={`cursor-pointer ${filterKeyword === keyword ? 'bg-[#C9909A]' : 'hover:bg-[#992755]/10'}`}
                onClick={() => setFilterKeyword(keyword)}
              >
                {keyword} ({count})
              </Badge>
            )
          })}
        </div>
        {filterKeyword && (
          <p className="mt-3 text-sm text-[#75728F]">
            找到 {filteredCount} 条与「{filterKeyword}」相关的成果
          </p>
        )}
      </CardContent>
    </Card>
  )
}
