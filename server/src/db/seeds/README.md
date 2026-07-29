# Seeds

Execute these files after the clean schema and before stored procedures:

1. 001_subscription_plans.sql
2. 002_permissions_and_role_permissions.sql

Notes:
- payment_methods is tenant-specific because it requires idBusiness, so no global payment method rows are inserted for a blank installation.
- role_permissions is reseeded idempotently by deleting ADMIN/SELLER defaults and inserting the current defaults again.
