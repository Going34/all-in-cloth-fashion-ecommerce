# Database Migrations Guide

## Overview

This project uses **Supabase CLI** for all database migrations. The custom migration system has been removed and replaced with the industry-standard Supabase CLI workflow.

## Baseline Migration Explained

### What is a Baseline Migration?

The `000_baseline.sql` file represents the **current production schema** at the time of migration system conversion. This file:

- ✅ Contains the complete schema snapshot (tables, enums, functions, views, RLS policies, etc.)
- ✅ Is marked as already applied in production (won't execute on existing databases)
- ✅ Serves as the starting point for all future migrations
- ✅ Uses `IF NOT EXISTS` where applicable for safety

### Why Baseline?

Without a baseline:
- ❌ Migration history ≠ real schema
- ❌ New dev environments will drift
- ❌ Production deployments will fail
- ❌ Schema changes become unpredictable

With a baseline:
- ✅ Migration history matches reality
- ✅ New environments start from correct schema
- ✅ Production deployments are deterministic
- ✅ All future changes are tracked

### ⚠️ DO NOT MODIFY BASELINE

**The baseline migration (`000_baseline.sql`) must NEVER be modified.**

- It represents the production state at conversion time
- Modifying it breaks migration history
- New environments depend on it being accurate
- Use new numbered migrations for all changes

## How to Add a New Migration

### Step 1: Create Migration File

Create a new migration file in `supabase/migrations/` following the naming pattern:

```bash
# Format: <timestamp>_<description>.sql
# Example: 20240115120000_add_user_preferences.sql
```

Or use Supabase CLI to generate:

```bash
npx supabase migration new add_user_preferences
```

### Step 2: Write Migration SQL

Use **forward-only** migrations with safe patterns:

```sql
-- ✅ GOOD: Safe migration patterns
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin(preferences);
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS price_check CHECK (base_price > 0);

-- ❌ BAD: Destructive or unsafe patterns
DROP TABLE users;  -- Never drop tables without explicit migration
ALTER TABLE products DROP COLUMN description;  -- Use separate migration with data migration
```

### Step 3: Test Locally

```bash
# Start local Supabase (if using local development)
npx supabase start

# Apply migration locally
npx supabase db push

# Verify changes
npx supabase db diff
```

### Step 4: Commit and Deploy

```bash
# Commit migration file
git add supabase/migrations/20240115120000_add_user_preferences.sql
git commit -m "Add user preferences column"

# Deploy to production
npx supabase db push --linked
```

## Migration Workflow

### Local Development

```bash
# 1. Start local Supabase instance
npx supabase start

# 2. Pull latest schema from remote (if needed)
npx supabase db pull

# 3. Create new migration
npx supabase migration new my_change

# 4. Edit the generated migration file
# Edit: supabase/migrations/<timestamp>_my_change.sql

# 5. Apply migration locally
npx supabase db push

# 6. Verify
npx supabase db diff
```

### Production Deployment

```bash
# 1. Ensure you're linked to production
npx supabase link --project-ref <your-project-ref>

# 2. Push migrations (applies only pending migrations)
npx supabase db push

# 3. Verify migration status
npx supabase migration list
```

### Syncing Schema Changes

If schema was changed manually (not recommended), sync it:

```bash
# Pull current schema and create migration
npx supabase db pull

# Review the generated migration
# Then apply it
npx supabase db push
```

## What NOT to Do

### ❌ Never Edit Dashboard Schema Directly

**Problem:** Changes made in Supabase Dashboard are not tracked in migrations.

**Solution:** Always create a migration file for schema changes.

```bash
# ❌ BAD: Adding column via Dashboard
# ✅ GOOD: Create migration file
npx supabase migration new add_column
# Then edit the file and push
```

### ❌ Never Execute SQL via API

**Problem:** Runtime SQL execution bypasses migration tracking.

**Solution:** All SQL changes go through migration files.

```bash
# ❌ BAD: POST /api/migrations/run (removed)
# ✅ GOOD: Create migration file and use CLI
npx supabase db push
```

### ❌ Never Modify Baseline Migration

**Problem:** Baseline represents production state. Modifying it breaks history.

**Solution:** Create new migrations for all changes.

```bash
# ❌ BAD: Editing 000_baseline.sql
# ✅ GOOD: Create 001_new_feature.sql
```

### ❌ Never Skip Migration Tracking

**Problem:** Manual SQL execution doesn't update migration history.

**Solution:** Always use `supabase db push` which tracks migrations automatically.

## Migration Best Practices

### 1. One Logical Change Per Migration

```sql
-- ✅ GOOD: Single logical change
-- Migration: 001_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences JSONB;
CREATE INDEX idx_users_preferences ON users USING gin(preferences);

-- ❌ BAD: Multiple unrelated changes
-- Migration: 001_many_changes.sql
ALTER TABLE users ADD COLUMN preferences JSONB;
ALTER TABLE products ADD COLUMN discount DECIMAL;
ALTER TABLE orders DROP COLUMN notes;
```

### 2. Use IF NOT EXISTS

```sql
-- ✅ GOOD: Safe, idempotent
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ❌ BAD: Fails if already exists
CREATE INDEX idx_users_email ON users(email);
```

### 3. Test Migrations Locally First

```bash
# Always test before production
npx supabase start
npx supabase db push
# Verify application works
npx supabase stop
```

### 4. Review Generated Migrations

When using `supabase db pull`, review the generated migration:

```bash
# Review what will change
npx supabase db diff

# Pull creates migration file
npx supabase db pull

# Review the file before applying
cat supabase/migrations/<new_file>.sql
```

### 5. Use Transactions (Automatic)

Supabase CLI runs each migration in a transaction automatically. If a migration fails, it's rolled back.

## Troubleshooting

### Migration Already Applied

If a migration shows as already applied but you need to re-run it:

```bash
# Mark migration as not applied (use with caution)
npx supabase migration repair <migration_name> --status reverted

# Then re-apply
npx supabase db push
```

### Migration Failed

If a migration fails:

1. **Check the error message** - Usually indicates the problem
2. **Fix the migration file** - Correct the SQL
3. **Repair migration status** - Mark as reverted
4. **Re-apply** - Push again

```bash
# Mark failed migration as reverted
npx supabase migration repair <failed_migration> --status reverted

# Fix the migration file
# Then push again
npx supabase db push
```

### Schema Drift

If local schema doesn't match migrations:

```bash
# Reset local database (⚠️ deletes local data)
npx supabase db reset

# Or pull current schema
npx supabase db pull
```

### Migration History Mismatch

If Supabase CLI reports migration history mismatch:

```bash
# Check migration status
npx supabase migration list

# Repair specific migrations if needed
npx supabase migration repair <migration_name> --status applied
```

## Legacy Migration System

The old custom migration system has been **completely removed**:

- ❌ `utils/migrationRunner.ts` - Deleted
- ❌ `scripts/run-migrations.ts` - Deleted
- ❌ `scripts/execute-migrations.ts` - Deleted
- ❌ `app/api/migrations/*` - Deleted
- ❌ `app/admin/migrations` - Deleted
- ❌ Old migration files - Archived to `.archive/`

The legacy `schema_migrations` table has been renamed to `schema_migrations_legacy` and is preserved for historical reference only.

## Quick Reference

| Task | Command |
|------|---------|
| Create new migration | `npx supabase migration new <name>` |
| Apply migrations | `npx supabase db push` |
| Check status | `npx supabase migration list` |
| Pull schema | `npx supabase db pull` |
| View diff | `npx supabase db diff` |
| Start local | `npx supabase start` |
| Stop local | `npx supabase stop` |
| Reset local | `npx supabase db reset` |

## Need Help?

- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **Migration Best Practices:** https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Troubleshooting:** Check error messages and Supabase dashboard logs

---

**Remember:** All schema changes must go through migration files. No exceptions.









