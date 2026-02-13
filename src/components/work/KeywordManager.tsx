'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Settings, X } from 'lucide-react'

interface KeywordManagerProps {
  isAuthenticated: boolean
  allKeywords: string[]
  saveKeywords: (keywords: string[]) => void
  setFilterKeyword: (keyword: string) => void
}

export function KeywordManager({
  isAuthenticated,
  allKeywords,
  saveKeywords,
  setFilterKeyword,
}: KeywordManagerProps) {
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

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

  if (!isAuthenticated) return null

  return (
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
              <Button onClick={addNewKeyword} className="">
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
                  className="cursor-pointer hover:bg-[#EF4444]/20 hover:text-[#EF4444] transition-colors"
                  onClick={() => deleteKeyword(keyword)}
                >
                  {keyword} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-[#75728F]">点击关键词可删除</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
