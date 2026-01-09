# Database Migration System

## Overview

A complete migration tracking system has been implemented to manage all 21 database tables plus a migrations tracking table. The system provides multiple ways to execute and track database migrations.

## Migration Files

All migrations are located in `supabase/migrations/`:

1. **000_create_migrations_table.sql** - Creates the migration tracking table
2. **001_enums_and_extensions.sql** - ENUM types and extensions
3. **002_user_management.sql** - Users, roles, user_roles tables
4. **003_product_catalog.sql** - Products, categories, product_categories
5. **004_product_variants.sql** - Product variants, variant images, inventory
6. **005_shopping_features.sql** - Cart items, wishlist
7. **006_orders.sql** - Orders, order status history, order items
8. **007_payments.sql** - Payments, payment transactions
9. **008_user_data.sql** - Addresses, reviews
10. **009_coupons.sql** - Coupons, order_coupons
11. **010_audit_logs.sql** - Audit logs table
12. **011_functions.sql** - Database functions and triggers
13. **012_views.sql** - Database views
14. **013_rls_policies.sql** - Row Level Security policies
15. **014_seed_data.sql** - Seed data (sample categories)

**Note:** The original `001_initial_schema.sql` has been renamed to `001_initial_schema.sql.old` for reference.

## Migration Tracking Table

The `schema_migrations` table tracks:
- Migration name
- Execution timestamp
- Execution status (success/failed/partial)
- Execution time
- Error messages (if any)
- SQL content (first 10k characters)

## Usage Methods

### 1. Admin UI (Recommended for Visual Management)

Navigate to: **`/admin/migrations`**

Features:
- View all migration statuses
- See executed/pending/failed counts
- Run pending migrations
- View execution logs and errors

### 2. API Endpoints

**GET `/api/migrations/status`**
- Returns current migration status
- Shows which migrations have been executed

**GET `/api/migrations/run`**
- Returns migration status (same as status endpoint)

**POST `/api/migrations/run`**
- Executes pending migrations
- Returns execution results

### 3. CLI Script

Run from command line:
```bash
npm run migrate
```

Or directly:
```bash
npx tsx scripts/run-migrations.ts
```

The CLI script will:
- Check which migrations are pending
- Provide SQL to copy/paste into Supabase Dashboard
- Give instructions for execution

### 4. Programmatic Usage

```typescript
import { 
  checkMigrationStatus, 
  runAllMigrations,
  getExecutedMigrations 
} from '@/utils/migrationRunner';

// Check status
const status = await checkMigrationStatus();

// Run all pending migrations
const { results, summary } = await runAllMigrations('system');
```

## Important Notes

### SQL Execution Limitation

The Supabase JS client **does not support direct SQL execution**. Migrations must be executed using one of these methods:

1. **Supabase Dashboard** (Recommended)
   - Go to SQL Editor
   - Copy migration SQL
   - Execute and verify

2. **Supabase CLI**
   ```bash
   supabase db push
   ```

3. **Manual Execution**
   - Execute SQL via your database client
   - Then use the Admin UI or API to record the migration

### Migration Execution Order

Migrations are executed in filename order (000, 001, 002...). This ensures:
- Dependencies are created in correct order
- Tracking table is created first
- Tables are created before views/functions that depend on them

### Safety Features

- **Idempotent**: Safe to run multiple times (checks if already executed)
- **Tracking**: All executions are recorded
- **Error Handling**: Failed migrations are logged with error messages
- **Status Checking**: Easy to see which migrations are pending

## Migration Status

Each migration can have one of these statuses:
- **Pending**: Not yet executed
- **Success**: Executed successfully
- **Failed**: Execution failed (error message stored)
- **Partial**: Partially executed (rare)

## Next Steps

1. **First Time Setup**:
   - Run migration `000_create_migrations_table.sql` in Supabase Dashboard
   - This creates the tracking table

2. **Run All Migrations**:
   - Use Supabase Dashboard SQL Editor
   - Execute migrations 001-014 in order
   - Or use Supabase CLI: `supabase db push`

3. **Verify**:
   - Check `/admin/migrations` to see all migrations marked as executed
   - Verify all 21 tables exist in your database

4. **Future Migrations**:
   - Create new migration files following the naming pattern: `015_description.sql`
   - The system will automatically detect and track them

## Files Created

- `supabase/migrations/000_create_migrations_table.sql`
- `supabase/migrations/001_enums_and_extensions.sql` through `014_seed_data.sql`
- `utils/migrationRunner.ts` - Core migration utilities
- `app/api/migrations/status/route.ts` - Status API endpoint
- `app/api/migrations/run/route.ts` - Run migrations API endpoint
- `scripts/run-migrations.ts` - CLI script
- `app/admin/migrations/page.tsx` - Admin UI
- `package.json` - Updated with `migrate` script

## Troubleshooting

### "Migrations table does not exist"
- Run `000_create_migrations_table.sql` first in Supabase Dashboard

### "Migration already executed"
- This is normal - migrations are idempotent
- Check status to see execution details

### "Failed to execute SQL"
- Supabase JS client doesn't support raw SQL
- Use Supabase Dashboard or CLI to execute migrations
- Then use Admin UI to record them

### "Cannot find migration files"
- Ensure files are in `supabase/migrations/` directory
- Check file names match pattern: `###_description.sql`


