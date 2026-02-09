'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Wallet,
  Briefcase,
  DollarSign,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [stats, setStats] = useState({
    xiaohongshuNotes: 0,
    totalExpenses: 0,
    workAchievements: 0,
    sidejobIncome: 0,
    opicDays: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const [notes, expenses, achievements, teaching, opic] = await Promise.all([
          supabase.from('xiaohongshu_notes').select('id', { count: 'exact' }),
          supabase.from('finance_expenses').select('amount'),
          supabase.from('work_achievements').select('id', { count: 'exact' }),
          supabase.from('sidejob_teaching').select('income'),
          supabase.from('opic_daily').select('id', { count: 'exact' }),
        ])

        const totalExpenses = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
        const totalTeachingIncome = teaching.data?.reduce((sum, t) => sum + (t.income || 0), 0) || 0

        setStats({
          xiaohongshuNotes: notes.count || 0,
          totalExpenses,
          workAchievements: achievements.count || 0,
          sidejobIncome: totalTeachingIncome,
          opicDays: opic.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const sections = [
    {
      title: '小红书',
      description: '笔记数据追踪与变现管理',
      icon: BookOpen,
      href: '/xiaohongshu',
      stat: `${stats.xiaohongshuNotes} 篇笔记`,
      color: 'bg-[#FFE4E6]',
    },
    {
      title: '资金规划',
      description: '每日记账与储蓄追踪',
      icon: Wallet,
      href: '/finance',
      stat: `¥${stats.totalExpenses.toLocaleString()} 总支出`,
      color: 'bg-[#E0F2FE]',
    },
    {
      title: '工作发展',
      description: 'STAR法则记录工作成果',
      icon: Briefcase,
      href: '/work',
      stat: `${stats.workAchievements} 项成果`,
      color: 'bg-[#FEF3C7]',
    },
    {
      title: '副业',
      description: '中文老师与小红书变现',
      icon: DollarSign,
      href: '/sidejob',
      stat: `¥${stats.sidejobIncome.toLocaleString()} 收入`,
      color: 'bg-[#D1FAE5]',
    },
    {
      title: 'OPIC学习',
      description: '每日学习记录与进度',
      icon: GraduationCap,
      href: '/opic',
      stat: `${stats.opicDays} 天记录`,
      color: 'bg-[#E0E7FF]',
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="欢迎回来，Zoe！"
        description="这是你的个人管理仪表盘"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="本月笔记"
          value={stats.xiaohongshuNotes}
          icon={BookOpen}
          iconClassName="bg-[#FFE4E6]"
        />
        <StatCard
          title="本月支出"
          value={`¥${stats.totalExpenses.toLocaleString()}`}
          icon={Wallet}
          iconClassName="bg-[#E0F2FE]"
        />
        <StatCard
          title="工作成果"
          value={stats.workAchievements}
          icon={Briefcase}
          iconClassName="bg-[#FEF3C7]"
        />
        <StatCard
          title="副业收入"
          value={`¥${stats.sidejobIncome.toLocaleString()}`}
          icon={TrendingUp}
          iconClassName="bg-[#D1FAE5]"
        />
      </div>

      {/* Section Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl ${section.color} flex items-center justify-center`}>
                    <section.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#F4A4A4]">
                  {loading ? '加载中...' : section.stat}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
