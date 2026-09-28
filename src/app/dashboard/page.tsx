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

function urgencyColor(deadline: string): { color: string; label: string; days: number } {
  const date = new Date(deadline)
  if (isPast(date)) return { color: '#a9b4d0', label: 'Closed', days: -1 }
  const days = differenceInCalendarDays(date, new Date())
  if (days <= 3) return { color: '#ff6b4a', label: `${days}d left`, days }
  if (days <= 7) return { color: '#f2c94c', label: `${days}d left`, days }
  return { color: '#2fe6d6', label: formatDistanceToNow(date, { addSuffix: true }), days }
}

const TYPE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  internship:    { bg: 'rgba(47,230,214,0.12)',  text: '#2fe6d6', border: 'rgba(47,230,214,0.3)' },
  workshop:      { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  hackathon:     { bg: 'rgba(251,146,60,0.12)',  text: '#fb923c', border: 'rgba(251,146,60,0.3)' },
  certification: { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  competition:   { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
}

const STATUS_META: Record<DBStatus, { label: string; color: string; bg: string; border: string }> = {
  interested:  { label: 'Interested',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  applied:     { label: 'Applied',     color: '#f2c94c', bg: 'rgba(242,201,76,0.12)',  border: 'rgba(242,201,76,0.3)' },
  shortlisted: { label: 'Shortlisted', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  completed:   { label: 'Completed',   color: '#2fe6d6', bg: 'rgba(47,230,214,0.12)',  border: 'rgba(47,230,214,0.3)' },
}

const STAT_ICONS: Record<string, string> = {
  bookmarked:  '⭐',
  interested:  '👀',
  applied:     '📨',
  shortlisted: '🏆',
  completed:   '✅',
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, count, color, bg, border }: {
  icon: string; label: string; count: number
  color: string; bg: string; border: string
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px 24px', flex: '1 1 140px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span style={{ fontSize: '28px', fontFamily: 'var(--font-sora)', fontWeight: 700, color: '#fff' }}>{count}</span>
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: 500, color }}>
        {label}
      </div>
    </div>
  )
}

// ─── Deadline Row ─────────────────────────────────────────────────────────────

function DeadlineRow({ item }: { item: TrackedOpportunity }) {
  const urg = urgencyColor(item.deadline)
  const typeBadge = TYPE_BADGE[item.type]
  const statusM = item.status ? STATUS_META[item.status] : null

  return (
    <Link href={`/opportunities/${item.opportunity_id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '13px 18px', background: '#141c3d',
          border: '1px solid #2a3566', borderRadius: '14px',
          transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2fe6d6'; (e.currentTarget as HTMLDivElement).style.background = '#1b254a' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3566'; (e.currentTarget as HTMLDivElement).style.background = '#141c3d' }}
      >
        {/* Type badge */}
        {typeBadge && (
          <span style={{
            fontSize: '10px', fontFamily: 'var(--font-inter)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: typeBadge.text, background: typeBadge.bg, border: `1px solid ${typeBadge.border}`,
            borderRadius: '100px', padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{item.type}</span>
        )}

        {/* Title + org */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '14px', fontFamily: 'var(--font-inter)', fontWeight: 600,
            color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
          }}>{item.title}</p>
          <p style={{
            fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#a9b4d0',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{item.organization}</p>
        </div>

        {/* Status pill */}
        {statusM && (
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 600,
            color: statusM.color, background: statusM.bg, border: `1px solid ${statusM.border}`,
            borderRadius: '100px', padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{statusM.label}</span>
        )}

        {/* Urgency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {urg.days >= 0 && urg.days <= 3 && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: urg.color, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          )}
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', fontWeight: 600, color: urg.color }}>{urg.label}</span>
        </div>

        {/* Arrow */}
        <svg style={{ width: '14px', height: '14px', color: '#2a3566', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 18px', background: '#141c3d',
      border: '1px solid #2a3566', borderRadius: '14px',
    }}>
      {typeBadge && (
        <span style={{
          fontSize: '10px', fontFamily: 'var(--font-inter)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: typeBadge.text, background: typeBadge.bg, border: `1px solid ${typeBadge.border}`,
          borderRadius: '100px', padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>{item.type}</span>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/opportunities/${item.opportunity_id}`} style={{ textDecoration: 'none' }}>
          <p style={{
            fontSize: '14px', fontFamily: 'var(--font-inter)', fontWeight: 600, color: '#ffffff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
          }}>{item.title}</p>
        </Link>
        <p style={{ fontSize: '12px', color: '#a9b4d0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.organization}
        </p>
      </div>

      {/* Status dropdown */}
      <select
        value={item.status ?? ''}
        onChange={e => onChangeStatus(item.tracking_id, item.opportunity_id, (e.target.value as DBStatus) || null)}
        style={{
          fontSize: '12px', fontFamily: 'var(--font-inter)', fontWeight: 600,
          background: item.status ? STATUS_META[item.status].bg : 'rgba(42,53,102,0.6)',
          color: item.status ? STATUS_META[item.status].color : '#a9b4d0',
          border: `1px solid ${item.status ? STATUS_META[item.status].border : '#2a3566'}`,
          borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
          outline: 'none', flexShrink: 0, appearance: 'none',
        }}
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
      background: '#141c3d', border: '1px solid #2a3566', borderRadius: '14px',
    }}>
      <div style={{ width: '56px', height: '20px', borderRadius: '100px', background: '#2a3566' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '12px', width: '55%', background: '#2a3566', borderRadius: '6px', marginBottom: '6px' }} />
        <div style={{ height: '10px', width: '35%', background: '#1b254a', borderRadius: '6px' }} />
      </div>
      <div style={{ height: '22px', width: '70px', background: '#2a3566', borderRadius: '100px' }} />
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, accent, action }: { title: string; accent: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <h2 style={{
        fontFamily: 'var(--font-sora)', fontSize: '16px', fontWeight: 700, color: '#ffffff',
        letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ width: '4px', height: '18px', background: accent, borderRadius: '100px', display: 'inline-block' }} />
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
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .dash-in { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0b1330', fontFamily: 'var(--font-inter)', color: '#ffffff' }}>
        <main style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* Greeting */}
          <div className="dash-in" style={{ marginBottom: '36px', animationDelay: '0ms' }}>
            <h1 style={{
              fontFamily: 'var(--font-sora)', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800,
              color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '6px',
            }}>
              Welcome back,{' '}
              <span style={{ background: 'linear-gradient(90deg, #2fe6d6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {firstName}
              </span>{' '}👋
            </h1>
            <p style={{ fontSize: '14px', color: '#a9b4d0' }}>
              {hasData
                ? `You're tracking ${tracked.length} opportunit${tracked.length === 1 ? 'y' : 'ies'}.`
                : 'Start tracking opportunities to see your progress here.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(255,107,74,0.1)', border: '1px solid rgba(255,107,74,0.3)', borderRadius: '12px', padding: '14px 18px', color: '#ff6b4a', fontSize: '14px', marginBottom: '24px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: '1 1 140px', height: '100px', background: '#141c3d', border: '1px solid #2a3566', borderRadius: '16px', animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
              </div>
            </div>

          ) : !hasData ? (
            /* Empty state */
            <div className="dash-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', animationDelay: '60ms' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(47,230,214,0.12), rgba(255,107,74,0.12))', border: '1px solid #2a3566', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '24px' }}>🔍</div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>Nothing tracked yet</h2>
              <p style={{ fontSize: '14px', color: '#a9b4d0', maxWidth: '360px', lineHeight: 1.6, marginBottom: '28px' }}>
                Bookmark opportunities or set a status on the Browse page — they'll show up here with deadline reminders.
              </p>
              <Link href="/opportunities" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', background: 'linear-gradient(135deg, #2fe6d6, #60a5fa)',
                borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                fontFamily: 'var(--font-sora)', color: '#0b1330', textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(47,230,214,0.25)',
              }}>Browse Opportunities →</Link>
            </div>

          ) : (
            <>
              {/* ── Stat Cards ── */}
              <section className="dash-in" style={{ marginBottom: '48px', animationDelay: '40ms' }}>
                <SectionHeader title="Overview" accent="linear-gradient(180deg,#2fe6d6,#60a5fa)" />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <StatCard icon={STAT_ICONS.bookmarked}  label="Bookmarked"  count={bookmarkedCount}  color="#f2c94c" bg="rgba(242,201,76,0.10)"  border="rgba(242,201,76,0.25)" />
                  <StatCard icon={STAT_ICONS.applied}     label="Applied"     count={appliedCount}     color="#60a5fa" bg="rgba(96,165,250,0.10)"  border="rgba(96,165,250,0.25)" />
                  <StatCard icon={STAT_ICONS.shortlisted} label="Shortlisted" count={shortlistedCount} color="#a78bfa" bg="rgba(167,139,250,0.10)" border="rgba(167,139,250,0.25)" />
                  <StatCard icon={STAT_ICONS.completed}   label="Completed"   count={completedCount}   color="#2fe6d6" bg="rgba(47,230,214,0.10)"  border="rgba(47,230,214,0.25)" />
                </div>
              </section>

              {/* ── Upcoming Deadlines ── */}
              <section className="dash-in" style={{ marginBottom: '48px', animationDelay: '100ms' }}>
                <SectionHeader
                  title="Upcoming Deadlines"
                  accent="linear-gradient(180deg,#ff6b4a,#f2c94c)"
                  action={<Link href="/opportunities" style={{ fontSize: '12px', fontWeight: 600, color: '#2fe6d6', textDecoration: 'none' }}>Browse all →</Link>}
                />

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  {[['#ff6b4a','Under 3 days'],['#f2c94c','Under 7 days'],['#2fe6d6','More time']].map(([c,l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, display: 'inline-block' }} />
                      <span style={{ fontSize: '11px', color: '#a9b4d0', fontWeight: 500 }}>{l}</span>
                    </div>
                  ))}
                </div>

                {upcoming.length === 0 ? (
                  <div style={{ padding: '32px', background: '#141c3d', border: '1px solid #2a3566', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#a9b4d0' }}>No upcoming deadlines — great job staying on top of things! 🎉</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {upcoming.map(item => <DeadlineRow key={item.tracking_id} item={item} />)}
                  </div>
                )}
              </section>

              {/* ── My Tracker ── */}
              <section className="dash-in" style={{ animationDelay: '160ms' }}>
                <SectionHeader
                  title="My Tracker"
                  accent="linear-gradient(180deg,#a78bfa,#60a5fa)"
                />

                {(['interested','applied','shortlisted','completed'] as DBStatus[]).map(status => {
                  const items = grouped[status]
                  if (items.length === 0) return null
                  const meta = STATUS_META[status]
                  return (
                    <div key={status} style={{ marginBottom: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
                          borderRadius: '100px', padding: '3px 12px',
                        }}>{meta.label}</span>
                        <span style={{ fontSize: '12px', color: '#a9b4d0' }}>{items.length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {items.map(item => (
                          <TrackerRow key={item.tracking_id} item={item} onChangeStatus={handleChangeStatus} />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Bookmarked but no status */}
                {noStatus.length > 0 && (
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: '#a9b4d0', background: 'rgba(169,180,208,0.1)', border: '1px solid rgba(169,180,208,0.2)',
                        borderRadius: '100px', padding: '3px 12px',
                      }}>Bookmarked / No Status</span>
                      <span style={{ fontSize: '12px', color: '#a9b4d0' }}>{noStatus.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
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
    </>
  )
}
