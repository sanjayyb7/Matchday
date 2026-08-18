# Matchday — Session Summary

**Project:** Matchday (Next.js + InsForge + Mapbox)  
**Path:** `/Users/sanjay/Documents/Matchday`  
**Branch:** `backend/insforge-v2`  
**Date:** June 2026

---

## What Matchday Is

A mobile-first web app for SF football fan meetups: pub map, team/player identity, team chat, and live squad views. Backend uses **InsForge** (Postgres, auth, realtime). Toggle with `NEXT_PUBLIC_USE_INSFORGE=true` in `.env.local`.

---

## Environment Setup

| Item | Location / value |
|------|------------------|
| Env file | `/Users/sanjay/Documents/Matchday/.env.local` (hidden — press **Cmd+Shift+.** in Finder) |
| Template | `.env.example` |
| Dev server | `npm run dev` → http://localhost:3002 |
| Mapbox | `NEXT_PUBLIC_MAPBOX_TOKEN` required for full map |
| InsForge | URL, anon key, API key in `.env.local` |

**Important:** Use `http://localhost:3002` (not `127.0.0.1`) so auth cookies work.

---

## Authentication & Sessions

- **InsForge mode:** Google OAuth → cookies (`insforge_access_token`, refresh token) → session restored via `/api/auth/refresh`
- **Mock mode:** `localStorage` key `matchday:session`
- Profiles live in `public.profiles`; role column: `fan` or `admin`

**Promote yourself to admin:**

```bash
npx @insforge/cli db query "SELECT id, display_name, role FROM public.profiles" --json
npx @insforge/cli db query "UPDATE public.profiles SET role = 'admin' WHERE id = '<your-uuid>';"
```

Then sign out and back in.

---

## Admin: Pub Management (`/matchday-matcha`)

- Admin-only route (not `/admin`)
- Add pubs: name, address, neighborhood, **latitude**, **longitude**, optional image URL
- Data saved to Postgres `public.pubs` table
- RLS: only `role = admin` can insert/update/delete pubs

**Coordinate rule:** San Francisco longitude must be **negative** (e.g. `-122.4148`, not `122.4148`). Positive longitude places markers off the map (Asia). Validation rejects bad coords; no auto-fix on add.

---

## Map & New Pubs

- Map reads pub list from InsForge when enabled
- After adding a pub, go to `/map` to see markers
- `usePubs()` hook keeps the map in sync when the catalog changes
- Migration fixed existing pubs that had positive longitudes

---

## Pre-Match Flow & Team Chat

- Before each match: **bottom sheet** (not center dialog) to pick **team → player**
- Choice saved as match identity → unlocks **team group chat** for that match
- Chat tab routes to `/chat/{teamId}` when identity matches active match
- Without a pick: `/chat` shows “Pick your side first”

---

## Key URLs (local)

| URL | Purpose |
|-----|---------|
| http://localhost:3002/login | Sign in (Google) |
| http://localhost:3002/map | Pub map |
| http://localhost:3002/matchday-matcha | Admin pub management |
| http://localhost:3002/chat | Team chat (after pick) |
| http://localhost:3002/profile | Profile, logout, admin link |

---

## Git

Latest backend work committed on `backend/insforge-v2`:

- InsForge OAuth/session fixes
- Admin pub management + RLS migrations
- Pre-match bottom sheet + chat routing
- Map pub sync + coordinate validation

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't see `.env.local` | **Cmd+Shift+.** in Finder, or **Cmd+P** → `.env.local` in Cursor |
| OAuth / session fails | Use `localhost:3002` consistently |
| Admin page redirects | Promote profile to `admin`, re-login |
| Pub not on map | Check lng is negative (~-122.x); refresh `/map` |
| iCloud full | Edit files in Cursor; free iCloud space for sync |

---

*Generated from Cursor session. Do not share `.env.local` or API keys.*
