'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from './ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'

// Ghost icon component (Abigail style with flower) - KEEP THIS!
function GhostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="currentColor"
      className={cn("ghost-float", className)}
    >
      {/* Flower on head */}
      <circle cx="18" cy="4" r="2" fill="#C9909A"/>
      <circle cx="20.5" cy="5.5" r="2" fill="#D4B0B5"/>
      <circle cx="18" cy="7" r="2" fill="#C9909A"/>
      <circle cx="15.5" cy="5.5" r="2" fill="#D4B0B5"/>
      <circle cx="18" cy="5.5" r="1.5" fill="#FDE047"/>
      {/* Ghost body */}
      <path d="M14 6C9.58 6 6 9.58 6 14v9c0 .55.45 1 1 1 .28 0 .53-.11.71-.29L9.41 22l1.29 1.29c.19.19.44.29.71.29s.53-.11.71-.29L13.41 22l.59.59.59-.59 1.29 1.29c.19.19.44.29.71.29s.53-.11.71-.29L18.59 22l1.71 1.71c.19.19.44.29.71.29.55 0 1-.45 1-1v-9c0-4.42-3.58-8-8-8zm-2 9c-.83 0-1.5-.67-1.5-1.5S11.17 12 12 12s1.5.67 1.5 1.5S12.83 15 12 15zm4 0c-.83 0-1.5-.67-1.5-1.5S15.17 12 16 12s1.5.67 1.5 1.5S16.83 15 16 15z"/>
    </svg>
  )
}

const navigation = [
  { name: '首页', href: '/' },
  { name: '小红书', href: '/xiaohongshu' },
  { name: '资金规划', href: '/finance' },
  { name: '工作发展', href: '/work' },
  { name: '个人开发', href: '/personal-dev' },
]

export function Navbar() {
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
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0710]/95 backdrop-blur-md border-b border-[#992755]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <GhostIcon className="h-7 w-7 text-white" />
                <span className="text-lg font-semibold text-white tracking-tight hidden sm:block">
                  Zoe & Abigail
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-[#C9909A] text-white"
                          : "text-[#B09FB5] hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: Auth */}
            <div className="flex items-center gap-3">
              {loading ? (
                <span className="text-sm text-[#75728F]">...</span>
              ) : isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-[#992755]/30 text-[#B09FB5] hover:text-white hover:bg-[#992755]/20 hover:border-[#992755]"
                >
                  退出
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setLoginDialogOpen(true)}
                  className="bg-[#C9909A] hover:bg-[#B87D87] text-white border-0"
                >
                  登录
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0D0710] border-t border-[#992755]/20">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-[#C9909A] text-white"
                        : "text-[#B09FB5] hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0D0710] border-[#992755]/30">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-white font-medium">登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#B09FB5] text-sm">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#B09FB5] text-sm">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#C9909A] hover:bg-[#B87D87] text-white"
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
