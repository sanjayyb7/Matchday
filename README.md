# Matchday

Mobile-first web app for live football fan meetups in **San Francisco**.

Find nearby pubs, pick a team and player identity, join team chats, and see who's gathering at each pub in real time.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add NEXT_PUBLIC_MAPBOX_TOKEN from https://account.mapbox.com/
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) (or [http://127.0.0.1:3002](http://127.0.0.1:3002)) and log in or create an account.

## MVP features

- Mock login (no OAuth required)
- Mapbox pub map with SF sports bars
- Live match flow: team → player selection
- Simulated realtime: fan movement + team chat bots
- Pub live squad view
- Player profile pop-ups
- Profile page with fan history + delete account

## v2 backend

Structured with adapter interfaces for swapping to **InsForge** (auth, Postgres, realtime). See `src/lib/insforge/client.ts`.

## Stack

Next.js 15 · TypeScript · Tailwind · shadcn/ui · Mapbox · Zustand · Framer Motion
