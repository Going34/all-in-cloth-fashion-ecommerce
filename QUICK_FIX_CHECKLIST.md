# ⚡ Quick Fix Checklist - 500 Error on POST /api/orders

## 🎯 The Problem
POST `/api/orders` returns 500 error because RLS policies use `auth.uid()` which doesn't work with custom JWT authentication.

---

## ✅ Fix Checklist (Follow in Order)

### [ ] Step 1: Apply Database Migrations

```bash
npx supabase db push
```

**What this does:**
- Fixes RLS policies on `promo_usage_logs` table
- Fixes RLS policies on `coupons` table
- Removes broken `auth.uid()` policies
- Adds correct `service_role` policies

**Expected output:**
```
Applying migration 20260208000002_fix_coupons_rls_policy.sql...
Applying migration 20260208000003_ensure_promo_usage_logs_rls.sql...
✓ Migrations applied successfully
```

---

### [ ] Step 2: Verify Environment Variables

Check `.env.local` has these:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # CRITICAL!
AUTH_JWT_SECRET=your-secret-here
```

**To verify service_role key:**
1. Go to jwt.io
2. Paste your `SUPABASE_SERVICE_ROLE_KEY`
3. Check payload has: `"role": "service_role"`
4. If it says `"role": "anon"`, you're using the wrong key!

---

### [ ] Step 3: Restart Development Server

```bash
# Kill existing server (Ctrl+C)
npm run dev
```

**Wait for:**
```
✓ Ready in 1054ms
- Local: http://localhost:3000
```

---

### [ ] Step 4: Test Order Creation (No Promo)

**Via UI:**
1. Go to checkout page
2. Fill in details
3. Click "Place Order"
4. Should succeed with 201 status

**Via API:**
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

**Expected:** `{"success": true, "data": {...}}`

---

### [ ] Step 5: Test Order Creation (With Promo)

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

**Expected:** Order created with discount applied

**Check server logs for:**
```
[PROMO] Validation successful. Coupon: SAVE10 Discount: 10
[PROMO] Promo code applied successfully
[ORDER REPO] Order updated with promo code successfully
```

---

### [ ] Step 6: Verify RLS Policies (Optional)

Run in Supabase SQL Editor:

```sql
SELECT tablename, policyname, roles
FROM pg_policies
WHERE tablename IN ('promo_usage_logs', 'coupons')
ORDER BY tablename, policyname;
```

**Expected output:**
```
tablename          | policyname                              | roles
-------------------|-----------------------------------------|---------------
coupons            | Service role can manage coupons         | {service_role}
promo_usage_logs   | Service role can manage promo usage logs| {service_role}
```

**❌ If you see:**
- Policies with `authenticated` role
- Policy names mentioning "Users can view own..."
- Multiple policies per table

**Then:** Re-run `npx supabase db push`

---

## 🚨 Troubleshooting

### Issue: Migration fails

**Error:** `relation "promo_usage_logs" does not exist`

**Fix:**
```bash
# Apply earlier migration first
npx supabase db push
```

---

### Issue: Still getting 500 error

**Check 1:** Server logs
```bash
# Look for:
[ORDER API ERROR]: ...
[PROMO] Error logging usage: ...
```

**Check 2:** Service role key
```bash
# Verify in .env.local
echo $SUPABASE_SERVICE_ROLE_KEY
# Should start with: eyJhbGc...
```

**Check 3:** Table exists
```sql
SELECT COUNT(*) FROM promo_usage_logs;
```

---

### Issue: "Failed to log promo usage"

**Cause:** RLS policy still incorrect

**Fix:**
1. Run: `scripts/verify-promo-rls.sql` in Supabase SQL Editor
2. Or manually:
   ```sql
   DROP POLICY IF EXISTS "Users can view own promo usage" ON promo_usage_logs;
   CREATE POLICY "Service role can manage promo usage logs"
   ON promo_usage_logs FOR ALL TO service_role
   USING (true) WITH CHECK (true);
   ```

---

## 📊 Success Indicators

### ✅ Everything is working when:

1. **Orders without promo codes:**
   - Return 201 status
   - Order appears in database
   - No errors in server logs

2. **Orders with valid promo codes:**
   - Return 201 status
   - Discount applied correctly
   - Entry in `promo_usage_logs` table
   - Coupon `used_count` incremented
   - Server logs show success messages

3. **Orders with invalid promo codes:**
   - Return 400/500 status
   - Clear error message
   - No order created (rollback successful)
   - Server logs show validation failure

---

## 📚 Additional Resources

- **`ORDER_500_ERROR_SOLUTION.md`** - Complete solution guide
- **`AUTHENTICATION_ARCHITECTURE.md`** - Why auth.uid() doesn't work
- **`FIX_ORDER_500_ERROR.md`** - Detailed technical documentation
- **`scripts/test-order-creation.ts`** - Diagnostic tool
- **`scripts/verify-promo-rls.sql`** - SQL verification script

---

## 🎉 Done!

If all checkboxes are ✅, your order creation endpoint should be working perfectly!

**Next steps:**
- Test thoroughly with different scenarios
- Monitor server logs for any issues
- Update any other tables that might have `auth.uid()` policies

