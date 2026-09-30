'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? null)
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole(profile?.role ?? null)
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => subscription.unsubscribe()
  }, [])

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'text-white bg-white/10'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {label}
      </Link>
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/' || pathname === '/onboarding') return null

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b0f1a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        {/* Brand */}
        <Link href="/opportunities" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">SRM Tracker</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLink('/opportunities', 'Opportunities')}
          {navLink('/dashboard', 'Dashboard')}
          {role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? 'text-purple-300 bg-purple-500/15'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {email && (
            <span className="hidden md:block text-xs text-slate-500 max-w-[160px] truncate">{email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign out
          </button>
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-1.5 text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-800 px-4 py-3 flex flex-col gap-1 bg-[#0b0f1a]">
          {navLink('/opportunities', 'Opportunities')}
          {navLink('/dashboard', 'Dashboard')}
          {role === 'admin' && (
            <Link
              href="/admin"
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
