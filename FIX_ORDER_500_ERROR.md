# Fix for 500 Internal Server Error on POST /api/orders

## 🔍 Root Cause Analysis

The 500 error in the POST `/api/orders` endpoint was caused by **multiple issues**:

### 1. **Missing/Incorrect RLS Policies on `promo_usage_logs` Table**
   - The `promo_usage_logs` table has RLS enabled but was missing the `service_role` policy
   - **CRITICAL**: This project uses **custom JWT authentication**, NOT Supabase Auth
   - All database operations use `getAdminDbClient()` with the `service_role` key
   - RLS policies using `auth.uid()` **DO NOT WORK** in this architecture
   - Only `service_role` policies are needed
   - Without the correct policy, INSERT operations fail with permission denied errors

### 2. **Insufficient Error Logging**
   - Errors were being caught but not logged with enough detail
   - Made it difficult to diagnose the exact failure point

### 3. **Tax Rate Mismatch**
   - Repository used 8% tax rate
   - Database function uses 10% tax rate
   - Fixed to use consistent 10% rate

### 4. **Poor Error Propagation**
   - When promo code application failed, the error message wasn't clear
   - Rollback logic existed but didn't provide feedback

---

## ✅ What Was Fixed

### 1. **Enhanced Error Logging** (`modules/order/order.repository.ts`)
   - Added detailed console logging at every step
   - Better error messages with context
   - Logs RPC errors, promo application errors, and rollback attempts

### 2. **Improved Promo Service** (`services/promo.ts`)
   - Added comprehensive logging for debugging
   - Better error messages with specific failure reasons
   - Checks for database errors on all queries
   - Improved rollback logic

### 3. **Fixed Tax Rate** (`modules/order/order.repository.ts`)
   - Changed from 8% to 10% to match database function
   - Ensures consistent calculations

### 4. **Better Null Checks**
   - Added validation for RPC result
   - Prevents undefined errors

---

## 🛠️ How to Apply the Fix

### Step 1: Verify Database RLS Policies

Run the SQL script in Supabase SQL Editor:

```bash
# Open the file: scripts/verify-promo-rls.sql
# Copy and paste into Supabase SQL Editor
# Execute all statements
```

**OR** run the migration:

```bash
npx supabase db push
```

### Step 2: Verify Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # CRITICAL!
```

### Step 3: Restart Development Server

```bash
# Kill existing server
# Restart
npm run dev
```

---

## 🧪 How to Test the Fix

### Option 1: Use the Diagnostic Script

```bash
npx tsx scripts/test-order-creation.ts
```

This will:
- ✅ Check if `promo_usage_logs` table exists
- ✅ Verify RLS policies
- ✅ List active coupons
- ✅ Provide test data for manual testing

### Option 2: Manual API Test

1. **Login and get auth token**
2. **Make POST request to `/api/orders`**:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "items": [
      {
        "variant_id": "your-variant-id",
        "quantity": 1
      }
    ],
    "address_id": "your-address-id",
    "shipping": 10
  }'
```

3. **With promo code**:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "items": [{"variant_id": "...", "quantity": 1}],
    "address_id": "...",
    "shipping": 10,
    "promo_code": "SAVE10"
  }'
```

### Option 3: Check Server Logs

Watch the terminal where `npm run dev` is running. You should see detailed logs:

```
[ORDER REPO] Applying promo code: SAVE10 to order: ...
[PROMO] Applying promo code: { code: 'SAVE10', orderId: '...', ... }
[PROMO] Validation successful. Coupon: SAVE10 Discount: 10
[PROMO] Usage count incremented successfully
[PROMO] Promo code applied successfully
[ORDER REPO] Order updated with promo code successfully
```

---

## 🚨 Common Issues and Solutions

### Issue 1: "Failed to log promo usage"

**Cause**: RLS policy missing for `service_role`, or incorrect policies using `auth.uid()`

**Why this happens**: This project uses custom JWT authentication, not Supabase Auth. Policies with `auth.uid()` don't work.

**Solution**:
1. Run the migration: `npx supabase db push`
2. Or manually execute: `scripts/verify-promo-rls.sql` in Supabase SQL Editor
3. Verify only `service_role` policy exists (no `authenticated` policies with `auth.uid()`)

### Issue 2: "SUPABASE_SERVICE_ROLE_KEY not configured"

**Cause**: Missing environment variable

**Solution**: Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-key-here
```

### Issue 3: "Insufficient stock"

**Cause**: Product variant has no inventory

**Solution**: Add inventory in admin panel or database

### Issue 4: "Address not found"

**Cause**: Invalid address_id or address doesn't belong to user

**Solution**: Use valid address_id from `/api/addresses`

---

## 📊 Monitoring

After the fix, monitor these logs:

1. **Success case**:
   ```
   [ORDER REPO] Order updated with promo code successfully
   ```

2. **Validation failure** (expected):
   ```
   [PROMO] Validation failed: Promo code has expired
   ```

3. **Database error** (needs investigation):
   ```
   [PROMO] Error logging usage: ...
   [ORDER REPO] Rolling back order creation due to promo code failure
   ```

---

## 📝 Next Steps

1. ✅ Apply the code fixes (already done)
2. ⚠️ Run the SQL script to fix RLS policies
3. ✅ Test order creation without promo code
4. ✅ Test order creation with valid promo code
5. ✅ Test order creation with invalid promo code
6. ✅ Verify error messages are user-friendly

---

## 🔗 Related Files

- `app/api/orders/route.ts` - API endpoint
- `modules/order/order.service.ts` - Business logic
- `modules/order/order.repository.ts` - Database operations (FIXED)
- `services/promo.ts` - Promo code logic (FIXED)
- `supabase/migrations/20260208000002_fix_coupons_rls_policy.sql` - RLS migration

