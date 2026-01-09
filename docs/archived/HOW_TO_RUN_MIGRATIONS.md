# How to Run Database Migrations

## Quick Start Guide

### Method 1: Supabase Dashboard (Easiest - Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migrations in Order**

   **Step 1: Create Migration Tracking Table**
   ```sql
   -- Copy and paste the contents of:
   -- supabase/migrations/000_create_migrations_table.sql
   ```
   Execute this first - it creates the table that tracks which migrations have run.

   **Step 2: Run All Schema Migrations**
   ```sql
   -- Copy and paste the contents of each file in order:
   -- 001_enums_and_extensions.sql
   -- 002_user_management.sql
   -- 003_product_catalog.sql
   -- 004_product_variants.sql
   -- 005_shopping_features.sql
   -- 006_orders.sql
   -- 007_payments.sql
   -- 008_user_data.sql
   -- 009_coupons.sql
   -- 010_audit_logs.sql
   -- 011_functions.sql
   -- 012_views.sql
   -- 013_rls_policies.sql
   -- 014_seed_data.sql
   ```

   **OR** run them all at once by combining all SQL files:
   ```bash
   # From project root
   cat supabase/migrations/000_create_migrations_table.sql \
       supabase/migrations/001_enums_and_extensions.sql \
       supabase/migrations/002_user_management.sql \
       supabase/migrations/003_product_catalog.sql \
       supabase/migrations/004_product_variants.sql \
       supabase/migrations/005_shopping_features.sql \
       supabase/migrations/006_orders.sql \
       supabase/migrations/007_payments.sql \
       supabase/migrations/008_user_data.sql \
       supabase/migrations/009_coupons.sql \
       supabase/migrations/010_audit_logs.sql \
       supabase/migrations/011_functions.sql \
       supabase/migrations/012_views.sql \
       supabase/migrations/013_rls_policies.sql \
       supabase/migrations/014_seed_data.sql > all_migrations.sql
   ```
   Then copy the contents of `all_migrations.sql` into SQL Editor.

4. **Verify Execution**
   - Check for any errors in the SQL Editor output
   - All tables should be created successfully

5. **Record Migrations (Optional)**
   - Visit `/admin/migrations` in your app
   - Click "Refresh Status" to see migration status
   - If migrations show as pending, you can manually mark them as executed

---

### Method 2: Supabase CLI

**Prerequisites:**
```bash
npm install -g supabase
```

**Steps:**

1. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Push migrations:**
   ```bash
   supabase db push
   ```

   This will execute all migration files in `supabase/migrations/` directory.

3. **Verify:**
   ```bash
   supabase db diff
   ```

---

### Method 3: Admin UI (After Manual Execution)

1. **Run migrations manually** using Method 1 or 2 above

2. **Visit Admin UI:**
   - Navigate to: `http://localhost:3000/admin/migrations`
   - Click "Refresh Status" to see current state

3. **If migrations show as pending:**
   - The system will detect which migrations have been executed
   - You can use the UI to track and manage migrations

---

### Method 4: API Endpoint

**Check Status:**
```bash
curl http://localhost:3000/api/migrations/status
```

**Run Migrations (records execution):**
```bash
curl -X POST http://localhost:3000/api/migrations/run \
  -H "Content-Type: application/json" \
  -d '{"executedBy": "api-user"}'
```

**Note:** The API can track migrations but cannot execute SQL directly due to Supabase JS client limitations.

---

### Method 5: CLI Script

```bash
npm run migrate
```

This script will:
- Check which migrations are pending
- Display SQL to copy/paste
- Provide instructions for execution

---

## Verification Steps

After running migrations, verify everything worked:

1. **Check Migration Status:**
   ```bash
   # Via Admin UI
   http://localhost:3000/admin/migrations
   
   # Via API
   curl http://localhost:3000/api/migrations/status
   ```

2. **Verify Tables Exist:**
   - Go to Supabase Dashboard → Table Editor
   - You should see all 21 tables:
     - users, roles, user_roles
     - products, categories, product_categories
     - product_variants, variant_images, inventory
     - cart_items, wishlist
     - orders, order_status_history, order_items
     - payments, payment_transactions
     - addresses, reviews
     - coupons, order_coupons
     - audit_logs
     - schema_migrations (tracking table)

3. **Check Views:**
   - `products_with_ratings`
   - `inventory_status`

4. **Verify Functions:**
   - `is_admin()`
   - `reserve_inventory()`
   - `release_reserved_inventory()`
   - `commit_inventory()`
   - `generate_order_number()`
   - `handle_new_user()`

---

## Troubleshooting

### Error: "relation schema_migrations does not exist"
**Solution:** Run `000_create_migrations_table.sql` first

### Error: "type already exists"
**Solution:** This is normal if ENUMs already exist. The migration uses `CREATE TYPE IF NOT EXISTS` (though PostgreSQL doesn't support this directly). You may need to modify the migration to use `DO $$ BEGIN ... END $$;` blocks.

### Error: "table already exists"
**Solution:** Some tables may already exist. Check which ones and either:
- Drop existing tables (if safe to do so)
- Modify migrations to use `CREATE TABLE IF NOT EXISTS`

### Migrations show as "pending" after execution
**Solution:** 
1. Check if `schema_migrations` table exists
2. Manually insert records:
   ```sql
   INSERT INTO schema_migrations (migration_name, status, executed_by)
   VALUES 
     ('000_create_migrations_table.sql', 'success', 'manual'),
     ('001_enums_and_extensions.sql', 'success', 'manual'),
     -- ... etc
   ON CONFLICT (migration_name) DO NOTHING;
   ```

### Can't execute SQL via API/CLI
**Solution:** This is expected. Supabase JS client doesn't support raw SQL. Use:
- Supabase Dashboard SQL Editor (Method 1)
- Supabase CLI (Method 2)
- Direct database connection with service role key

---

## Quick Reference

| Method | Best For | Execution | Tracking |
|--------|----------|-----------|----------|
| Dashboard | First-time setup | Manual | Automatic |
| CLI | Developers | Automatic | Automatic |
| Admin UI | Monitoring | View only | Automatic |
| API | Integration | View only | Manual |
| Script | Instructions | View only | Manual |

---

## Next Steps

After migrations are complete:

1. ✅ Verify all 21 tables exist
2. ✅ Check RLS policies are enabled
3. ✅ Test database connection: `/admin/test-connection`
4. ✅ Seed initial data (if needed)
5. ✅ Configure environment variables
6. ✅ Test application functionality

---

## Need Help?

- Check migration files in: `supabase/migrations/`
- View migration status: `/admin/migrations`
- Test connection: `/admin/test-connection`
- Read full docs: `MIGRATION_SYSTEM.md`


