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
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
          active
            ? 'text-primary bg-primary/10 border border-primary/20'
            : 'text-muted hover:text-ink hover:bg-white/5'
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
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        {/* Brand */}
        <Link href="/opportunities" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink hidden sm:block font-display">SRM Tracker</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLink('/opportunities', 'Opportunities')}
          {navLink('/dashboard', 'Dashboard')}
          {role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
                pathname.startsWith('/admin')
                  ? 'text-primaryHover bg-primary/10 border border-primary/20'
                  : 'text-muted hover:text-primaryHover hover:bg-primary/5'
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {email && (
            <span className="hidden md:block text-xs text-muted max-w-[160px] truncate">{email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Sign out
          </button>
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-1.5 text-muted hover:text-ink transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
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
        <div className="sm:hidden border-t border-line px-4 py-3 flex flex-col gap-1 bg-surface">
          {navLink('/opportunities', 'Opportunities')}
          {navLink('/dashboard', 'Dashboard')}
          {role === 'admin' && (
            <Link
              href="/admin"
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-muted hover:text-primaryHover hover:bg-primary/5 transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
