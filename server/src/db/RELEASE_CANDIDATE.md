# Cajora DB Baseline v1.0

Status: Release Candidate

## Checks

- Baseline build: required before release.
- Baseline validate: required before release.
- Server typecheck: required before release.
- Server build: required before release.
- Manual clean install: must be repeated after Product Gallery and Public Catalog baseline changes.
- Smoke test: operator checklist in `MANUAL_BASELINE_TEST.md`, including Product Gallery hardening regression cases and Public Storefront Catalog checks.

## Post-merge Operator Checklist

1. `npm run db:build-baseline`
2. `npm run db:validate-baseline`
3. `npm run db:local:reset -- --yes`
4. Run smoke test app flow.
5. Run Product Gallery smoke test.
6. Run Public Storefront Catalog smoke test.
7. Tag/release candidate.
8. Record video/demo.

## Notes

- No Git tag has been created by Codex.
- No release has been created by Codex.
- No DB-connected tests were executed by Codex.
- Product Gallery hardening is included in the baseline and must be smoke-tested manually before L.2/video.
- M.1 Public Catalog API is included in the baseline. Configure `PUBLIC_CATALOG_BUSINESS_SLUG` and `STOREFRONT_URL` before manual smoke tests.
- Public catalog smoke was not executed by Codex.
- Historical migration history remains available in Git.
