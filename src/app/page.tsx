'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, Wallet, Briefcase, GraduationCap, BookOpen } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    xiaohongshuNotes: 0,
    totalExpenses: 0,
    workAchievements: 0,
    learningProjects: 0,
    totalSavings: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const [notes, expenses, achievements, projects, savings] = await Promise.all([
          supabase.from('xiaohongshu_notes').select('id', { count: 'exact' }),
          supabase.from('finance_expenses').select('amount'),
          supabase.from('work_achievements').select('id', { count: 'exact' }),
          supabase.from('learning_projects').select('id', { count: 'exact' }),
          supabase.from('finance_savings').select('actual_amount'),
        ])

        const totalExpenses = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
        const totalSavings = savings.data?.reduce((sum, s) => sum + (s.actual_amount || 0), 0) || 0

        setStats({
          xiaohongshuNotes: notes.count || 0,
          totalExpenses,
          workAchievements: achievements.count || 0,
          learningProjects: projects.count || 0,
          totalSavings,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const cards = [
    {
      title: '小红书笔记',
      value: stats.xiaohongshuNotes,
      suffix: '篇',
      description: '内容创作与数据追踪',
      icon: BookOpen,
      href: '/xiaohongshu',
    },
    {
      title: '本月储蓄',
      value: stats.totalSavings,
      prefix: '₩',
      description: '储蓄目标进度管理',
      icon: Wallet,
      href: '/finance',
      isAmount: true,
    },
    {
      title: '工作成果',
      value: stats.workAchievements,
      suffix: '项',
      description: 'STAR法则记录成长',
      icon: Briefcase,
      href: '/work',
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0F0F1A' }}>
      {/* Gradient glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-pink-500/40 via-purple-500/20 to-transparent blur-3xl" />
      </div>
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] opacity-20">
        <div className="absolute w-full h-full bg-gradient-to-r from-purple-600/30 to-transparent blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400" />
            <span className="text-sm text-gray-400">Personal Dashboard for Dreams</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight tracking-tight">
            There is Zoe and Abigail.
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent mb-8">
            Here is our dream.
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            追踪财务目标、记录工作成果、管理个人成长
            <br />
            我们的梦想，从这里开始
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/finance"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium text-lg shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/personal-dev"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-medium text-lg hover:bg-white/5 hover:border-white/30 transition-all duration-300"
            >
              Explore More
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Card glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <card.icon className="w-6 h-6 text-pink-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-gray-400 text-sm mb-2">{card.title}</h3>

                  {/* Value */}
                  <div className="text-3xl font-bold text-white mb-2">
                    {loading ? (
                      <span className="inline-block w-20 h-8 bg-white/10 rounded animate-pulse" />
                    ) : (
                      <>
                        {card.prefix}
                        {card.isAmount ? card.value.toLocaleString() : card.value}
                        {card.suffix && <span className="text-lg text-gray-400 ml-1">{card.suffix}</span>}
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 text-sm">{card.description}</p>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-pink-500/50">
                    <ArrowRight className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Additional quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: '总支出', value: `₩${stats.totalExpenses.toLocaleString()}` },
              { label: '学习板块', value: `${stats.learningProjects}个` },
              { label: '本月目标', value: '储蓄 + 成长' },
              { label: '状态', value: '进行中' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl backdrop-blur-sm text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                <p className="text-white font-medium">
                  {loading && i < 2 ? '...' : item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
