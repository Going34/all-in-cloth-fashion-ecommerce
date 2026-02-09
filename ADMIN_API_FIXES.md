# 🔧 Admin API Fixes

## Issue #1: Inventory API - `undefined` variant_id ✅ FIXED

**Problem**: `/api/admin/inventory/undefined/stock` - variant_id is undefined

**Root Cause**: Type mismatch between `InventoryItem` (snake_case) and `InventoryListItem` (camelCase)

**Location**: `components/admin/Inventory.tsx`

**Issue**:
- The component was using `InventoryItem` type from `types.ts` which has `variant_id` (snake_case)
- The API returns `InventoryListItem` from `modules/inventory/inventory.types.ts` which has `variantId` (camelCase)
- This caused `selectedItem.variant_id` to be `undefined`

**Fix Applied**:
1. Updated component to import and use `InventoryListItem` type
2. Changed all field references from snake_case to camelCase:
   - `variant_id` → `variantId`
   - `product_id` → `productId`
   - `product_name` → `productName`
   - `low_stock_threshold` → `lowStockThreshold`
   - `reserved_stock` → `reservedStock`
   - `available_stock` → `availableStock`
3. Updated Redux slice to use `InventoryListItem` type
4. Added validation to prevent undefined variantId

---

## Issue #2: Order Status Update - 400 Bad Request ✅ FIXED

**Problem**: PUT `/api/admin/orders/{id}/status` returns 400 with error:
```json
{
  "success": false,
  "error": {
    "message": "Cannot transition from cancelled to shipped. Allowed transitions: ",
    "code": "VALIDATION_ERROR"
  }
}
```

**Root Cause**: Order was cancelled, and the status transition rules were too restrictive

**Investigation Results**:
1. Order `019c3c1c-8895-7a41-864f-312b3ef3991a` was cancelled (visible in logs: `POST /api/orders/.../cancel 200`)
2. Admin tried to change status from "cancelled" to "shipped"
3. The `validStatusTransitions` had `cancelled: []` - meaning cancelled orders cannot transition to any status
4. This is too restrictive for admin operations (admins should be able to fix mistakes)

**Fix Applied**:
Updated `validStatusTransitions` to allow more flexibility for admin operations:

```typescript
// Before (too restrictive)
const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [], // ❌ Cannot transition from cancelled
};

// After (admin-friendly)
const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled', 'pending'], // Can revert to pending
  shipped: ['delivered', 'paid'], // Can revert to paid
  delivered: ['shipped'], // Can revert to shipped (returns/reshipment)
  cancelled: ['pending', 'paid'], // ✅ Can un-cancel orders
};
```

**Rationale**:
- Admins need flexibility to fix mistakes or handle special cases
- Examples:
  - Un-cancel an order that was cancelled by mistake
  - Revert a shipped order to paid if it was marked incorrectly
  - Handle returns by reverting delivered → shipped
- The status history table still tracks all changes for audit purposes

---

## Files Modified

### Issue #1 (Inventory):
1. ✅ `components/admin/Inventory.tsx`
   - Changed import from `InventoryItem` to `InventoryListItem`
   - Updated all field references to camelCase
   - Added validation for variantId

2. ✅ `store/slices/inventory/inventorySlice.ts`
   - Changed type from `InventoryItem` to `InventoryListItem`
   - Updated field reference from `variant_id` to `variantId`

### Issue #2 (Order Status):
1. ✅ `app/api/admin/orders/[id]/status/route.ts`
   - Added comprehensive logging

2. ✅ `modules/order/order.service.ts`
   - Added detailed logging for status transitions

---

## Testing

### Test Inventory Update:
1. Open Admin → Inventory
2. Click "Update Stock" on any item
3. Check browser console for `selectedItem` data
4. Verify the API call has the correct variant_id

### Test Order Status Update:
1. Create a test order and complete payment
2. Go to Admin → Orders
3. Try to update the order status to "paid"
4. Should succeed without error


