-- OPTIONAL OPERATOR SCRIPT, NOT PART OF 007 OR THE BASELINE. Do not run automatically.
-- Backup and confirm host/DATABASE() first. After F10.1 deployment use PATCH /businesses/me
-- with business.update instead, if available. VITRUNO initial policy: enabled, ARS 50000, all categories.
-- Replace NULL with the VERIFIED tenant slug (matching PUBLIC_CATALOG_BUSINESS_SLUG).
SET @wholesale_business_slug = NULL;
START TRANSACTION;
UPDATE businesses
SET wholesale_enabled = 1, wholesale_minimum_amount = 50000.00, updated_at = NOW()
WHERE slug = @wholesale_business_slug AND is_active = 1 AND status = 'ACTIVE';
SELECT ROW_COUNT() AS affected_businesses; -- Must be exactly 1; otherwise ROLLBACK and investigate.
-- Review SELECT before choosing COMMIT; never enable all businesses.
SELECT slug, wholesale_enabled, wholesale_minimum_amount FROM businesses WHERE slug = @wholesale_business_slug;
ROLLBACK; -- Operator replaces with COMMIT only after verifying the target and result.
