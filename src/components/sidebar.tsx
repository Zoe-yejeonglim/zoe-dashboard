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

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '小红书', href: '/xiaohongshu', icon: BookOpen },
  { name: '资金规划', href: '/finance', icon: Wallet },
  { name: '工作发展', href: '/work', icon: Briefcase },
  { name: '副业', href: '/sidejob', icon: DollarSign },
  { name: 'OPIC学习', href: '/opic', icon: GraduationCap },
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
      toast.success('登录成功！')
      setLoginDialogOpen(false)
      setLoginForm({ email: '', password: '' })
    }
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('已退出登录')
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b">
            <div className="h-10 w-10 rounded-full bg-[#FFE4E6] flex items-center justify-center">
              <span className="text-lg font-bold text-[#F4A4A4]">Z</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Zoe Dashboard</h1>
              <p className="text-xs text-muted-foreground">个人管理中心</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#FFE4E6] text-[#F4A4A4]"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Auth Section */}
          <div className="px-4 py-4 border-t">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">加载中...</div>
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLoginDialogOpen(true)}
              >
                <LogIn className="h-4 w-4 mr-2" />
                登录编辑
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#F4A4A4] hover:bg-[#E89090]" disabled={loginLoading}>
              {loginLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
