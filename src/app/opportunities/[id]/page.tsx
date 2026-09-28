'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow, isPast, differenceInCalendarDays } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpportunityType =
  | 'internship'
  | 'workshop'
  | 'hackathon'
  | 'certification'
  | 'competition'

type DBStatus = 'interested' | 'applied' | 'shortlisted' | 'completed'
type OpportunityStatus = DBStatus | ''

interface Opportunity {
  id: string
  title: string
  type: OpportunityType
  description: string
  skills: string[]
  deadline: string
  organization: string
  external_link: string
  created_at: string
}

interface UserTracking {
  id?: string
  user_id: string
  opportunity_id: string
  is_bookmarked: boolean
  status: OpportunityStatus | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: '', label: 'Select Status' },
  { value: 'interested', label: 'Interested' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'completed', label: 'Completed' },
]

const TYPE_COLORS: Record<OpportunityType, { bg: string; text: string; border: string }> = {
  internship:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    border: 'border-cyan-500/30' },
  workshop:      { bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/30' },
  hackathon:     { bg: 'bg-orange-500/15',  text: 'text-orange-300',  border: 'border-orange-500/30' },
  certification: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  competition:   { bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/30' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeadlineInfo(iso: string) {
  const date = new Date(iso)
  if (isPast(date)) return { label: 'Deadline passed', days: -1, color: 'text-slate-500' }
  const days = differenceInCalendarDays(date, new Date())
  const rel = formatDistanceToNow(date, { addSuffix: true })
  const color =
    days <= 3 ? 'text-red-400' :
    days <= 7 ? 'text-amber-400' :
    'text-cyan-400'
  return { label: `${rel} (${days} day${days !== 1 ? 's' : ''} left)`, days, color }
}

// ─── Detail Page ──────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [opp, setOpp] = useState<Opportunity | null>(null)
  const [tracking, setTracking] = useState<UserTracking | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        const uid = user?.id ?? null
        setUserId(uid)

        // Fetch opportunity
        const { data, error: fetchErr } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchErr || !data) {
          setNotFound(true)
          return
        }
        setOpp(data)

        // Fetch tracking if logged in
        if (uid) {
          const { data: t } = await supabase
            .from('tracking')
            .select('*')
            .eq('user_id', uid)
            .eq('opportunity_id', id)
            .single()
          if (t) setTracking(t)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const ensureUserId = async (): Promise<string | null> => {
    if (userId) return userId
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setUserId(user.id); return user.id }
    return null
  }

  const upsertTracking = async (patch: Partial<UserTracking>) => {
    const uid = await ensureUserId()
    if (!uid) {
      alert('Please log in to track opportunities.')
      return
    }
    setSaving(true)
    const current = tracking ?? { user_id: uid, opportunity_id: id, is_bookmarked: false, status: null }
    const payload = { ...current, ...patch, user_id: uid, opportunity_id: id }
    const { data, error: upsertErr } = await supabase
      .from('tracking')
      .upsert(payload, { onConflict: 'user_id,opportunity_id' })
      .select()
      .single()
    if (!upsertErr && data) setTracking(data)
    setSaving(false)
  }

  const isBookmarked = tracking?.is_bookmarked ?? false
  const status = (tracking?.status as OpportunityStatus) ?? ''

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading opportunity…</p>
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (notFound || !opp) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Opportunity not found</h1>
          <p className="text-slate-400 text-sm mb-6">This opportunity may have been removed or the link is invalid.</p>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            ← Back to opportunities
          </Link>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm underline">Go back</button>
        </div>
      </div>
    )
  }

  const typeColors = TYPE_COLORS[opp.type] ?? TYPE_COLORS.internship
  const deadline = getDeadlineInfo(opp.deadline)

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to opportunities
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Title card ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6">

          {/* Type + Bookmark row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
              {opp.type}
            </span>
            <button
              id="detail-bookmark-btn"
              onClick={() => upsertTracking({ is_bookmarked: !isBookmarked })}
              disabled={saving}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this opportunity'}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:text-amber-400 hover:bg-slate-700/80'
              }`}
            >
              <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
            {opp.title}
          </h1>

          {/* Organization */}
          <p className="text-slate-400 flex items-center gap-1.5 text-sm mb-5">
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {opp.organization}
          </p>

          {/* Deadline */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/40 border border-slate-600/30 text-sm font-medium mb-6 ${deadline.color}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {deadline.days < 0 ? 'Deadline passed' : `Deadline: ${deadline.label}`}
          </div>

          {/* Status dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-sm text-slate-400 shrink-0 font-medium">Your status:</label>
            <div className="relative">
              <select
                id="detail-status-select"
                value={status}
                disabled={saving}
                onChange={(e) => upsertTracking({ status: e.target.value as OpportunityStatus || null })}
                className={`appearance-none text-sm rounded-xl px-3 py-2 pr-8 font-medium border focus:outline-none transition cursor-pointer ${
                  status === 'interested'  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                  status === 'applied'     ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                  status === 'shortlisted' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                  status === 'completed'   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                  'bg-slate-700/40 border-slate-600/40 text-slate-400'
                }`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Apply button */}
            {opp.external_link ? (
              <a
                id="detail-apply-btn"
                href={opp.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-[0_0_16px_rgba(6,182,212,0.25)] hover:shadow-[0_0_24px_rgba(6,182,212,0.4)]"
              >
                Apply now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 bg-slate-700/40 border border-slate-600/30 text-slate-500 font-semibold px-5 py-2 rounded-xl text-sm cursor-not-allowed"
              >
                No link available
              </button>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-base font-semibold text-white mb-3">About this opportunity</h2>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{opp.description}</p>
        </div>

        {/* ── Skills ── */}
        {opp.skills?.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-semibold text-white mb-4">Skills required</h2>
            <div className="flex flex-wrap gap-2">
              {opp.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
