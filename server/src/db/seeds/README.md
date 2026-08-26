# Seeds

Execute these files after the clean schema and before stored procedures:

1. 001_subscription_plans.sql
2. 002_permissions_and_role_permissions.sql
3. 003_legal_documents.sql

Notes:
- payment_methods is tenant-specific because it requires idBusiness, so no global payment method rows are inserted for a blank installation.
- role_permissions is reseeded idempotently by deleting ADMIN/SELLER defaults and inserting the current defaults again.
- legal_documents seeds only TERMS and PRIVACY metadata. Legal versions and official content must be published separately in legal_document_versions.
