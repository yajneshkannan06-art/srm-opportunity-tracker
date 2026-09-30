'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow, isPast, differenceInCalendarDays } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

type DBStatus = 'interested' | 'applied' | 'shortlisted' | 'completed'

interface TrackedOpportunity {
  tracking_id: string
  opportunity_id: string
  is_bookmarked: boolean
  status: DBStatus | null
  title: string
  type: string
  organization: string
  deadline: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyColor(deadline: string): { cls: string; label: string; days: number } {
  const date = new Date(deadline)
  if (isPast(date)) return { cls: 'text-muted', label: 'Closed', days: -1 }
  const days = differenceInCalendarDays(date, new Date())
  if (days <= 3) return { cls: 'text-danger', label: `${days}d left`, days }
  if (days <= 7) return { cls: 'text-warning', label: `${days}d left`, days }
  return { cls: 'text-accent', label: formatDistanceToNow(date, { addSuffix: true }), days }
}

const TYPE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  internship:    { bg: 'bg-accent/10',    text: 'text-accent',    border: 'border-accent/25' },
  workshop:      { bg: 'bg-violet-400/10',text: 'text-violet-300',border: 'border-violet-400/25' },
  hackathon:     { bg: 'bg-warning/10',   text: 'text-warning',   border: 'border-warning/25' },
  certification: { bg: 'bg-success/10',   text: 'text-success',   border: 'border-success/25' },
  competition:   { bg: 'bg-danger/10',    text: 'text-danger',    border: 'border-danger/25' },
}

const STATUS_META: Record<DBStatus, { label: string; text: string; bg: string; border: string }> = {
  interested:  { label: 'Interested',  text: 'text-primary',    bg: 'bg-primary/10',  border: 'border-primary/25' },
  applied:     { label: 'Applied',     text: 'text-warning',    bg: 'bg-warning/10',  border: 'border-warning/25' },
  shortlisted: { label: 'Shortlisted', text: 'text-violet-300', bg: 'bg-violet-400/10',border: 'border-violet-400/25' },
  completed:   { label: 'Completed',   text: 'text-success',    bg: 'bg-success/10',  border: 'border-success/25' },
}

const STAT_ICONS: Record<string, string> = {
  bookmarked:  '⭐',
  interested:  '👀',
  applied:     '📨',
  shortlisted: '🏆',
  completed:   '✅',
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, count, textCls, bgCls, borderCls }: {
  icon: string; label: string; count: number
  textCls: string; bgCls: string; borderCls: string
}) {
  return (
    <div className={`card flex-1 basis-36 min-w-0 p-5 ${bgCls} border ${borderCls}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-display font-bold text-ink">{count}</span>
      </div>
      <div className={`text-sm font-medium ${textCls}`}>{label}</div>
    </div>
  )
}

// ─── Deadline Row ─────────────────────────────────────────────────────────────

function DeadlineRow({ item }: { item: TrackedOpportunity }) {
  const urg = urgencyColor(item.deadline)
  const typeBadge = TYPE_BADGE[item.type]
  const statusM = item.status ? STATUS_META[item.status] : null

  return (
    <Link href={`/opportunities/${item.opportunity_id}`} className="block group">
      <div className="flex items-center gap-3 px-4 py-3 bg-surface2 border border-line rounded-xl transition-all duration-150 group-hover:border-accent/30 group-hover:bg-surface cursor-pointer">
        {/* Type badge */}
        {typeBadge && (
          <span className={`badge ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border} shrink-0`}>
            {item.type}
          </span>
        )}

        {/* Title + org */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate mb-0.5">{item.title}</p>
          <p className="text-xs text-muted truncate">{item.organization}</p>
        </div>

        {/* Status pill */}
        {statusM && (
          <span className={`badge ${statusM.bg} ${statusM.text} ${statusM.border} shrink-0`}>
            {statusM.label}
          </span>
        )}

        {/* Urgency */}
        <div className="flex items-center gap-1.5 shrink-0">
          {urg.days >= 0 && urg.days <= 3 && (
            <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />
          )}
          <span className={`text-xs font-semibold ${urg.cls}`}>{urg.label}</span>
        </div>

        {/* Arrow */}
        <svg className="w-3.5 h-3.5 text-line shrink-0 group-hover:text-muted transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// ─── Tracker Row (with status dropdown) ──────────────────────────────────────

function TrackerRow({ item, onChangeStatus }: {
  item: TrackedOpportunity
  onChangeStatus: (trackingId: string, oppId: string, newStatus: DBStatus | null) => void
}) {
  const typeBadge = TYPE_BADGE[item.type]
  const statusM = item.status ? STATUS_META[item.status] : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface2 border border-line rounded-xl">
      {typeBadge && (
        <span className={`badge ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border} shrink-0`}>
          {item.type}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <Link href={`/opportunities/${item.opportunity_id}`} className="block">
          <p className="text-sm font-semibold text-ink truncate mb-0.5 hover:text-primaryHover transition-colors">{item.title}</p>
        </Link>
        <p className="text-xs text-muted truncate">{item.organization}</p>
      </div>

      {/* Status dropdown */}
      <select
        value={item.status ?? ''}
        onChange={e => onChangeStatus(item.tracking_id, item.opportunity_id, (e.target.value as DBStatus) || null)}
        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none shrink-0 transition-all duration-150 ${
          statusM
            ? `${statusM.bg} ${statusM.text} ${statusM.border}`
            : 'bg-surface border-line text-muted'
        }`}
      >
        <option value="">No status</option>
        <option value="interested">Interested</option>
        <option value="applied">Applied</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface2 border border-line rounded-xl animate-pulse">
      <div className="w-14 h-5 rounded-full bg-line" />
      <div className="flex-1">
        <div className="h-3 w-[55%] bg-line rounded mb-1.5" />
        <div className="h-2.5 w-[35%] bg-surface rounded" />
      </div>
      <div className="h-5 w-16 bg-line rounded-full" />
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, accentCls, action }: { title: string; accentCls: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-base font-bold text-ink flex items-center gap-2.5">
        <span className={`w-1 h-5 rounded-full ${accentCls} inline-block`} />
        {title}
      </h2>
      {action}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tracked, setTracked] = useState<TrackedOpportunity[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUserEmail(user.email ?? null)

      const { data, error: fetchErr } = await supabase
        .from('tracking')
        .select(`
          id,
          is_bookmarked,
          status,
          opportunity_id,
          opportunities (
            id,
            title,
            type,
            organization,
            deadline
          )
        `)
        .eq('user_id', user.id)

      if (fetchErr) {
        setError(fetchErr.message)
        setLoading(false)
        return
      }

      const items: TrackedOpportunity[] = (data ?? []).flatMap((row: Record<string, unknown>) => {
        const opp = row.opportunities as Record<string, string> | null
        if (!opp) return []
        return [{
          tracking_id: row.id as string,
          opportunity_id: opp.id,
          is_bookmarked: row.is_bookmarked as boolean,
          status: row.status as DBStatus | null,
          title: opp.title,
          type: opp.type,
          organization: opp.organization,
          deadline: opp.deadline,
        }]
      })

      setTracked(items)
      setLoading(false)
    }

    load()
  }, [])

  // Status change handler
  const handleChangeStatus = async (trackingId: string, oppId: string, newStatus: DBStatus | null) => {
    // Optimistic update
    setTracked(prev => prev.map(t =>
      t.tracking_id === trackingId ? { ...t, status: newStatus } : t
    ))
    const { error: updateErr } = await supabase
      .from('tracking')
      .update({ status: newStatus })
      .eq('id', trackingId)
    if (updateErr) {
      console.error('Status update failed:', updateErr.message)
    }
  }

  // ── Derived data ──
  const bookmarkedCount = tracked.filter(t => t.is_bookmarked).length
  const appliedCount    = tracked.filter(t => t.status === 'applied').length
  const shortlistedCount = tracked.filter(t => t.status === 'shortlisted').length
  const completedCount  = tracked.filter(t => t.status === 'completed').length

  // Upcoming = bookmarked OR has status, not completed, not past deadline
  const upcoming = [...tracked]
    .filter(t => (t.is_bookmarked || t.status) && t.status !== 'completed' && !isPast(new Date(t.deadline)))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  // Grouped tracker
  const grouped: Record<DBStatus, TrackedOpportunity[]> = {
    interested:  tracked.filter(t => t.status === 'interested'),
    applied:     tracked.filter(t => t.status === 'applied'),
    shortlisted: tracked.filter(t => t.status === 'shortlisted'),
    completed:   tracked.filter(t => t.status === 'completed'),
  }
  const noStatus = tracked.filter(t => !t.status)

  const hasData = tracked.length > 0
  const firstName = userEmail?.split('@')[0] ?? 'Student'

  return (
    <div className="min-h-screen bg-base">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .dash-in { animation: fadeUp 0.4s ease both; }
      `}</style>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">

        {/* Greeting */}
        <div className="dash-in mb-9" style={{ animationDelay: '0ms' }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-1.5">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {firstName}
            </span>{' '}👋
          </h1>
          <p className="text-sm text-muted">
            {hasData
              ? `You're tracking ${tracked.length} opportunit${tracked.length === 1 ? 'y' : 'ies'}.`
              : 'Start tracking opportunities to see your progress here.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3 mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="flex gap-3 flex-wrap">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 basis-36 h-24 card bg-surface animate-pulse" />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
            </div>
          </div>

        ) : !hasData ? (
          /* Empty state */
          <div className="dash-in flex flex-col items-center justify-center text-center py-20" style={{ animationDelay: '60ms' }}>
            <div className="w-20 h-20 rounded-2xl card flex items-center justify-center text-4xl mb-6">🔍</div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Nothing tracked yet</h2>
            <p className="text-sm text-muted max-w-sm leading-relaxed mb-7">
              Bookmark opportunities or set a status on the Browse page — they&apos;ll show up here with deadline reminders.
            </p>
            <Link href="/opportunities" className="btn-primary">
              Browse Opportunities →
            </Link>
          </div>

        ) : (
          <>
            {/* ── Stat Cards ── */}
            <section className="dash-in mb-12" style={{ animationDelay: '40ms' }}>
              <SectionHeader title="Overview" accentCls="bg-gradient-to-b from-accent to-primary" />
              <div className="flex gap-3 flex-wrap">
                <StatCard icon={STAT_ICONS.bookmarked}  label="Bookmarked"  count={bookmarkedCount}  textCls="text-warning"    bgCls="bg-warning/8"    borderCls="border-warning/20" />
                <StatCard icon={STAT_ICONS.applied}     label="Applied"     count={appliedCount}     textCls="text-primary"   bgCls="bg-primary/8"    borderCls="border-primary/20" />
                <StatCard icon={STAT_ICONS.shortlisted} label="Shortlisted" count={shortlistedCount} textCls="text-violet-300" bgCls="bg-violet-400/8" borderCls="border-violet-400/20" />
                <StatCard icon={STAT_ICONS.completed}   label="Completed"   count={completedCount}   textCls="text-success"   bgCls="bg-success/8"    borderCls="border-success/20" />
              </div>
            </section>

            {/* ── Upcoming Deadlines ── */}
            <section className="dash-in mb-12" style={{ animationDelay: '100ms' }}>
              <SectionHeader
                title="Upcoming Deadlines"
                accentCls="bg-gradient-to-b from-danger to-warning"
                action={<Link href="/opportunities" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">Browse all →</Link>}
              />

              {/* Legend */}
              <div className="flex items-center gap-4 mb-3">
                {[['bg-danger','Under 3 days'],['bg-warning','Under 7 days'],['bg-accent','More time']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${c} inline-block`} />
                    <span className="text-[11px] text-muted font-medium">{l}</span>
                  </div>
                ))}
              </div>

              {upcoming.length === 0 ? (
                <div className="card bg-surface px-5 py-8 text-center">
                  <p className="text-sm text-muted">No upcoming deadlines — great job staying on top of things! 🎉</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map(item => <DeadlineRow key={item.tracking_id} item={item} />)}
                </div>
              )}
            </section>

            {/* ── My Tracker ── */}
            <section className="dash-in" style={{ animationDelay: '160ms' }}>
              <SectionHeader
                title="My Tracker"
                accentCls="bg-gradient-to-b from-violet-400 to-primary"
              />

              {(['interested','applied','shortlisted','completed'] as DBStatus[]).map(status => {
                const items = grouped[status]
                if (items.length === 0) return null
                const meta = STATUS_META[status]
                return (
                  <div key={status} className="mb-7">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`badge ${meta.bg} ${meta.text} ${meta.border}`}>{meta.label}</span>
                      <span className="text-xs text-muted">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {items.map(item => (
                        <TrackerRow key={item.tracking_id} item={item} onChangeStatus={handleChangeStatus} />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Bookmarked but no status */}
              {noStatus.length > 0 && (
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="badge bg-surface2 text-muted border-line">Bookmarked / No Status</span>
                    <span className="text-xs text-muted">{noStatus.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {noStatus.map(item => (
                      <TrackerRow key={item.tracking_id} item={item} onChangeStatus={handleChangeStatus} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
