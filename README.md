# ✅ Habit Tracker — PWA + AI Coach

A full-stack daily habit tracker with AI coaching, offline support, and cross-device sync.

## Features
- 📅 Today view with progress ring and streaks
- 📊 Stats: bar chart, heatmap, per-habit breakdown
- 📆 Weekly review with insights
- 🤖 AI Habit Coach powered by Claude
- 🔄 Cross-device sync via Supabase
- 📱 PWA — installable on Android/iOS
- 🔌 Offline-first via IndexedDB (Dexie)

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Environment Variables

| Variable | Where to get it |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | console.anthropic.com |
| `VITE_SUPABASE_URL` | supabase.com → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | supabase.com → Project Settings → API |

## Supabase SQL Schema

Run in Supabase SQL Editor:

```sql
create table public.habits (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  ei int not null default 0,
  ci int not null default 0,
  ti int not null default 3,
  created_at timestamptz default now()
);

create table public.completions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id text references public.habits(id) on delete cascade not null,
  date text not null
);

alter table public.habits      enable row level security;
alter table public.completions enable row level security;

create policy "habits: own" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions: own" on public.completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Deploy

```bash
npm run build
npx vercel --prod
```

## APK (Android sideload)
1. Deploy to Vercel to get an HTTPS URL
2. Go to pwabuilder.com → paste URL → Package for Android → Generate APK
3. Install via adb or file transfer

## Stack
- React 18 + Vite
- Dexie (IndexedDB)
- Supabase (auth + postgres)
- Anthropic Claude API
- vite-plugin-pwa (service worker + manifest)
