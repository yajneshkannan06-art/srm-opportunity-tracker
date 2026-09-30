'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow, isPast } from 'date-fns'
import { DEPARTMENTS } from '@/lib/constants'
import { isEligible, scoreOpportunity, type Profile } from '@/lib/recommend'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpportunityType =
  | 'internship'
  | 'workshop'
  | 'hackathon'
  | 'certification'
  | 'competition'

export type DBStatus = 'interested' | 'applied' | 'shortlisted' | 'completed'
export type OpportunityStatus = DBStatus | ''

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
  departments: string[]
  is_free: boolean
}

interface UserTracking {
  id?: string
  user_id: string
  opportunity_id: string
  is_bookmarked: boolean
  status: OpportunityStatus | null
}

type SortOption = 'deadline' | 'newest'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: OpportunityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'certification', label: 'Certification' },
  { value: 'competition', label: 'Competition' },
]

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: '', label: 'Select Status' },
  { value: 'interested', label: 'Interested' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'completed', label: 'Completed' },
]

const TYPE_COLORS: Record<OpportunityType, { bg: string; text: string; border: string }> = {
  internship:    { bg: 'bg-cyan-500/15',   text: 'text-cyan-300',   border: 'border-cyan-500/30' },
  workshop:      { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30' },
  hackathon:     { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30' },
  certification: { bg: 'bg-emerald-500/15',text: 'text-emerald-300',border: 'border-emerald-500/30' },
  competition:   { bg: 'bg-rose-500/15',   text: 'text-rose-300',   border: 'border-rose-500/30' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(iso: string): { label: string; urgent: boolean } {
  const date = new Date(iso)
  if (isPast(date)) return { label: 'Closed', urgent: false }
  const rel = formatDistanceToNow(date, { addSuffix: true })
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  return { label: rel, urgent: daysLeft <= 5 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: OpportunityType }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.internship
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}
    >
      {type}
    </span>
  )
}

function DeadlineBadge({ iso }: { iso: string }) {
  const { label, urgent } = formatDeadline(iso)
  if (label === 'Closed') {
    return <span className="text-slate-500 text-xs">Closed</span>
  }
  return (
    <span className={`text-xs font-medium ${urgent ? 'text-orange-400' : 'text-slate-400'}`}>
      {urgent && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  )
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40">
      {skill}
    </span>
  )
}

function OpportunityCard({
  opp,
  tracking,
  onToggleBookmark,
  onChangeStatus,
}: {
  opp: Opportunity
  tracking?: UserTracking
  onToggleBookmark: (oppId: string, currentBookmarked: boolean) => void
  onChangeStatus: (oppId: string, newStatus: OpportunityStatus) => void
}) {
  const isBookmarked = tracking?.is_bookmarked ?? false
  const status = (tracking?.status as OpportunityStatus) ?? ''

  return (
    <article className="group relative flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all duration-200 hover:shadow-[0_0_24px_rgba(6,182,212,0.08)]">
      {/* Top row: Type badge, Deadline & Bookmark */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link href={`/opportunities/${opp.id}`} className="flex-1">
          <TypeBadge type={opp.type} />
        </Link>
        <div className="flex items-center gap-2">
          <DeadlineBadge iso={opp.deadline} />
          <button
            id={`bookmark-btn-${opp.id}`}
            onClick={() => onToggleBookmark(opp.id, isBookmarked)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark opportunity'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                : 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:text-amber-400 hover:bg-slate-700/80'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Clickable body → detail page */}
      <Link href={`/opportunities/${opp.id}`} className="flex-1 flex flex-col min-w-0">
        {/* Title */}
        <h2 className="text-base font-semibold text-white leading-snug mb-1 group-hover:text-cyan-100 transition-colors">
          {opp.title}
        </h2>

        {/* Organization */}
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {opp.organization}
        </p>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 flex-1">
          {opp.description}
        </p>

        {/* Skills */}
        {opp.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opp.skills.slice(0, 5).map((s) => (
              <SkillTag key={s} skill={s} />
            ))}
            {opp.skills.length > 5 && (
              <span className="text-[11px] text-slate-500 self-center">+{opp.skills.length - 5} more</span>
            )}
          </div>
        )}
      </Link>

      {/* Status & CTA Controls Row */}
      <div className="mt-auto pt-3 border-t border-slate-700/40 flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            id={`status-select-${opp.id}`}
            value={status}
            onChange={(e) => onChangeStatus(opp.id, e.target.value as OpportunityStatus)}
            className={`appearance-none text-xs rounded-lg px-2.5 py-1.5 pr-7 font-medium border focus:outline-none transition cursor-pointer ${
              status === 'interested'
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : status === 'applied'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : status === 'shortlisted'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : status === 'completed'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:border-slate-500'
            }`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* External Link / Apply */}
        {opp.external_link ? (
          <a
            href={opp.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group/link"
          >
            Apply
            <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        ) : (
          <span className="text-xs text-slate-600 italic">No link available</span>
        )}
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-24 rounded-full bg-slate-700/60" />
        <div className="h-4 w-16 rounded bg-slate-700/60" />
      </div>
      <div className="h-5 w-3/4 rounded bg-slate-700/60 mb-2" />
      <div className="h-3 w-1/2 rounded bg-slate-700/40 mb-4" />
      <div className="h-3 w-full rounded bg-slate-700/30 mb-1" />
      <div className="h-3 w-5/6 rounded bg-slate-700/30 mb-4" />
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => <div key={i} className="h-5 w-16 rounded-md bg-slate-700/50" />)}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [trackingMap, setTrackingMap] = useState<Record<string, UserTracking>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'all'>('all')
  const [skillSearch, setSkillSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('deadline')
  const [deptFilter, setDeptFilter] = useState<string[]>([])
  const [freeOnly, setFreeOnly] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // 1. Get current auth user
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id ?? null
        setUserId(currentUserId)

        if (currentUserId) {
          const { data: prof } = await supabase.from('student_profiles')
            .select('department, interests, skills').eq('user_id', currentUserId).maybeSingle()
          if (!prof) { router.replace('/onboarding'); return }
          setProfile(prof)
        }

        // 2. Fetch opportunities
        const { data: opps, error: fetchError } = await supabase
          .from('opportunities')
          .select('id, title, type, description, skills, deadline, organization, external_link, created_at, departments, is_free')

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setOpportunities(opps ?? [])

        // 3. Fetch user tracking records if logged in
        if (currentUserId) {
          const { data: trackings, error: trackingsError } = await supabase
            .from('tracking')
            .select('id, user_id, opportunity_id, is_bookmarked, status')
            .eq('user_id', currentUserId)
            
          if (trackingsError) {
             console.error("Tracking error:", trackingsError)
          }

          if (trackings) {
            const map: Record<string, UserTracking> = {}
            for (const t of trackings) {
              map[t.opportunity_id] = t
            }
            setTrackingMap(map)
          }
        }
      } catch (err: any) {
        setError(err?.message || String(err))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Helper: Get or ensure valid User ID
  const ensureUserId = async (): Promise<string | null> => {
    if (userId) return userId
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      return user.id
    }
    return null
  }

  // Handler: Toggle Bookmark
  const handleToggleBookmark = async (oppId: string, currentBookmarked: boolean) => {
    const activeUserId = await ensureUserId()
    if (!activeUserId) {
      alert('Please log in to bookmark opportunities.')
      return
    }

    const nextBookmarked = !currentBookmarked
    const existingTracking = trackingMap[oppId]

    // Optimistic UI update
    setTrackingMap((prev) => ({
      ...prev,
      [oppId]: {
        ...prev[oppId],
        user_id: activeUserId,
        opportunity_id: oppId,
        is_bookmarked: nextBookmarked,
        status: prev[oppId]?.status ?? null,
      },
    }))

    const payload: Record<string, unknown> = {
      user_id: activeUserId,
      opportunity_id: oppId,
      is_bookmarked: nextBookmarked,
      status: existingTracking?.status || null,
    }
    if (existingTracking?.id) {
      payload.id = existingTracking.id
    }

    const { data, error } = await supabase
      .from('tracking')
      .upsert(payload, { onConflict: 'user_id,opportunity_id' })
      .select()
      .single()

    if (error) {
      console.error('Failed to update bookmark:', error)
      // Revert optimistic update
      setTrackingMap((prev) => ({
        ...prev,
        [oppId]: {
          ...prev[oppId],
          user_id: activeUserId,
          opportunity_id: oppId,
          is_bookmarked: currentBookmarked,
          status: prev[oppId]?.status ?? null,
        },
      }))
    } else if (data) {
      setTrackingMap((prev) => ({
        ...prev,
        [oppId]: data,
      }))
    }
  }

  // Handler: Change Status
  const handleChangeStatus = async (oppId: string, newStatus: OpportunityStatus) => {
    const activeUserId = await ensureUserId()
    if (!activeUserId) {
      alert('Please log in to track opportunity status.')
      return
    }

    const existingTracking = trackingMap[oppId]
    const statusVal = newStatus || null

    // Optimistic UI update
    setTrackingMap((prev) => ({
      ...prev,
      [oppId]: {
        ...prev[oppId],
        user_id: activeUserId,
        opportunity_id: oppId,
        is_bookmarked: prev[oppId]?.is_bookmarked ?? false,
        status: statusVal,
      },
    }))

    const payload: Record<string, unknown> = {
      user_id: activeUserId,
      opportunity_id: oppId,
      is_bookmarked: existingTracking?.is_bookmarked ?? false,
      status: statusVal,
    }
    if (existingTracking?.id) {
      payload.id = existingTracking.id
    }

    const { data, error } = await supabase
      .from('tracking')
      .upsert(payload, { onConflict: 'user_id,opportunity_id' })
      .select()
      .single()

    if (error) {
      console.error('Failed to update status:', error)
      // Revert optimistic update
      setTrackingMap((prev) => ({
        ...prev,
        [oppId]: {
          ...prev[oppId],
          user_id: activeUserId,
          opportunity_id: oppId,
          is_bookmarked: prev[oppId]?.is_bookmarked ?? false,
          status: existingTracking?.status ?? null,
        },
      }))
    } else if (data) {
      setTrackingMap((prev) => ({
        ...prev,
        [oppId]: data,
      }))
    }
  }

  const filtered = useMemo(() => {
    let result = [...opportunities]

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((o) => o.type === typeFilter)
    }

    // Skill search
    if (skillSearch.trim()) {
      const q = skillSearch.trim().toLowerCase()
      result = result.filter((o) =>
        o.skills?.some((s) => s.toLowerCase().includes(q))
      )
    }

    // Free-only filter
    if (freeOnly) result = result.filter((o) => o.is_free)

    // Department filter
    if (deptFilter.length > 0) {
      result = result.filter((o) =>
        o.departments?.some((d) => deptFilter.includes(d))
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [opportunities, typeFilter, skillSearch, sort, freeOnly, deptFilter])

  const totalCount = opportunities.length

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Opportunities
            </h1>
            {!loading && (
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} of {totalCount} results
              </p>
            )}
          </div>
          {/* Sort */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-slate-400 shrink-0 hidden sm:block">Sort by</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              <option value="deadline">Deadline (soonest)</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Type dropdown */}
          <div className="relative">
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as OpportunityType | 'all')}
              className="appearance-none w-full sm:w-48 bg-slate-800/80 border border-slate-700/80 text-slate-300 text-sm rounded-xl pl-4 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition cursor-pointer"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Skill search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="skill-search"
              type="text"
              placeholder="Filter by skill (e.g. React)"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-sm rounded-xl pl-9 pr-4 py-2.5 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            />
            {skillSearch && (
              <button
                onClick={() => setSkillSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                aria-label="Clear skill filter"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Active filter pill */}
          {(typeFilter !== 'all' || skillSearch) && (
            <button
              onClick={() => { setTypeFilter('all'); setSkillSearch('') }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 transition"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-5 py-4 mb-6">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Failed to load opportunities: {error}
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">No opportunities found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                tracking={trackingMap[opp.id]}
                onToggleBookmark={handleToggleBookmark}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
