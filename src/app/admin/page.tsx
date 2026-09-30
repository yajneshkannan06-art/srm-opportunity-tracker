'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DEPARTMENTS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpportunityType = 'internship' | 'workshop' | 'hackathon' | 'certification' | 'competition'

interface Opportunity {
  id: string
  title: string
  type: OpportunityType
  organization: string
  description: string
  skills: string[]
  deadline: string
  external_link: string
  created_at: string
  departments: string[]
  is_free: boolean
}

const EMPTY_FORM = {
  title: '',
  type: 'internship' as OpportunityType,
  organization: '',
  description: '',
  skills: '',
  deadline: '',
  external_link: '',
  departments: [] as string[],
  is_free: false,
}

const TYPE_OPTIONS: OpportunityType[] = ['internship', 'workshop', 'hackathon', 'certification', 'competition']

const TYPE_COLORS: Record<OpportunityType, string> = {
  internship: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
  workshop: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  hackathon: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
  certification: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  competition: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()

  // Auth state
  const [authChecked, setAuthChecked] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  // Data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingOpps, setLoadingOpps] = useState(true)

  // Form state
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Auth guard ──
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.replace('/dashboard')
        return
      }
      setAdminEmail(profile.email ?? user.email ?? null)
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  // ── Load opportunities ──
  useEffect(() => {
    if (!authChecked) return
    fetchOpportunities()
  }, [authChecked])

  async function fetchOpportunities() {
    setLoadingOpps(true)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOpportunities(data)
    setLoadingOpps(false)
  }

  // ── Form helpers ──
  function startEdit(opp: Opportunity) {
    setEditingId(opp.id)
    setForm({
      title: opp.title,
      type: opp.type,
      organization: opp.organization,
      description: opp.description,
      skills: Array.isArray(opp.skills) ? opp.skills.join(', ') : '',
      deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
      external_link: opp.external_link ?? '',
      departments: opp.departments ?? [],
      is_free: opp.is_free ?? false,
    })
    setFormError(null)
    setFormSuccess(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormSuccess(null)
  }

  function field(key: keyof Pick<typeof EMPTY_FORM, 'title' | 'type' | 'organization' | 'description' | 'skills' | 'deadline' | 'external_link'>, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    setFormSuccess(null)

    if (!form.title.trim() || !form.organization.trim() || !form.deadline) {
      setFormError('Title, organization and deadline are required.')
      setFormLoading(false)
      return
    }

    const skillsArray = form.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      title: form.title.trim(),
      type: form.type,
      organization: form.organization.trim(),
      description: form.description.trim(),
      skills: skillsArray,
      deadline: new Date(form.deadline).toISOString(),
      external_link: form.external_link.trim(),
      departments: form.departments,
      is_free: form.is_free,
    }

    let error
    if (editingId) {
      const res = await supabase.from('opportunities').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('opportunities').insert(payload)
      error = res.error
    }

    if (error) {
      setFormError(error.message)
    } else {
      setFormSuccess(editingId ? 'Opportunity updated successfully!' : 'Opportunity added successfully!')
      cancelEdit()
      fetchOpportunities()
    }
    setFormLoading(false)
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError(null)
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (error) {
      setDeleteError(error.message)
    } else {
      setDeleteConfirmId(null)
      fetchOpportunities()
    }
    setDeleteLoading(false)
  }

  // ── Loading / access denied ──
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  const inputClass = 'input'
  const labelClass = 'block text-sm font-medium text-ink mb-1.5'

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Admin Panel</h1>
            <p className="text-muted text-sm mt-0.5">Signed in as <span className="text-primary">{adminEmail}</span></p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primaryHover text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin
          </div>
        </div>

        {/* ── Add / Edit Form ── */}
        <div className="card bg-surface p-6 sm:p-8 mb-10">
          <h2 className="text-lg font-semibold text-ink mb-6">
            {editingId ? '✏️ Edit Opportunity' : '➕ Add New Opportunity'}
          </h2>

          {/* Success banner */}
          {formSuccess && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {formSuccess}
            </div>
          )}

          {/* Error banner */}
          {formError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Title *</label>
              <input id="admin-title" type="text" className={inputClass} placeholder="e.g. Frontend Developer Intern" value={form.title} onChange={e => field('title', e.target.value)} required />
            </div>

            {/* Type */}
            <div>
              <label className={labelClass}>Type *</label>
              <select id="admin-type" className={inputClass + ' cursor-pointer'} value={form.type} onChange={e => field('type', e.target.value as OpportunityType)}>
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t} className="bg-[#141c3d]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Organization */}
            <div>
              <label className={labelClass}>Organization *</label>
              <input id="admin-org" type="text" className={inputClass} placeholder="e.g. Google, SRM University" value={form.organization} onChange={e => field('organization', e.target.value)} required />
            </div>

            {/* Deadline */}
            <div>
              <label className={labelClass}>Deadline *</label>
              <input id="admin-deadline" type="date" className={inputClass} value={form.deadline} onChange={e => field('deadline', e.target.value)} required />
            </div>

            {/* External link */}
            <div>
              <label className={labelClass}>External Link</label>
              <input id="admin-link" type="url" className={inputClass} placeholder="https://..." value={form.external_link} onChange={e => field('external_link', e.target.value)} />
            </div>

            {/* Skills */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Skills <span className="text-slate-500 font-normal">(comma-separated)</span></label>
              <input id="admin-skills" type="text" className={inputClass} placeholder="e.g. React, TypeScript, Node.js" value={form.skills} onChange={e => field('skills', e.target.value)} />
            </div>

            {/* Free of cost */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_free}
                  onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))} />
                Free of cost
              </label>
            </div>

            {/* Eligible departments */}
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-300 mb-2">Eligible departments <span className="text-slate-500">(none selected = all)</span></p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.departments.includes(d)}
                      onChange={() => setForm((f) => ({
                        ...f,
                        departments: f.departments.includes(d) ? f.departments.filter((x) => x !== d) : [...f.departments, d],
                      }))} />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea id="admin-description" rows={4} className={inputClass + ' resize-none'} placeholder="Describe the opportunity…" value={form.description} onChange={e => field('description', e.target.value)} />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                id="admin-submit-btn"
                type="submit"
                disabled={formLoading}
                className="btn-primary"
              >
                {formLoading && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {editingId ? 'Save changes' : 'Add opportunity'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Delete error ── */}
        {deleteError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Delete failed: {deleteError}
          </div>
        )}

        {/* ── Opportunities Table ── */}
        <div className="card bg-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              All Opportunities
              <span className="ml-2 text-xs text-muted font-normal">({opportunities.length})</span>
            </h2>
            {loadingOpps && (
              <svg className="animate-spin w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>

          {opportunities.length === 0 && !loadingOpps ? (
            <div className="py-16 text-center text-muted text-sm">No opportunities yet. Add one above!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden md:table-cell">Organization</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden lg:table-cell">Deadline</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {opportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-surface2 transition-colors group">
                      <td className="px-6 py-4 text-ink font-medium max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{opp.title}</span>
                          {opp.is_free && (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">FREE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${TYPE_COLORS[opp.type] ?? ''}`}>
                          {opp.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted hidden md:table-cell max-w-[160px]">
                        <div className="truncate">{opp.organization}</div>
                      </td>
                      <td className="px-4 py-4 text-muted hidden lg:table-cell">
                        {opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {deleteConfirmId === opp.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-slate-400 text-xs mr-1">Are you sure?</span>
                            <button
                              onClick={() => handleDelete(opp.id)}
                              disabled={deleteLoading}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-60 transition-colors"
                            >
                              {deleteLoading ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-3">
                            <button
                              id={`edit-btn-${opp.id}`}
                              onClick={() => startEdit(opp)}
                              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              id={`delete-btn-${opp.id}`}
                              onClick={() => { setDeleteConfirmId(opp.id); setDeleteError(null) }}
                              className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
