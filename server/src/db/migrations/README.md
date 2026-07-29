# Migrations

Historical correction scripts belong here.

The clean schema in ../schema is for new installations from an empty database.
Existing installations should be updated with migration/fix scripts, not by replaying the clean schema over production data.

Copied historical scripts:

1. 001_fix_collations.sql
2. 002_subscriptions_pk_fix.sql

The original files in ../fixed were left untouched for compatibility with the
current workspace history.
