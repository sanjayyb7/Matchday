# Deploy Workflow

How to ship changes safely. Read this before deploying.

## The one thing to remember

**`git push` does NOT deploy to production.** Your live site only changes when you run:

```bash
npx @insforge/cli deployments deploy .
```

Git (GitHub) and production are completely separate. `deploy` always ships your **local files**, not what is on GitHub. You can commit and push as much as you want without affecting the live site.

```
Your local files --(git push)--------> GitHub repo
Your local files --(insforge deploy)--> Live site
GitHub repo -------(never auto-deploys)-> Live site
```

## URLs

| Environment | URL | Purpose |
| --- | --- | --- |
| Local dev | http://localhost:3002 | Test changes here first |
| Production (custom) | https://matchday.insforge.site | Live app |
| Production (default) | https://f3efi8df.insforge.site | Same deployment, default domain |
| Backend API | https://f3efi8df.us-east.insforge.app | Database, auth, realtime (unaffected by frontend deploys) |

Repo: https://github.com/sanjayyb7/Matchday

## The safe order (every change)

1. **Branch** (optional): `git checkout -b feature/my-change`
2. **Edit** code
3. **Test locally**: `npm run dev`, then run the browser checklist on http://localhost:3002
4. **Build check**: `npm run build` (catches errors before deploy)
5. **Commit**: `git add -A && git commit -m "..."`
6. **Push to GitHub**: `git push` — SAFE, does not touch production
7. **Deploy** only when happy: `npx @insforge/cli deployments deploy .`
8. **Verify production**: hard-refresh (Cmd+Shift+R) https://matchday.insforge.site

Steps 5-6 are always safe. Step 7 is the only one that changes the live site.

## Browser checklist

Walk through anything you changed, plus these core paths (local first, then production after deploy):

| Page / flow | What to verify |
| --- | --- |
| `/login` | OAuth or demo login works |
| `/chat` | Match list or demo banner loads; can pick team + player |
| `/map` | Map renders; pubs visible |
| `/chat/[teamId]` | Team chat loads after picking identity |
| `/profile` | Profile and history load |
| `/matchday-matcha` | Admin pub tools (if you changed admin code) |

For match/schedule changes, also check the API:

```bash
curl -s http://localhost:3002/api/matches/active | python3 -m json.tool
```

Confirm `source`, fixture count, and statuses look right.

For backend/schema changes, run:

```bash
npm run backend:smoke
```

## Rollback

Because you commit + push before deploying, you always have a known-good commit to redeploy if a deploy breaks production:

```bash
git checkout <last-good-commit>
npx @insforge/cli deployments deploy .
git checkout backend/insforge-v2
```

Find the commit with `git log --oneline`.

## If you change the public URL or OAuth callbacks

Update these **before** deploying, or login will break:

1. `NEXT_PUBLIC_APP_URL` — `npx @insforge/cli deployments env set NEXT_PUBLIC_APP_URL=https://<new-url>`
2. `allowed_redirect_urls` in [`insforge.toml`](../insforge.toml), then `npx @insforge/cli config apply`
3. Google/GitHub OAuth console redirect URIs

## Useful commands

```bash
npx @insforge/cli deployments metadata   # current deployment + URLs
npx @insforge/cli deployments list        # deployment history
npx @insforge/cli deployments env list    # production env vars
```
