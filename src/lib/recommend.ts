import { INTEREST_KEYWORDS } from './constants'

export interface Profile { department: string; interests: string[]; skills: string[] }
interface Opp { title: string; description: string; skills: string[]; departments: string[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasWord = (text: string, kw: string) =>
  new RegExp(`(^|[^a-z0-9])${esc(kw)}([^a-z0-9]|$)`).test(text)

export function isEligible(opp: Opp, department: string) {
  return !opp.departments?.length || opp.departments.includes(department)
}

export function scoreOpportunity(opp: Opp, profile: Profile) {
  const reasons: string[] = []
  let score = 0

  const oppSkills = (opp.skills ?? []).map((s) => s.trim().toLowerCase())
  for (const s of profile.skills) {
    if (oppSkills.includes(s.trim().toLowerCase())) { score += 3; reasons.push(s) }
  }

  const haystack = `${opp.title} ${opp.description} ${oppSkills.join(' ')}`.toLowerCase()
  for (const interest of profile.interests) {
    const kws = INTEREST_KEYWORDS[interest] ?? [interest.toLowerCase()]
    if (kws.some((k) => hasWord(haystack, k))) { score += 2; reasons.push(interest) }
  }

  return { score, reasons: Array.from(new Set(reasons)) }
}
