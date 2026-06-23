# Matchday — Project Overview

Mobile-first web app for live football fan meetups in **San Francisco**. Fans find nearby pubs on a map, pick a team and player identity for the current match, join squad chat, and see who is gathering at each pub in real time.

**Live URL (local):** [http://localhost:3002](http://localhost:3002)

---

## What it does

| Area | Description |
| --- | --- |
| **Map** | Mapbox map of SF sports bars with live fan presence markers |
| **Match identity** | On login, pick your team → pick your player for the live/upcoming match |
| **Team chat** | Per-team squad chat with quick replies and story-style avatars |
| **Pub squad** | Tap a pub to see fans checked in, formation pitch view, and reward coupons |
| **Profile** | Fan history timeline, theme selector, account deletion |

Demo data ships with **Spain vs France** as the featured match and ~10 SF pubs.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Framer Motion |
| Maps | Mapbox GL + react-map-gl |
| Client state | Zustand (persisted identity) |
| Backend (optional) | [InsForge](https://insforge.dev) — Postgres, auth, realtime, RLS |
| SDK | `@insforge/sdk` |

---

## Repository structure

```
Matchday/
├── src/
│   ├── app/                    # Next.js routes
│   │   ├── (app)/              # Authenticated shell (map, chat, profile)
│   │   ├── api/auth/           # OAuth callback, refresh, sign-out, delete
│   │   ├── login/ signup/      # Auth pages
│   │   └── matchday-matcha/    # Admin pub management (admin role)
│   ├── components/
│   │   ├── auth/               # Login, signup, OAuth buttons
│   │   ├── chat/               # Thread, input, bubbles, stories
│   │   ├── map/                # PubMap, markers
│   │   ├── match/              # Team/player picker, match modal
│   │   ├── pub/                # Squad sheet, formation pitch, coupons
│   │   ├── profile/            # History, delete account
│   │   └── ui/                 # shadcn primitives
│   ├── hooks/                  # useAuth, useTeamChat, useMatchIdentity, …
│   ├── lib/
│   │   ├── auth/               # Mock + InsForge auth adapters
│   │   ├── history/            # Mock + InsForge match history
│   │   ├── insforge/           # Client, server, config, bootstrap
│   │   ├── mock/               # Demo teams, players, pubs, fans
│   │   └── realtime/           # Mock + InsForge presence/chat
│   ├── store/                  # matchday-store, theme-store
│   └── types/                  # Shared TypeScript types
├── migrations/                 # InsForge SQL migrations
├── scripts/                    # backend-smoke.mjs
├── insforge.toml               # InsForge project config
├── .env.example                # Environment template
└── README.md                   # Quick start
```

---

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to login or map |
| `/login` | Sign in (demo or OAuth) |
| `/signup` | Create demo account |
| `/map` | Main pub map |
| `/chat` | Redirect to team chat |
| `/chat/[teamId]` | Team squad chat (e.g. `/chat/spain`) |
| `/profile` | Fan profile and history |
| `/matchday-matcha` | Admin pub CRUD (requires `admin` role) |
| `/api/auth/callback` | OAuth redirect handler |
| `/api/auth/refresh` | Session refresh (InsForge) |
| `/api/auth/sign-out` | Clear auth cookies |
| `/api/auth/delete-account` | Delete user data + auth |

---

## Running locally

### 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

Add a Mapbox token from [account.mapbox.com](https://account.mapbox.com/):

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

### 2. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

### 3. Mock mode (recommended for local UI work)

In `.env.local`:

```env
NEXT_PUBLIC_USE_INSFORGE=false
```

Use the yellow **Log in** or **Create account** buttons — no OAuth setup required. Session is stored in `localStorage`.

### 4. InsForge backend mode

```bash
npx @insforge/cli login
npx @insforge/cli link          # or create
npx @insforge/cli db migrations up --all
```

```env
NEXT_PUBLIC_INSFORGE_URL=https://<appkey>.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<from: npx @insforge/cli secrets get ANON_KEY>
NEXT_PUBLIC_USE_INSFORGE=true
NEXT_PUBLIC_APP_URL=http://localhost:3002
INSFORGE_API_KEY=<server key>
```

Sign in with **Google** or **GitHub** on `/login`. OAuth redirect URLs must include `http://localhost:3002/api/auth/callback` (see `insforge.toml`).

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public token for the pub map |
| `NEXT_PUBLIC_USE_INSFORGE` | No | `true` = InsForge backend; `false` = mock (default) |
| `NEXT_PUBLIC_INSFORGE_URL` | InsForge | Project API base URL |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | InsForge | Public anon key for client SDK |
| `NEXT_PUBLIC_APP_URL` | InsForge | App origin for OAuth redirects (default `http://localhost:3002`) |
| `INSFORGE_API_KEY` | InsForge | Server-only key for admin/delete operations |
| `API_FOOTBALL_KEY` | WC fixtures | Server-only key from [api-football.com](https://www.api-football.com/) |
| `API_FOOTBALL_WC_LEAGUE_ID` | No | World Cup league id (default `1`) |
| `API_FOOTBALL_WC_SEASON` | No | World Cup season year (default `2026`) |
| `MATCH_FIXTURE_DURATION_MINUTES` | No | Assumed match length for selection window end (default `105`) |

Never commit `.env.local`.

---

## World Cup fixtures and team picker timing

When `API_FOOTBALL_KEY` is set, the app loads **FIFA World Cup** fixtures from API-Football via [`GET /api/matches/active`](src/app/api/matches/active/route.ts) (cached 15 minutes). Without the key, it falls back to [`data/matches.json`](data/matches.json).

**Team/player picker rules:**

- Modal opens only from **1 hour before kickoff** until the fixture ends.
- Each user picks **once per fixture** (`user_identities` unique on `user_id, match_id`).
- Match status (`upcoming` / `live` / `finished`) is **derived from kickoff time**, not stored statically.

**Manual test checklist:**

| Scenario | Expected |
| --- | --- |
| \>1h before kickoff | No picker modal; chat gate shows countdown |
| 30 min before kickoff | Picker opens automatically |
| After team + player selected | Modal stays closed for that fixture |
| After fixture ends without pick | Modal stays closed; chat gate explains window closed |
| No WC match today | Graceful empty state |

API-Football free tier: ~100 requests/day — the active-match route caches responses server-side to stay within limits.

---

## Architecture

### Dual-mode adapters

The app runs in **mock mode** or **InsForge mode**, toggled by `NEXT_PUBLIC_USE_INSFORGE`:

| Concern | Mock | InsForge |
| --- | --- | --- |
| Auth | `src/lib/auth/mock-auth.ts` | `@insforge/sdk` + OAuth |
| Realtime (presence, chat) | `src/lib/realtime/mock-provider.ts` | `src/lib/realtime/insforge-provider.ts` |
| Match history | `src/lib/history/mock-adapter.ts` | `src/lib/history/insforge-adapter.ts` |
| User identity | Zustand + localStorage | `user_identities` table + RLS |

Entry points: `src/lib/auth/context.tsx`, `src/lib/realtime/context.tsx`, `src/hooks/useHistory.ts`.

### Match flow

1. User logs in → `useMatchIdentity` checks if identity exists for the live/upcoming match.
2. If not, `MatchNotification` modal opens: **Pick your side** → **Pick your player**.
3. Identity is saved to Zustand (persisted) and optionally synced to InsForge.
4. User appears on the map with their player avatar; chat is scoped to their team.

### Client state (`matchday-store`)

Persisted to `localStorage` under `matchday:store`:

- `identity` — current match team + player selection
- Ephemeral UI: selected pub, match modal step, player profile modal

---

## Database (InsForge)

Migrations in `migrations/`:

| Migration | Purpose |
| --- | --- |
| `create-matchday-schema` | Core tables + RLS policies |
| `seed-matchday-data` | Teams, players, pubs, match |
| `create-realtime-channels` | Realtime subscriptions |
| `rls-delete-and-seed-fix` | Delete policies + seed fixes |
| `admin-role-pub-write` | Admin pub management |
| `backfill-profiles` | Profile backfill for existing users |

Key tables: `profiles`, `teams`, `players`, `pubs`, `matches`, `user_identities`, `fan_presence`, `chat_messages`, `match_history`.

---

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Stable app; mock mode by default; frontend polish |
| `backend/insforge-v2` | InsForge schema, OAuth, adapter swap, admin tools |

Parallel checkout for backend work:

```bash
git worktree add ../Matchday-backend backend/insforge-v2
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on port **3002** |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run backend:smoke` | Smoke-test InsForge connectivity |

---

## Recent UI changes (`backend/insforge-v2`)

- **Player picker** — list layout with visible jersey number, avatar, name, and position
- **Match modal** — wider on mobile (`w-[calc(100%-2rem)]`)
- **Chat** — plain dark background (`#0B0F14`); team stripe overlay removed

---

## InsForge project

- **Project name:** matchday
- **API base:** `https://f3efi8df.us-east.insforge.app`
- **Config:** `insforge.toml`, `.insforge/project.json` (CLI, not committed)

For backend work, use the InsForge CLI skills: migrations, RLS, OAuth setup, and deploys via `npx @insforge/cli`.

---

## License

Private project — see repository owner for usage terms.
