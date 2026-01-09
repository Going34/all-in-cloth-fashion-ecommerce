# Database Connection Testing

This document explains how to test your Supabase database connection.

## Files Created

1. **`utils/dbConnection.ts`** - Core connection testing utilities
2. **`app/api/test-connection/route.ts`** - API endpoint for testing
3. **`app/admin/test-connection/page.tsx`** - Admin UI for testing
4. **`scripts/test-db-connection.ts`** - CLI script for testing

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zagoyabmutueuzzndkmb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# OR use one of these:
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key-here
NEXT_PUBLIC_SUPABASE_API_KEY=your-key-here
```

## Testing Methods

### 1. Admin UI (Recommended)

Navigate to: **`/admin/test-connection`**

This provides a visual interface to:
- Check configuration status
- Test client-side connection
- Run full diagnostics
- View accessible tables

### 2. API Endpoint

Test via HTTP request:

```bash
curl http://localhost:3000/api/test-connection
```

Or open in browser: **`http://localhost:3000/api/test-connection`**

### 3. Programmatic Usage

#### Client-side (React Components)

```typescript
import { testDatabaseConnection } from '@/utils/dbConnection';

const status = await testDatabaseConnection();
console.log(status);
```

#### Server-side (Server Components, API Routes)

```typescript
import { testDatabaseConnectionServer } from '@/utils/dbConnection';

const status = await testDatabaseConnectionServer();
console.log(status);
```

#### Full Diagnostic

```typescript
import { diagnoseConnection } from '@/utils/dbConnection';

const diagnostic = await diagnoseConnection();
console.log(diagnostic);
```

#### Check Configuration

```typescript
import { checkSupabaseConfig } from '@/utils/dbConnection';

const config = checkSupabaseConfig();
if (!config.configured) {
  console.error('Missing:', config.missing);
}
```

## Expected Output

### Successful Connection

```json
{
  "connected": true,
  "message": "Successfully connected to Supabase database. Found 11 accessible tables.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tables": [
    "users",
    "products",
    "categories",
    "orders",
    "inventory",
    "product_variants",
    "cart_items",
    "addresses",
    "reviews",
    "payments",
    "wishlist"
  ]
}
```

### Failed Connection

```json
{
  "connected": false,
  "error": "relation \"products\" does not exist",
  "message": "Failed to connect to database. Tables may not exist yet.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### "Tables may not exist yet"
- Run your database migrations
- Check if tables are created in Supabase dashboard
- Verify RLS policies allow access

### "Supabase URL or key not configured"
- Check `.env.local` file exists
- Verify environment variable names match
- Restart your dev server after changing `.env.local`

### "Failed to establish database connection"
- Check internet connection
- Verify Supabase project is active
- Check Supabase dashboard for service status

## Next Steps

After confirming connection:
1. Run database migrations from `schema.md`
2. Set up Row Level Security (RLS) policies
3. Test CRUD operations through your services

