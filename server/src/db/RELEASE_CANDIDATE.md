# Cajora DB Baseline v1.0

Status: Release Candidate

## Checks

- Baseline build: required before release.
- Baseline validate: required before release.
- Server typecheck: required before release.
- Server build: required before release.
- Manual clean install: must be repeated after Product Gallery baseline changes.
- Smoke test: operator checklist in `MANUAL_BASELINE_TEST.md`.

## Post-merge Operator Checklist

1. `npm run db:build-baseline`
2. `npm run db:validate-baseline`
3. `npm run db:local:reset -- --yes`
4. Run smoke test app flow.
5. Run Product Gallery smoke test.
6. Tag/release candidate.
7. Record video/demo.

## Notes

- No Git tag has been created by Codex.
- No release has been created by Codex.
- No DB-connected tests were executed by Codex.
- Historical migration history remains available in Git.
