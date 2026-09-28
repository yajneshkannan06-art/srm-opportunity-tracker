# SRM Opportunity Tracker

A student-facing web app to discover, bookmark, and track internships, hackathons, workshops, certifications, and competitions — all in one place.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Features

- 🔍 **Browse** – Filter and sort opportunities by type, skill, and deadline
- ⭐ **Bookmark** – Star opportunities to save them
- 📊 **Track** – Set status (Interested → Applied → Shortlisted → Completed)
- 📅 **Dashboard** – Upcoming deadlines with urgency color-coding, grouped tracker view
- 🔒 **Admin Panel** – Add, edit, and delete opportunities (admin role only)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yajneshkannan06-art/srm-opportunity-tracker.git
cd srm-opportunity-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

> **Note:** If port 3000 is already in use, Next.js will automatically use port 3001.

## Database Setup

Run the following SQL in your Supabase SQL Editor to set up auto user creation on signup:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin CRUD panel
│   ├── dashboard/      # Student dashboard
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── opportunities/  # Browse + detail pages
├── components/
│   └── Navbar.tsx      # Global navigation
└── lib/
    ├── supabase.ts          # Browser client
    └── supabase-server.ts   # Server client (SSR)
```