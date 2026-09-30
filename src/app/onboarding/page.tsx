'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DEPARTMENTS, INTERESTS, SKILL_SUGGESTIONS } from '@/lib/constants'

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`chip ${active ? 'chip-active' : 'chip-inactive'}`}>
      {label}
    </button>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [department, setDepartment] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function prefill() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('student_profiles')
        .select('department, interests, skills').eq('user_id', user.id).maybeSingle()
      if (data) { setDepartment(data.department); setInterests(data.interests ?? []); setSkills(data.skills ?? []) }
    }
    prefill()
  }, [])

  const toggle = (list: string[], set: (v: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item])

  function addCustomSkill() {
    const s = customSkill.trim()
    if (s && !skills.some((x) => x.toLowerCase() === s.toLowerCase())) setSkills([...skills, s])
    setCustomSkill('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!department) return setError('Please select your department.')
    if (interests.length === 0) return setError('Pick at least one interest.')
    setLoading(true); setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('student_profiles').upsert({
      user_id: user.id, department, interests, skills, updated_at: new Date().toISOString(),
    })
    if (err) { setError(err.message); setLoading(false); return }

    router.refresh()
    router.push('/opportunities')
  }

  const allSkills = Array.from(new Set([...SKILL_SUGGESTIONS, ...skills]))

  return (
    <main className="min-h-screen bg-base px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #0f0e1f 0%, #0a0e1a 60%, #0f172a 100%)' }}>
      <form onSubmit={save} className="max-w-2xl mx-auto card bg-surface p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Tell us about you</h1>
          <p className="text-sm text-muted mt-1">We&apos;ll use this to suggest opportunities you can apply for.</p>
        </div>

        {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</div>}

        <section>
          <h2 className="text-sm font-semibold text-ink mb-3">Department</h2>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="input">
            <option value="" className="bg-surface">Select department</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d} className="bg-surface">{d}</option>)}
          </select>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => <Chip key={i} label={i} active={interests.includes(i)} onClick={() => toggle(interests, setInterests, i)} />)}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {allSkills.map((s) => <Chip key={s} label={s} active={skills.includes(s)} onClick={() => toggle(skills, setSkills, s)} />)}
          </div>
          <div className="flex gap-2">
            <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill() } }}
              placeholder="Add another skill"
              className="input flex-1" />
            <button type="button" onClick={addCustomSkill} className="btn-secondary px-5">Add</button>
          </div>
        </section>

        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Continue →'}
        </button>
      </form>
    </main>
  )
}
