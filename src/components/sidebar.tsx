'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from './ui/button'
import {
  Home,
  BookOpen,
  Wallet,
  Briefcase,
  DollarSign,
  GraduationCap,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'

// Ghost icon component (Abigail style)
function GhostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("ghost-float", className)}
    >
      <path d="M12 2C7.58 2 4 5.58 4 10v9c0 .55.45 1 1 1 .28 0 .53-.11.71-.29L7.41 18l1.29 1.29c.19.19.44.29.71.29s.53-.11.71-.29L11.41 18l.59.59.59-.59 1.29 1.29c.19.19.44.29.71.29s.53-.11.71-.29L16.59 18l1.71 1.71c.19.19.44.29.71.29.55 0 1-.45 1-1v-9c0-4.42-3.58-8-8-8zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 8 10 8s1.5.67 1.5 1.5S10.83 11 10 11zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 8 14 8s1.5.67 1.5 1.5S14.83 11 14 11z"/>
    </svg>
  )
}

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '小红书', href: '/xiaohongshu', icon: BookOpen },
  { name: '资金规划', href: '/finance', icon: Wallet },
  { name: '工作发展', href: '/work', icon: Briefcase },
  { name: '副业', href: '/sidejob', icon: DollarSign },
  { name: 'OPIC', href: '/opic', icon: GraduationCap },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAuthenticated, signIn, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    const { error } = await signIn(loginForm.email, loginForm.password)
    setLoginLoading(false)
    if (error) {
      toast.error('登录失败：' + error.message)
    } else {
      toast.success('欢迎回来')
      setLoginDialogOpen(false)
      setLoginForm({ email: '', password: '' })
    }
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('已退出')
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
        </Button>
      </div>

      {/* Sidebar - Dark theme */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - Abigail with ghost */}
          <div className="px-6 py-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <GhostIcon className="h-7 w-7 text-sky-400" />
              <div>
                <h1 className="text-xl font-semibold text-white tracking-tight">Abigail</h1>
                <p className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">Personal Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-sky-400" : "")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Auth Section */}
          <div className="px-3 py-6 border-t border-slate-800">
            {loading ? (
              <div className="text-center text-sm text-slate-500">Loading...</div>
            ) : isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => setLoginDialogOpen(true)}
              >
                <LogIn className="h-4 w-4 mr-2" />
                登录
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md border-slate-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-slate-700 font-medium">登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-600 text-sm">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                className="border-slate-200 focus:border-sky-400 focus:ring-sky-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 text-sm">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                className="border-slate-200 focus:border-sky-400 focus:ring-sky-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white"
              disabled={loginLoading}
            >
              {loginLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
