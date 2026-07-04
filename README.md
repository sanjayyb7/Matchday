# Matchday

Mobile-first web app for live football fan meetups in **San Francisco**.

Find nearby pubs, pick a team and player identity, join team chats, and see who's gathering at each pub in real time.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add NEXT_PUBLIC_MAPBOX_TOKEN from https://account.mapbox.com/
# Add API_FOOTBALL_KEY from https://www.api-football.com/ for live World Cup fixtures
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) and log in.

### Mock mode (default)

Leave `NEXT_PUBLIC_USE_INSFORGE=false`. Use **Log in** / **Create account** with the local demo session.

### InsForge backend mode

1. Link or create a project: `npx @insforge/cli login` then `npx @insforge/cli link` (or `create`)
2. Apply migrations: `npx @insforge/cli db migrations up --all`
3. Set in `.env.local`:
   ```env
   NEXT_PUBLIC_INSFORGE_URL=https://<appkey>.us-east.insforge.app
   NEXT_PUBLIC_INSFORGE_ANON_KEY=<from: npx @insforge/cli secrets get ANON_KEY>
   NEXT_PUBLIC_USE_INSFORGE=true
   NEXT_PUBLIC_APP_URL=http://localhost:3002
   ```
4. Sign in with **Google** or **GitHub** OAuth on `/login`

## Deploying

Production is deployed manually via `npx @insforge/cli deployments deploy .` — pushing to GitHub does not affect the live site. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the safe test-then-deploy workflow.

## Parallel frontend + backend workflow

| Branch | Purpose |
| --- | --- |
| `main` | Stable app; mock mode by default; frontend polish lands here |
| `backend/insforge-v2` | InsForge schema, adapters, OAuth (merged when ready) |

Optional second checkout for backend testing:

```bash
git worktree add ../Matchday-backend backend/insforge-v2
```

## MVP features

- Mock login or InsForge OAuth (Google, GitHub)
- Mapbox pub map with SF sports bars
- Live match flow: team → player selection
- Realtime presence + team chat (mock or InsForge)
- Pub live squad view with formation pitch
- Profile fan history + delete account

## Backend (InsForge)

- **Migrations:** [`migrations/`](migrations/) — schema, seed data, realtime channels
- **Adapters:** swap via `NEXT_PUBLIC_USE_INSFORGE=true`
  - Auth: `src/lib/auth/context.tsx`
  - Realtime: `src/lib/realtime/context.tsx`
  - History: `src/hooks/useHistory.ts`
- **Config:** [`insforge.toml`](insforge.toml)

## Stack

Next.js 16 · TypeScript · Tailwind · shadcn/ui · Mapbox · Zustand · Framer Motion · InsForge
