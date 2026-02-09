# Authentication Architecture

## 🔐 Custom JWT Authentication (NOT Supabase Auth)

This project uses **custom JWT authentication**, NOT Supabase's built-in authentication system.

### Key Differences

| Feature | Supabase Auth | This Project (Custom JWT) |
|---------|---------------|---------------------------|
| **Auth Provider** | Supabase Auth | Custom JWT with MSG91 OTP |
| **Token Type** | Supabase JWT | Custom JWT (jose library) |
| **Database Access** | `auth.uid()` works | `auth.uid()` **DOES NOT WORK** |
| **RLS Policies** | Uses `authenticated` role | Uses `service_role` only |
| **Session Storage** | Supabase cookies | Custom cookie (`aic_session`) |
| **User Verification** | Supabase methods | Custom OTP via MSG91 |

---

## 🏗️ Architecture Overview

### 1. **Authentication Flow**

```
User Login (Phone/OTP)
    ↓
MSG91 OTP Verification
    ↓
Custom JWT Token Generated (lib/jwt.ts)
    ↓
Token Stored in Cookie (aic_session)
    ↓
Middleware Validates Token (proxy.ts)
    ↓
API Routes Use requireAuth() (lib/auth.ts)
    ↓
Database Access via service_role (lib/adminDb.ts)
```

### 2. **Key Components**

#### **JWT Token Generation** (`lib/jwt.ts`)
- Uses `jose` library (NOT Supabase)
- Signs tokens with `AUTH_JWT_SECRET`
- Payload: `{ sub: userId, phone, email, roles }`
- 10-year expiration (non-expiring sessions)

#### **Session Management** (`lib/session.ts`)
- Cookie name: `aic_session`
- HttpOnly, SameSite=lax
- Stored in browser cookies

#### **Authentication Middleware** (`lib/auth.ts`)
- `requireAuth()` - Validates JWT token
- `requireAdmin()` - Checks user roles
- `getCurrentUser()` - Returns user from JWT
- **Uses `getAdminDbClient()` for all DB queries**

#### **Database Client** (`lib/adminDb.ts`)
- **CRITICAL**: Uses `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS (Row Level Security)
- All database operations go through this client
- Application-level authorization (not database-level)

---

## 🚨 CRITICAL: RLS Policy Requirements

### ❌ **WRONG** (Doesn't Work)

```sql
-- This DOES NOT WORK because auth.uid() is for Supabase Auth only
CREATE POLICY "Users can view own data"
ON some_table
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### ✅ **CORRECT** (Works)

```sql
-- This WORKS because we use service_role key for all operations
CREATE POLICY "Service role can manage data"
ON some_table
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Why?

1. **`auth.uid()` only works with Supabase Auth** - It returns the user ID from Supabase's auth system
2. **We use custom JWT tokens** - Supabase doesn't know about our users
3. **All operations use `service_role` key** - This bypasses RLS entirely
4. **Authorization is done in application code** - `requireAuth()`, `requireAdmin()`, etc.

---

## 🛠️ How to Add RLS Policies

### For New Tables

```sql
-- 1. Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 2. Create ONLY service_role policy
CREATE POLICY "Service role can manage your_table"
ON your_table
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. NO authenticated policies needed!
-- Authorization is handled in application code
```

### Checking Existing Policies

```sql
-- List all policies for a table
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'your_table';

-- Should only see service_role policies
-- If you see 'authenticated' with auth.uid(), it's WRONG
```

---

## 📋 Tables with Correct RLS

These tables should have **ONLY** `service_role` policies:

- ✅ `promo_usage_logs` - Fixed in migration `20260208000003`
- ✅ `coupons` - Fixed in migration `20260208000002`
- ⚠️ Other tables - Check and update if needed

---

## 🔍 Debugging Auth Issues

### Check 1: Verify JWT Token

```typescript
// In any API route
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const user = await requireAuth(); // Throws if invalid
  console.log('Authenticated user:', user);
  // user = { id: '...', email: '...', roles: [...] }
}
```

### Check 2: Verify Service Role Key

```bash
# In .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Verify it's service_role (not anon key)
# Decode JWT at jwt.io - should have "role": "service_role"
```

### Check 3: Verify RLS Policies

```sql
-- Run in Supabase SQL Editor
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Look for policies with 'authenticated' role using auth.uid()
-- These are BROKEN and need to be replaced with service_role policies
```

---

## 🎯 Best Practices

### ✅ DO

- Use `getAdminDbClient()` for all database operations
- Use `requireAuth()` for authentication checks
- Use `requireAdmin()` for admin-only routes
- Create `service_role` RLS policies only
- Handle authorization in application code

### ❌ DON'T

- Use `auth.uid()` in RLS policies
- Create `authenticated` role policies
- Use Supabase Auth methods (`supabase.auth.getUser()`)
- Rely on database-level RLS for authorization
- Mix Supabase Auth with custom JWT

---

## 📚 Related Files

- `lib/jwt.ts` - JWT token generation/verification
- `lib/session.ts` - Cookie management
- `lib/auth.ts` - Authentication middleware
- `lib/adminDb.ts` - Database client (service_role)
- `proxy.ts` - Route protection middleware
- `app/api/auth/*` - Auth endpoints (login, OTP, etc.)

---

## 🔗 External Dependencies

- **MSG91** - OTP delivery via WhatsApp
- **jose** - JWT signing/verification
- **Supabase** - Database only (NOT auth)
- **Next.js** - Server-side rendering & API routes

