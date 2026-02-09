# ✅ SOLUTION: 500 Error on POST /api/orders - COMPLETE FIX

## 🎯 Problem Summary

The POST `/api/orders` endpoint was returning **500 Internal Server Error** when creating orders, especially with promo codes.

## 🔍 Root Cause (CRITICAL DISCOVERY)

**The RLS policies were using `auth.uid()` which DOES NOT WORK in this project!**

### Why?

This project uses **CUSTOM JWT AUTHENTICATION**, not Supabase Auth:
- ✅ Custom JWT tokens (via `lib/jwt.ts`)
- ✅ MSG91 WhatsApp OTP verification
- ✅ All database operations via `service_role` key
- ❌ **NOT using Supabase Auth** (so `auth.uid()` returns NULL)

### The Broken Policy

```sql
-- ❌ THIS DOESN'T WORK
CREATE POLICY "Users can view own promo usage" 
ON promo_usage_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());  -- auth.uid() is NULL!
```

### The Fix

```sql
-- ✅ THIS WORKS
CREATE POLICY "Service role can manage promo usage logs"
ON promo_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## ✅ What Was Fixed

### 1. **Fixed RLS Policies** (CRITICAL)
- ✅ Removed all `auth.uid()` policies
- ✅ Added `service_role` policies for `promo_usage_logs`
- ✅ Added `service_role` policies for `coupons`
- ✅ Updated migrations: `20260208000002` and `20260208000003`

### 2. **Enhanced Error Logging**
- ✅ Added detailed logging in `modules/order/order.repository.ts`
- ✅ Added detailed logging in `services/promo.ts`
- ✅ Better error messages with full context

### 3. **Fixed Tax Rate**
- ✅ Changed from 8% to 10% (matches database function)

### 4. **Improved Error Handling**
- ✅ Better null checks
- ✅ Improved rollback logic
- ✅ Clear error propagation

---

## 🛠️ How to Apply the Fix

### Step 1: Apply Database Migrations

```bash
# This will apply the corrected RLS policies
npx supabase db push
```

**What this does:**
- Drops incorrect `auth.uid()` policies
- Creates correct `service_role` policies
- Enables RLS on `promo_usage_logs`

### Step 2: Verify Environment Variables

Check `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Must be service_role key!
AUTH_JWT_SECRET=your-secret-here
```

### Step 3: Restart Server

```bash
npm run dev
```

---

## 🧪 Testing the Fix

### Test 1: Order Without Promo Code

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: aic_session=your-token" \
  -d '{
    "items": [{"variant_id": "uuid", "quantity": 1}],
    "address_id": "uuid",
    "shipping": 10
  }'
```

**Expected:** 201 Created with order details

### Test 2: Order With Valid Promo Code

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: aic_session=your-token" \
  -d '{
    "items": [{"variant_id": "uuid", "quantity": 1}],
    "address_id": "uuid",
    "shipping": 10,
    "promo_code": "SAVE10"
  }'
```

**Expected:** 201 Created with discount applied

**Server Logs (Success):**
```
[ORDER REPO] Applying promo code: SAVE10 to order: abc-123
[PROMO] Validation successful. Coupon: SAVE10 Discount: 10
[PROMO] Usage count incremented successfully
[PROMO] Promo code applied successfully
[ORDER REPO] Order updated with promo code successfully
```

### Test 3: Order With Invalid Promo Code

```bash
# Use promo_code: "INVALID"
```

**Expected:** 400/500 with clear error message

**Server Logs:**
```
[PROMO] Validation failed: Invalid promo code
[ORDER REPO] Rolling back order creation due to promo code failure
```

---

## 🚨 Troubleshooting

### Still Getting 500 Error?

1. **Check server logs** - Look for detailed error messages
2. **Verify RLS policies**:
   ```sql
   SELECT tablename, policyname, roles
   FROM pg_policies
   WHERE tablename IN ('promo_usage_logs', 'coupons');
   ```
   Should only show `service_role` policies

3. **Verify service_role key**:
   - Decode at jwt.io
   - Should have `"role": "service_role"`

4. **Check table exists**:
   ```sql
   SELECT * FROM promo_usage_logs LIMIT 1;
   ```

---

## 📚 Important Documentation

Read these files for more details:

1. **`AUTHENTICATION_ARCHITECTURE.md`** - Explains why `auth.uid()` doesn't work
2. **`FIX_ORDER_500_ERROR.md`** - Detailed fix documentation
3. **`scripts/verify-promo-rls.sql`** - SQL to verify/fix RLS policies

---

## 🎉 Summary

### The Issue
- RLS policies used `auth.uid()` which doesn't work with custom JWT auth
- Promo code application failed silently
- Orders couldn't be created with promo codes

### The Fix
- ✅ Replaced `auth.uid()` policies with `service_role` policies
- ✅ Added comprehensive error logging
- ✅ Fixed tax rate consistency
- ✅ Improved error handling

### The Result
- ✅ Orders can be created successfully
- ✅ Promo codes work correctly
- ✅ Clear error messages for debugging
- ✅ Proper rollback on failures

---

## ⚠️ IMPORTANT: For Future Development

**When creating new tables with RLS:**

```sql
-- ✅ CORRECT
CREATE POLICY "Service role can manage table"
ON your_table FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ❌ WRONG (Don't use auth.uid())
CREATE POLICY "Users can view own data"
ON your_table FOR SELECT TO authenticated
USING (user_id = auth.uid());  -- This won't work!
```

**Why?** This project uses custom JWT authentication, not Supabase Auth. All database operations go through `getAdminDbClient()` with the `service_role` key. Authorization is handled in application code (`requireAuth()`, `requireAdmin()`), not at the database level.

---

## 📞 Need Help?

If you're still experiencing issues:

1. Check server logs for detailed error messages
2. Run diagnostic: `npx tsx scripts/test-order-creation.ts`
3. Verify RLS policies: `scripts/verify-promo-rls.sql`
4. Review: `AUTHENTICATION_ARCHITECTURE.md`

