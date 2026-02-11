'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { getPraise } from '@/lib/praise'
import {
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  MessageCircle,
  Users,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { XiaohongshuNote } from '@/lib/types'

const CATEGORIES = ['美妆', '穿搭', '美食', '旅行', '生活', '职场', '学习', '其他']

export default function XiaohongshuPage() {
  const [notes, setNotes] = useState<XiaohongshuNote[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<XiaohongshuNote | null>(null)
  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('xiaohongshu_notes')
        .select('*')
        .order('post_date', { ascending: false })
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      post_date: formData.get('post_date') as string || null,
      impressions: parseInt(formData.get('impressions') as string) || 0,
      likes: parseInt(formData.get('likes') as string) || 0,
      saves: parseInt(formData.get('saves') as string) || 0,
      comments: parseInt(formData.get('comments') as string) || 0,
      followers_gained: parseInt(formData.get('followers_gained') as string) || 0,
      notes: formData.get('notes') as string || null,
    }

    try {
      if (editing) {
        await supabase.from('xiaohongshu_notes').update(data).eq('id', editing.id)
        toast.success('笔记已更新 - ' + getPraise('general'))
      } else {
        await supabase.from('xiaohongshu_notes').insert(data)
        toast.success('笔记已添加 - ' + getPraise('general'))
      }
      setDialogOpen(false)
      setEditing(null)
      fetchNotes()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (note: XiaohongshuNote) => {
    if (!confirm('确定要删除这篇笔记吗？')) return
    try {
      await supabase.from('xiaohongshu_notes').delete().eq('id', note.id)
      toast.success('笔记已删除')
      fetchNotes()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const totalImpressions = notes.reduce((sum, n) => sum + n.impressions, 0)
  const totalLikes = notes.reduce((sum, n) => sum + n.likes, 0)
  const totalSaves = notes.reduce((sum, n) => sum + n.saves, 0)
  const totalFollowers = notes.reduce((sum, n) => sum + n.followers_gained, 0)

  return (
    <div className="space-y-8">
      <PageHeader title="小红书" description="笔记数据追踪与分析">
        {isAuthenticated && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" /> 添加笔记
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-4">
                <DialogTitle>{editing ? '编辑笔记' : '添加笔记'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="title">标题</Label>
                  <Input id="title" name="title" defaultValue={editing?.title} required className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select name="category" defaultValue={editing?.category || '其他'}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="post_date">发布日期</Label>
                    <Input id="post_date" name="post_date" type="date" defaultValue={editing?.post_date || ''} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="impressions">曝光</Label>
                    <Input id="impressions" name="impressions" type="number" defaultValue={editing?.impressions || 0} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="likes">点赞</Label>
                    <Input id="likes" name="likes" type="number" defaultValue={editing?.likes || 0} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saves">收藏</Label>
                    <Input id="saves" name="saves" type="number" defaultValue={editing?.saves || 0} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="comments">评论</Label>
                    <Input id="comments" name="comments" type="number" defaultValue={editing?.comments || 0} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="followers_gained">涨粉</Label>
                  <Input id="followers_gained" name="followers_gained" type="number" defaultValue={editing?.followers_gained || 0} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="notes">备注</Label>
                  <Input id="notes" name="notes" defaultValue={editing?.notes || ''} className="mt-1" />
                </div>
                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white">保存</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="总笔记" value={notes.length} icon={BookOpen} iconClassName="bg-[#FFE4E6]" />
        <StatCard title="总曝光" value={totalImpressions.toLocaleString()} icon={Eye} iconClassName="bg-[#E0F2FE]" />
        <StatCard title="总点赞" value={totalLikes.toLocaleString()} icon={Heart} iconClassName="bg-[#FEF3C7]" />
        <StatCard title="总收藏" value={totalSaves.toLocaleString()} icon={Bookmark} iconClassName="bg-[#D1FAE5]" />
        <StatCard title="总涨粉" value={totalFollowers.toLocaleString()} icon={Users} iconClassName="bg-[#E0E7FF]" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>笔记列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无笔记数据</p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {note.category} · {note.post_date || '未设置日期'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {note.impressions}</span>
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {note.likes}</span>
                    <span className="flex items-center gap-1"><Bookmark className="h-4 w-4" /> {note.saves}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {note.comments}</span>
                    {isAuthenticated && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(note); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(note)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
