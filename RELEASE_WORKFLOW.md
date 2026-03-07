# Release Workflow (Stable + Beta)

This project uses a dual-track workflow:
- `main` = stable production (currently `v1.1` baseline)
- `codex/v1.2-work` = beta development

## Branching Rules

1. Do all new work on `codex/v1.2-work`.
2. Never push unfinished beta changes directly to `main`.
3. Tag important checkpoints on beta (`v1.2.0-beta.x`).

## Deployment Tracks

1. Production deployment source: `main`
2. Staging/Beta deployment source: `codex/v1.2-work`
3. Keep production and beta on separate Hostinger deploy targets/URLs.

## Pre-Deploy Checks (Beta)

Run before each beta deploy:

1. `npm run build` must pass.
2. `GET /api/health` returns `200` with database `ok`.
3. Auth flows:
- signup works
- login works
- rate limit returns `429` after repeated attempts
4. Mobile checks:
- home/auth scroll works
- dashboard scroll works
- no table overlap
- no chunk-load errors in console
5. Runtime logs have no repeating 5xx bursts.

## Promotion Criteria (Beta -> Production)

Promote only when all are true:

1. Beta build stable for at least 24 hours.
2. No unresolved P0/P1 bugs.
3. `/api/health` stable during monitoring window.
4. Mobile + desktop sanity checks pass.

## Production Release Steps

1. Merge `codex/v1.2-work` into `main`.
2. Create release tag (example: `v1.2.0`).
3. Deploy `main` to production.
4. Smoke test:
- homepage load
- login/signup
- `/api/health`
- key pages (dashboard, trade log, analytics)

## Rollback Plan

If production incident occurs:

1. Redeploy previous stable tag immediately (example: `v1.1`).
2. Confirm `/api/health` and login work.
3. Announce rollback complete.
4. Debug on beta branch only; do not hotfix directly on unstable production state.

## Hotfix Rule

For urgent production fixes:

1. Create `hotfix/*` branch from `main`.
2. Fix + test + tag patch release (`v1.1.x`).
3. Deploy patch to production.
4. Cherry-pick/merge hotfix back into `codex/v1.2-work`.
