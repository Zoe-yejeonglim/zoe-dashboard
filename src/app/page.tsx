'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Wallet,
  Briefcase,
  DollarSign,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { getPraise } from '@/lib/praise'

export default function Home() {
  const [stats, setStats] = useState({
    xiaohongshuNotes: 0,
    totalExpenses: 0,
    workAchievements: 0,
    sidejobIncome: 0,
    opicDays: 0,
    totalSavings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    async function fetchStats() {
      try {
        const [notes, expenses, achievements, teaching, opic, savings] = await Promise.all([
          supabase.from('xiaohongshu_notes').select('id', { count: 'exact' }),
          supabase.from('finance_expenses').select('amount'),
          supabase.from('work_achievements').select('id', { count: 'exact' }),
          supabase.from('sidejob_teaching').select('income'),
          supabase.from('opic_daily').select('id', { count: 'exact' }),
          supabase.from('finance_savings').select('actual_amount'),
        ])

        const totalExpenses = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
        const totalTeachingIncome = teaching.data?.reduce((sum, t) => sum + (t.income || 0), 0) || 0
        const totalSavings = savings.data?.reduce((sum, s) => sum + (s.actual_amount || 0), 0) || 0

        setStats({
          xiaohongshuNotes: notes.count || 0,
          totalExpenses,
          workAchievements: achievements.count || 0,
          sidejobIncome: totalTeachingIncome,
          opicDays: opic.count || 0,
          totalSavings,
        })
      } catch (error) {
              } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const sections = [
    {
      title: '小红书',
      description: '笔记数据与变现追踪',
      icon: BookOpen,
      href: '/xiaohongshu',
      stat: stats.xiaohongshuNotes,
      unit: '篇笔记',
      color: '#F472B6',
      bg: '#FDF2F8',
    },
    {
      title: '资金规划',
      description: '记账、储蓄与预算管理',
      icon: Wallet,
      href: '/finance',
      stat: stats.totalExpenses,
      unit: '总支出',
      isAmount: true,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      title: '工作发展',
      description: 'STAR法则记录工作成果',
      icon: Briefcase,
      href: '/work',
      stat: stats.workAchievements,
      unit: '项成果',
      color: '#6B8AAE',
      bg: '#EFF6FF',
    },
    {
      title: '副业收入',
      description: '教学与合作收入',
      icon: DollarSign,
      href: '/sidejob',
      stat: stats.sidejobIncome,
      unit: '总收入',
      isAmount: true,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      title: 'OPIC',
      description: '每日学习记录',
      icon: GraduationCap,
      href: '/opic',
      stat: stats.opicDays,
      unit: '天',
      color: '#8B5CF6',
      bg: '#F5F3FF',
    },
  ]

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm text-slate-400 tracking-wide mb-2">{dateStr}</p>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">
          {greeting}
        </h1>
        <p className="text-slate-500">{getPraise('general')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">储蓄</p>
          <p className="text-xl font-semibold text-slate-700">
            {loading ? '...' : `₩${stats.totalSavings.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">副业</p>
          <p className="text-xl font-semibold text-slate-700">
            {loading ? '...' : `₩${stats.sidejobIncome.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">成果</p>
          <p className="text-xl font-semibold text-slate-700">
            {loading ? '...' : `${stats.workAchievements} 项`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">学习</p>
          <p className="text-xl font-semibold text-slate-700">
            {loading ? '...' : `${stats.opicDays} 天`}
          </p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="space-y-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <div className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: section.bg }}
                  >
                    <section.icon className="h-5 w-5" style={{ color: section.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-700">{section.title}</h3>
                    <p className="text-sm text-slate-400">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">
                      {loading ? '...' : (
                        section.isAmount
                          ? `₩${section.stat.toLocaleString()}`
                          : section.stat
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{section.unit}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
