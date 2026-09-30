'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EMAIL_DOMAIN } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Fetch role from public users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      setError(`Could not fetch user profile: ${profileError.message}`)
      setLoading(false)
      return
    }
    
    if (!profile) {
      setError('User profile not found. If you signed up before email confirmation was required, you might need to sign up again.')
      setLoading(false)
      return
    }

    const isSrm = email.trim().toLowerCase().endsWith(EMAIL_DOMAIN)
    if (!isSrm && profile.role !== 'admin') {
      await supabase.auth.signOut()
      setError(`Only ${EMAIL_DOMAIN} accounts are allowed.`)
      setLoading(false)
      return
    }
    router.refresh()
    if (profile.role === 'admin') { router.push('/admin'); return }
    const { data: prof } = await supabase
      .from('student_profiles').select('user_id').eq('user_id', data.user.id).maybeSingle()
    router.push(prof ? '/opportunities' : '/onboarding')
  }

  return (
    <main className="min-h-screen flex bg-base">
      {/* ── Left panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1050 0%, #0f172a 50%, #0a0e1a 100%)' }}>
        {/* Soft glow orbs */}
        <div className="pointer-events-none absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-accent/10 blur-[80px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-primary/25 border border-primary/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-display font-bold text-base tracking-tight">SRM Tracker</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white leading-tight tracking-tight mb-3">
              SRM Opportunity<br />Tracker
            </h1>
            <p className="text-muted text-lg leading-relaxed">
              Never miss an opportunity<br />that fits you.
            </p>
          </div>

          {/* Benefit lines */}
          <ul className="space-y-4">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ),
                text: 'Personalised recommendations based on your profile',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                ),
                text: 'Department-wise filtering to surface relevant listings',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                text: 'Deadline tracking so you always apply on time',
              },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primaryHover" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {icon}
                  </svg>
                </div>
                <span className="text-sm text-muted leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted/40 relative z-10">© {new Date().getFullYear()} SRM Opportunity Tracker</p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-ink font-display font-bold text-sm">SRM Tracker</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted">Sign in to your account to continue</p>
          </div>

          <div className="card p-7 bg-surface">
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@srmist.edu.in"
                  className="input"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                />
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primaryHover font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
