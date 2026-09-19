# Supabase schema

`0003_rebuild_full_app_schema.sql` is the full single-owner schema. It supersedes the earlier product-only prototype and removes anonymous access. It contains settings, categories, separate product tables, suspended baskets, permanent sales, sale-line snapshots, partial refunds, owner-only RLS, and receipt numbers beginning at `325100`.

Create the owner in Supabase Auth, sign in, then call `select public.claim_app_ownership();` once as that authenticated user.

These numbered migrations are manual copy/paste files. Do not automatically run, commit, push, or deploy them.
