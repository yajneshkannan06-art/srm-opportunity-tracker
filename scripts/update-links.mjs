// Script to update external_link for all opportunities
// Run with: node scripts/update-links.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qhginixfvrmlyxygfloy.supabase.co'
// Using the anon key — update will only work if RLS allows it or if you use service role
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('Need SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY env var.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  // 1. Fetch all opportunities
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select('id, title, type')

  if (error) {
    console.error('Fetch error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${opps.length} opportunities. Updating links...`)

  for (const opp of opps) {
    let link = ''
    const title = (opp.title || '').toLowerCase()

    if (opp.type === 'internship') {
      link = 'https://www.linkedin.com/jobs/'
    } else if (opp.type === 'hackathon') {
      link = 'https://devpost.com/hackathons'
    } else if (opp.type === 'certification') {
      link = 'https://www.coursera.org/'
    } else if (opp.type === 'workshop') {
      link = 'https://www.srmist.edu.in'
    } else {
      // competition — check for specific ones
      if (title.includes('leetcode')) {
        link = 'https://leetcode.com/contest/'
      } else if (title.includes('codechef')) {
        link = 'https://www.codechef.com/contests'
      } else {
        link = 'https://www.hackerrank.com/contests'
      }
    }

    // SRM override regardless of type
    if (title.includes('srm')) {
      link = 'https://www.srmist.edu.in'
    }

    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ external_link: link })
      .eq('id', opp.id)

    if (updateError) {
      console.error(`Failed to update "${opp.title}": ${updateError.message}`)
    } else {
      console.log(`  ✓ ${opp.title} → ${link}`)
    }
  }

  console.log('Done.')
}

run()
