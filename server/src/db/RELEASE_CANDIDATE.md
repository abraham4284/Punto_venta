# Cajora DB Baseline v1.0

Status: Release Candidate

## Checks

- Baseline build: required before release.
- Baseline validate: required before release.
- Server typecheck: required before release.
- Server build: required before release.
- Manual clean install: must be repeated after Product Gallery, Public Catalog and Product Rich Content baseline changes.
- Smoke test: operator checklist in `MANUAL_BASELINE_TEST.md`, including Product Gallery hardening regression cases, Product Rich Content checks and Public Storefront Catalog checks.

## Post-merge Operator Checklist

1. `npm run db:build-baseline`
2. `npm run db:validate-baseline`
3. `npm run db:local:reset -- --yes`
4. Run smoke test app flow.
5. Run Product Gallery smoke test.
6. Run Product Rich Content smoke test.
7. Run Public Storefront Catalog smoke test.
8. Tag/release candidate.
9. Record video/demo.

## Notes

- No Git tag has been created by Codex.
- No release has been created by Codex.
- No DB-connected tests were executed by Codex.
- Product Gallery hardening is included in the baseline and must be smoke-tested manually before L.2/video.
- M.1 Public Catalog API is included in the baseline. Configure `PUBLIC_CATALOG_BUSINESS_SLUG` and `STOREFRONT_URL` before manual smoke tests.
- N.1 Product Rich Content is included in the baseline. Existing pre-release databases need the documented manual column add plus refreshed product/catalog procedures, or a clean reinstall.
- M.2 Public Catalog Main Deposit Stock is included in the baseline. Public `stockAvailable` and `available` now use only the active default deposit, without fallback to secondary deposits.
- Public catalog smoke was not executed by Codex.
- Product rich content smoke was not executed by Codex.
- Historical migration history remains available in Git.
