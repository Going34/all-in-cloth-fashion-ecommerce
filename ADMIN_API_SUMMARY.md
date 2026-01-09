# Admin Dashboard API - Quick Summary

## Overview

This document provides a quick reference for the admin dashboard API architecture. For detailed specifications, see:
- **ADMIN_API_ARCHITECTURE.md** - Complete API specifications
- **ADMIN_API_INTEGRATION_GUIDE.md** - Frontend integration examples

---

## Dashboard Components & Required APIs

### 1. Dashboard Overview
- ✅ `GET /api/admin/dashboard/stats` - Statistics cards
- ✅ `GET /api/admin/dashboard/sales-chart` - Sales chart data
- ✅ `GET /api/admin/dashboard/inventory-alerts` - Low stock alerts
- ✅ `GET /api/admin/orders?limit=10` - Recent orders

### 2. Products Management
- ✅ `GET /api/admin/products` - List products (with pagination, search, filters)
- ✅ `GET /api/admin/products/:id` - Get product details
- ✅ `POST /api/admin/products` - Create product
- ✅ `PUT /api/admin/products/:id` - Update product
- ✅ `DELETE /api/admin/products/:id` - Delete product
- ✅ `GET /api/admin/categories` - List categories

### 3. Orders Management
- ✅ `GET /api/admin/orders` - List orders (with filters, search, pagination)
- ✅ `GET /api/admin/orders/:id` - Get order details
- ✅ `PUT /api/admin/orders/:id/status` - Update order status
- ✅ `GET /api/admin/orders/export` - Export CSV
- ✅ `GET /api/admin/orders/:id/invoice` - Generate invoice

### 4. Customers Management
- ✅ `GET /api/admin/customers` - List customers (with search, pagination)
- ✅ `GET /api/admin/customers/:id` - Get customer details with order history

### 5. Inventory Management
- ✅ `GET /api/admin/inventory` - List inventory items (with search, filters)
- ✅ `GET /api/admin/inventory/stats` - Inventory statistics
- ✅ `PUT /api/admin/inventory/:variantId/stock` - Update stock level
- ✅ `GET /api/admin/inventory/alerts` - Low stock alerts

### 6. Roles & Permissions
- ✅ `GET /api/admin/team` - List team members
- ✅ `POST /api/admin/team/invite` - Invite team member
- ✅ `PUT /api/admin/team/:userId/role` - Update member role
- ✅ `DELETE /api/admin/team/:userId` - Remove team member

### 7. Settings
- ✅ `GET /api/admin/settings` - Get all settings
- ✅ `PUT /api/admin/settings` - Update settings

---

## Implementation Checklist

### Phase 1: Core Dashboard (Week 1)
- [ ] Dashboard Statistics API
- [ ] Sales Chart Data API
- [ ] Inventory Alerts API
- [ ] Recent Orders API (extend existing)

### Phase 2: Products Management (Week 2)
- [ ] List Products API (Admin) - with pagination, search, filters
- [ ] Get Product Details API
- [ ] Create Product API (verify existing)
- [ ] Update Product API
- [ ] Delete Product API
- [ ] List Categories API

### Phase 3: Orders Management (Week 3)
- [ ] List Orders API (Admin) - with filters, search, pagination
- [ ] Get Order Details API - with full customer, payment, shipping info
- [ ] Update Order Status API
- [ ] Export Orders CSV API
- [ ] Generate Invoice API

### Phase 4: Customers & Inventory (Week 4)
- [ ] List Customers API - with search, pagination
- [ ] Get Customer Details API - with order history
- [ ] List Inventory API - with search, filters
- [ ] Inventory Statistics API
- [ ] Update Stock API

### Phase 5: Roles & Settings (Week 5)
- [ ] Team Management APIs
- [ ] Settings APIs

---

## Key API Patterns

### Authentication
All admin APIs require:
- JWT token in Authorization header
- Admin role verification
- Return 401 if not authenticated
- Return 403 if not admin

### Response Format
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": [ ... ]
  }
}
```

### Pagination
```typescript
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 125,
    "totalPages": 13
  }
}
```

---

## Frontend Integration Steps

1. **Create API Client** - Configure axios with auth interceptors
2. **Create Service Functions** - Wrap API calls in service layer
3. **Create React Hooks** - Use TanStack Query for data fetching
4. **Update Components** - Replace mock data with API calls
5. **Add Error Handling** - Handle loading and error states
6. **Test Integration** - Verify all endpoints work correctly

---

## Quick Reference: Service Functions Needed

```typescript
// Dashboard
dashboardService.getStats(period)
dashboardService.getSalesChart(period)
dashboardService.getInventoryAlerts(limit)

// Products
adminProductService.list(filters)
adminProductService.getById(id)
adminProductService.create(data)
adminProductService.update(id, updates)
adminProductService.delete(id)

// Orders
adminOrderService.list(filters)
adminOrderService.getById(id)
adminOrderService.updateStatus(id, status, notes)
adminOrderService.exportCSV(filters)

// Customers
adminCustomerService.list(filters)
adminCustomerService.getById(id)

// Inventory
adminInventoryService.list(filters)
adminInventoryService.getStats()
adminInventoryService.updateStock(variantId, action, quantity)

// Settings
adminSettingsService.get()
adminSettingsService.update(settings)
```

---

## Important Notes

1. **Use existing patterns** - Follow the existing API route structure (`/app/api/admin/...`)
2. **Type safety** - Use TypeScript types from `types.ts`
3. **Error handling** - Implement consistent error responses
4. **Validation** - Validate all inputs using validators
5. **Audit logging** - Log all admin actions
6. **Rate limiting** - Add rate limiting for admin APIs
7. **Caching** - Use appropriate cache headers for dashboard stats

---

## File Structure

```
e-commerce/
├── app/
│   └── api/
│       └── admin/
│           ├── dashboard/
│           │   ├── stats/
│           │   │   └── route.ts
│           │   ├── sales-chart/
│           │   │   └── route.ts
│           │   └── inventory-alerts/
│           │       └── route.ts
│           ├── products/
│           │   └── route.ts (already exists, extend)
│           ├── orders/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       ├── status/
│           │       │   └── route.ts
│           │       └── invoice/
│           │           └── route.ts
│           ├── customers/
│           │   ├── route.ts
│           │   └── [id]/
│           │       └── route.ts
│           ├── inventory/
│           │   ├── route.ts
│           │   ├── stats/
│           │   │   └── route.ts
│           │   └── [variantId]/
│           │       └── stock/
│           │           └── route.ts
│           ├── team/
│           │   ├── route.ts
│           │   ├── invite/
│           │   │   └── route.ts
│           │   └── [userId]/
│           │       ├── route.ts
│           │       └── role/
│           │           └── route.ts
│           └── settings/
│               └── route.ts
├── services/
│   └── admin/
│       ├── dashboardService.ts
│       ├── productService.ts
│       ├── orderService.ts
│       ├── customerService.ts
│       ├── inventoryService.ts
│       └── settingsService.ts
└── hooks/
    └── useAdmin*.ts (various hooks)
```

---

## Next Steps

1. ✅ Review API architecture plan
2. ✅ Create API route files
3. ✅ Implement service functions
4. ✅ Create React hooks
5. ✅ Update frontend components
6. ✅ Add error handling
7. ✅ Write tests
8. ✅ Deploy and verify

---

For detailed information, refer to:
- **ADMIN_API_ARCHITECTURE.md** - Complete specifications
- **ADMIN_API_INTEGRATION_GUIDE.md** - Integration examples

