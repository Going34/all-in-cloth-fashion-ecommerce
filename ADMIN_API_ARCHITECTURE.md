# Admin Dashboard API Architecture Plan

## Executive Summary

This document provides a comprehensive API architecture plan for the admin dashboard, mapping all frontend components to their required backend endpoints with complete specifications for implementation.

---

## Table of Contents

1. [Dashboard Components Analysis](#dashboard-components-analysis)
2. [API Endpoint Mapping](#api-endpoint-mapping)
3. [Complete API Specifications](#complete-api-specifications)
4. [Frontend Integration Guide](#frontend-integration-guide)
5. [Implementation Priority](#implementation-priority)

---

## Dashboard Components Analysis

### 1. Dashboard Overview Component (`/admin/dashboard`)

**Data Elements:**
- **Statistics Cards:**
  - Total Sales (Month) - with trend percentage
  - Pending Orders Count - with trend
  - Low Stock SKU Count - with alert indicator
  - Active Customers Count - with trend percentage
- **Sales Activity Chart:**
  - Daily sales data for the last 12 days
  - Bar chart visualization data
- **Inventory Alerts:**
  - List of products with low/out of stock status
  - Product name, SKU, and current stock level
- **Recent Orders Table:**
  - Order ID, Customer name, Items count, Total amount, Status, Date

**Required APIs:**
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/sales-chart` - Sales chart data
- `GET /api/admin/dashboard/inventory-alerts` - Low stock alerts
- `GET /api/admin/orders?limit=10&sort=created_at:desc` - Recent orders

---

### 2. Products Management (`/admin/products`)

**Data Elements:**
- **Product List:**
  - Product name, image, SKU
  - Status (Live/Draft)
  - Category
  - Inventory count (total stock across variants)
  - Variant count
  - Base price
- **Search & Filters:**
  - Search by name, category, or SKU
  - Filter by category
  - Pagination (10 items per page)
- **Actions:**
  - Create new product
  - Edit existing product
  - Delete product

**Required APIs:**
- `GET /api/admin/products` - List products with pagination, search, filters
- `GET /api/admin/products/:id` - Get single product with full details
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/categories` - List all categories for filter dropdown

---

### 3. Orders Management (`/admin/orders`)

**Data Elements:**
- **Order List:**
  - Order ID, Date, Customer name/email, Total, Status
  - Filter by status (All, Pending, Paid, Shipped, Delivered, Cancelled)
  - Search by Order ID, customer name, or email
- **Order Details Modal:**
  - Customer information (name, email, phone, address)
  - Shipping address
  - Payment method
  - Shipping method
  - Order status (with update capability)
  - Order items (name, quantity, SKU, color, size, price)
  - Order total breakdown
- **Actions:**
  - View order details
  - Update order status
  - Export orders to CSV
  - Generate invoice

**Required APIs:**
- `GET /api/admin/orders` - List orders with filters, search, pagination
- `GET /api/admin/orders/:id` - Get order with full details (items, customer, payment, shipping)
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/orders/export` - Export orders as CSV
- `GET /api/admin/orders/:id/invoice` - Generate invoice PDF

---

### 4. Customers Management (`/admin/customers`)

**Data Elements:**
- **Customer List:**
  - Customer name, email, phone
  - Total orders count
  - Total spent amount
  - Last order date
  - Join date
- **Customer Details Modal:**
  - Full customer information
  - Address
  - Order history with status and totals
- **Search:**
  - Search by name, email, or order ID
- **Pagination:**
  - 10 customers per page

**Required APIs:**
- `GET /api/admin/customers` - List customers with search, pagination
- `GET /api/admin/customers/:id` - Get customer with full details and order history
- `GET /api/admin/customers/:id/orders` - Get customer's order history

---

### 5. Inventory Management (`/admin/inventory`)

**Data Elements:**
- **Statistics:**
  - Total SKU count
  - Low stock items count
  - In stock healthy count
- **Inventory List:**
  - SKU code
  - Product name and variant (color/size)
  - Status (Normal/Low/Out of Stock)
  - Current stock level with visual indicator
  - Low stock threshold
- **Search & Filters:**
  - Search by SKU, product name, color, or size
  - Filter by status
- **Actions:**
  - Update stock (set, add, or subtract)
  - Refresh inventory data

**Required APIs:**
- `GET /api/admin/inventory` - List inventory items with search, filters
- `GET /api/admin/inventory/stats` - Inventory statistics
- `PUT /api/admin/inventory/:variantId/stock` - Update stock level
- `GET /api/admin/inventory/alerts` - Get low stock alerts

---

### 6. Roles & Permissions (`/admin/roles`)

**Data Elements:**
- **Role Configurations:**
  - Admin, Ops, Support role descriptions
- **Team Members List:**
  - Name, email, role, last active timestamp
- **Actions:**
  - Invite new team member
  - Edit member role
  - Delete team member
  - Reset password

**Required APIs:**
- `GET /api/admin/roles` - List all roles with permissions
- `GET /api/admin/team` - List all team members
- `POST /api/admin/team/invite` - Invite new team member
- `PUT /api/admin/team/:userId/role` - Update team member role
- `DELETE /api/admin/team/:userId` - Remove team member
- `POST /api/admin/team/:userId/reset-password` - Reset password

---

### 7. Settings (`/admin/settings`)

**Data Elements:**
- **General Brand Info:**
  - Store name
  - Support email
  - Store description
- **Shipping & Logistics:**
  - Standard shipping rate
  - Tax configuration (VAT/Sales Tax percentage)
- **Payment Methods:**
  - Stripe Checkout (enabled/disabled)
  - PayPal Express (enabled/disabled)
  - Apple Pay (enabled/disabled)
  - Google Pay (enabled/disabled)

**Required APIs:**
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/settings/shipping` - Get shipping configuration
- `PUT /api/admin/settings/shipping` - Update shipping rate
- `GET /api/admin/settings/tax` - Get tax configuration
- `PUT /api/admin/settings/tax` - Update tax rate
- `GET /api/admin/settings/payment-methods` - Get payment methods configuration
- `PUT /api/admin/settings/payment-methods` - Update payment methods

---

## API Endpoint Mapping

### Dashboard APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Stats Cards | `/api/admin/dashboard/stats` | GET | Get dashboard statistics |
| Sales Chart | `/api/admin/dashboard/sales-chart` | GET | Get sales chart data |
| Inventory Alerts | `/api/admin/dashboard/inventory-alerts` | GET | Get low stock alerts |
| Recent Orders | `/api/admin/orders?limit=10` | GET | Get recent orders |

### Products APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List Products | `/api/admin/products` | GET | List all products with filters |
| Get Product | `/api/admin/products/:id` | GET | Get single product details |
| Create Product | `/api/admin/products` | POST | Create new product |
| Update Product | `/api/admin/products/:id` | PUT | Update product |
| Delete Product | `/api/admin/products/:id` | DELETE | Delete product |
| List Categories | `/api/admin/categories` | GET | Get all categories |

### Orders APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List Orders | `/api/admin/orders` | GET | List orders with filters |
| Get Order | `/api/admin/orders/:id` | GET | Get order details |
| Update Status | `/api/admin/orders/:id/status` | PUT | Update order status |
| Export CSV | `/api/admin/orders/export` | GET | Export orders as CSV |
| Generate Invoice | `/api/admin/orders/:id/invoice` | GET | Generate invoice PDF |

### Customers APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List Customers | `/api/admin/customers` | GET | List customers with search |
| Get Customer | `/api/admin/customers/:id` | GET | Get customer details |
| Customer Orders | `/api/admin/customers/:id/orders` | GET | Get customer order history |

### Inventory APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List Inventory | `/api/admin/inventory` | GET | List inventory items |
| Inventory Stats | `/api/admin/inventory/stats` | GET | Get inventory statistics |
| Update Stock | `/api/admin/inventory/:variantId/stock` | PUT | Update stock level |
| Low Stock Alerts | `/api/admin/inventory/alerts` | GET | Get low stock alerts |

### Roles & Team APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List Roles | `/api/admin/roles` | GET | Get all roles |
| List Team | `/api/admin/team` | GET | List team members |
| Invite Member | `/api/admin/team/invite` | POST | Invite new member |
| Update Role | `/api/admin/team/:userId/role` | PUT | Update member role |
| Remove Member | `/api/admin/team/:userId` | DELETE | Remove team member |
| Reset Password | `/api/admin/team/:userId/reset-password` | POST | Reset password |

### Settings APIs

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Get Settings | `/api/admin/settings` | GET | Get all settings |
| Update Settings | `/api/admin/settings` | PUT | Update settings |
| Shipping Config | `/api/admin/settings/shipping` | GET/PUT | Get/update shipping |
| Tax Config | `/api/admin/settings/tax` | GET/PUT | Get/update tax |
| Payment Methods | `/api/admin/settings/payment-methods` | GET/PUT | Get/update payment methods |

---

## Complete API Specifications

### 1. Dashboard Statistics API

**Endpoint:** `GET /api/admin/dashboard/stats`

**Query Parameters:**
- `period` (optional): `"7d" | "30d" | "quarter"` - Default: `"30d"`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalSales": {
      "value": 124500.00,
      "currency": "USD",
      "trend": {
        "percentage": 12.5,
        "direction": "up" // "up" | "down"
      },
      "period": "30d"
    },
    "pendingOrders": {
      "count": 28,
      "trend": {
        "change": -2,
        "direction": "down"
      }
    },
    "lowStockSKUs": {
      "count": 5,
      "trend": {
        "change": 1,
        "direction": "up"
      },
      "hasAlert": true
    },
    "activeCustomers": {
      "count": 1420,
      "trend": {
        "percentage": 8.0,
        "direction": "up"
      }
    }
  }
}
```

---

### 2. Sales Chart Data API

**Endpoint:** `GET /api/admin/dashboard/sales-chart`

**Query Parameters:**
- `period` (optional): `"7d" | "30d" | "quarter"` - Default: `"30d"`
- `granularity` (optional): `"day" | "week" | "month"` - Default: `"day"`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "period": "30d",
    "granularity": "day",
    "dataPoints": [
      {
        "date": "2024-01-01",
        "sales": 4500.00,
        "orders": 12
      },
      // ... more data points
    ],
    "totalSales": 124500.00,
    "totalOrders": 342
  }
}
```

---

### 3. Inventory Alerts API

**Endpoint:** `GET /api/admin/dashboard/inventory-alerts`

**Query Parameters:**
- `limit` (optional): number - Default: `10`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "alerts": [
      {
        "variantId": "variant-uuid",
        "productName": "Midnight Silk Slip Dress",
        "sku": "W-SLK-M-01",
        "stock": 2,
        "lowStockThreshold": 5,
        "status": "low_stock" // "low_stock" | "out_of_stock"
      },
      // ... more alerts
    ],
    "totalAlerts": 5
  }
}
```

---

### 4. List Products API (Admin)

**Endpoint:** `GET /api/admin/products`

**Query Parameters:**
- `page` (optional): number - Default: `1`
- `limit` (optional): number - Default: `10`
- `search` (optional): string - Search by name, category, or SKU
- `category` (optional): string - Filter by category name
- `status` (optional): `"draft" | "live"` - Filter by status
- `sort` (optional): `"name:asc" | "name:desc" | "created_at:asc" | "created_at:desc" | "price:asc" | "price:desc"` - Default: `"created_at:desc"`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product-uuid",
        "name": "Midnight Silk Slip Dress",
        "description": "Product description...",
        "basePrice": 189.00,
        "status": "live",
        "featured": false,
        "image": "https://...",
        "categories": [
          {
            "id": "category-uuid",
            "name": "Women"
          }
        ],
        "variantCount": 6,
        "totalStock": 45,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:22:00Z"
      },
      // ... more products
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 125,
      "totalPages": 13
    }
  }
}
```

---

### 5. Get Product Details API (Admin)

**Endpoint:** `GET /api/admin/products/:id`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "name": "Midnight Silk Slip Dress",
    "description": "Full product description...",
    "basePrice": 189.00,
    "status": "live",
    "featured": false,
    "images": [
      "https://...",
      "https://..."
    ],
    "categories": [
      {
        "id": "category-uuid",
        "name": "Women"
      }
    ],
    "variants": [
      {
        "id": "variant-uuid",
        "sku": "W-SLK-M-01",
        "color": "Midnight",
        "size": "M",
        "priceOverride": null,
        "isActive": true,
        "images": ["https://..."],
        "inventory": {
          "stock": 12,
          "reservedStock": 0,
          "lowStockThreshold": 5,
          "availableStock": 12,
          "status": "in_stock"
        }
      },
      // ... more variants
    ],
    "avgRating": 4.5,
    "reviewCount": 23,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

---

### 6. Create Product API

**Endpoint:** `POST /api/admin/products`

**Request Body:**
```typescript
{
  "name": "Product Name",
  "description": "Product description",
  "basePrice": 189.00,
  "status": "draft", // "draft" | "live"
  "featured": false,
  "categoryIds": ["category-uuid-1", "category-uuid-2"],
  "images": ["https://...", "https://..."],
  "variants": [
    {
      "sku": "W-SLK-M-01",
      "color": "Midnight",
      "size": "M",
      "priceOverride": null,
      "isActive": true,
      "images": ["https://..."],
      "stock": 12,
      "lowStockThreshold": 5
    },
    // ... more variants
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "name": "Product Name",
    // ... full product object
  }
}
```

---

### 7. Update Product API

**Endpoint:** `PUT /api/admin/products/:id`

**Request Body:** (Same as Create, all fields optional)

**Response:**
```typescript
{
  "success": true,
  "data": {
    // ... updated product object
  }
}
```

---

### 8. Delete Product API

**Endpoint:** `DELETE /api/admin/products/:id`

**Response:**
```typescript
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 9. List Orders API (Admin)

**Endpoint:** `GET /api/admin/orders`

**Query Parameters:**
- `page` (optional): number - Default: `1`
- `limit` (optional): number - Default: `20`
- `status` (optional): `"pending" | "paid" | "shipped" | "delivered" | "cancelled"` - Filter by status
- `search` (optional): string - Search by order ID, customer name, or email
- `sort` (optional): `"created_at:asc" | "created_at:desc" | "total:asc" | "total:desc"` - Default: `"created_at:desc"`
- `dateFrom` (optional): ISO date string - Filter orders from date
- `dateTo` (optional): ISO date string - Filter orders to date

**Response:**
```typescript
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "orderNumber": "#ORD-2045",
        "customer": {
          "id": "user-uuid",
          "name": "Sarah Miller",
          "email": "sarah.m@gmail.com"
        },
        "status": "paid",
        "total": 420.00,
        "subtotal": 400.00,
        "tax": 20.00,
        "shipping": 15.00,
        "itemCount": 3,
        "createdAt": "2024-01-24T10:30:00Z",
        "updatedAt": "2024-01-24T11:15:00Z"
      },
      // ... more orders
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 342,
      "totalPages": 18
    }
  }
}
```

---

### 10. Get Order Details API (Admin)

**Endpoint:** `GET /api/admin/orders/:id`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "#ORD-2045",
    "customer": {
      "id": "user-uuid",
      "name": "Sarah Miller",
      "email": "sarah.m@gmail.com",
      "phone": "+1 (555) 123-4567"
    },
    "shippingAddress": {
      "name": "Sarah Miller",
      "street": "123 Fashion St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "status": "paid",
    "statusHistory": [
      {
        "status": "pending",
        "changedAt": "2024-01-24T10:30:00Z"
      },
      {
        "status": "paid",
        "changedAt": "2024-01-24T11:15:00Z"
      }
    ],
    "items": [
      {
        "id": "order-item-uuid",
        "productName": "Midnight Silk Slip Dress",
        "sku": "W-SLK-M-01",
        "color": "Midnight",
        "size": "M",
        "price": 189.00,
        "quantity": 1
      },
      // ... more items
    ],
    "payment": {
      "method": "credit_card",
      "status": "completed",
      "amount": 420.00,
      "transactionId": "txn_..."
    },
    "shipping": {
      "method": "standard",
      "rate": 15.00,
      "trackingNumber": null
    },
    "subtotal": 400.00,
    "tax": 20.00,
    "shipping": 15.00,
    "total": 420.00,
    "createdAt": "2024-01-24T10:30:00Z",
    "updatedAt": "2024-01-24T11:15:00Z"
  }
}
```

---

### 11. Update Order Status API

**Endpoint:** `PUT /api/admin/orders/:id/status`

**Request Body:**
```typescript
{
  "status": "shipped", // "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  "notes"?: string // Optional notes for status change
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "shipped",
    "statusHistory": [
      // ... updated status history
    ],
    "updatedAt": "2024-01-24T14:30:00Z"
  }
}
```

---

### 12. Export Orders CSV API

**Endpoint:** `GET /api/admin/orders/export`

**Query Parameters:**
- `status` (optional): Filter by status
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

**Response:** CSV file download

---

### 13. List Customers API (Admin)

**Endpoint:** `GET /api/admin/customers`

**Query Parameters:**
- `page` (optional): number - Default: `1`
- `limit` (optional): number - Default: `10`
- `search` (optional): string - Search by name, email, or order ID

**Response:**
```typescript
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "user-uuid",
        "name": "Sarah Miller",
        "email": "sarah.m@gmail.com",
        "phone": "+1 (555) 123-4567",
        "address": "123 Fashion St, New York, NY 10001",
        "totalOrders": 12,
        "totalSpent": 1420.00,
        "lastOrderDate": "2024-01-22T10:30:00Z",
        "lastOrder": "2 days ago", // Human-readable
        "joinDate": "2023-01-15T10:30:00Z",
        "isActive": true
      },
      // ... more customers
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1420,
      "totalPages": 142
    }
  }
}
```

---

### 14. Get Customer Details API

**Endpoint:** `GET /api/admin/customers/:id`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "Sarah Miller",
    "email": "sarah.m@gmail.com",
    "phone": "+1 (555) 123-4567",
    "addresses": [
      {
        "id": "address-uuid",
        "name": "Sarah Miller",
        "street": "123 Fashion St",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "USA",
        "isDefault": true
      }
    ],
    "totalOrders": 12,
    "totalSpent": 1420.00,
    "joinDate": "2023-01-15T10:30:00Z",
    "isActive": true,
    "orderHistory": [
      {
        "id": "order-uuid",
        "orderNumber": "#ORD-2045",
        "date": "2024-01-24T10:30:00Z",
        "total": 420.00,
        "status": "paid"
      },
      // ... more orders
    ]
  }
}
```

---

### 15. List Inventory API (Admin)

**Endpoint:** `GET /api/admin/inventory`

**Query Parameters:**
- `page` (optional): number - Default: `1`
- `limit` (optional): number - Default: `50`
- `search` (optional): string - Search by SKU, product name, color, or size
- `status` (optional): `"in_stock" | "low_stock" | "out_of_stock"` - Filter by status

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "variantId": "variant-uuid",
        "productId": "product-uuid",
        "productName": "Midnight Silk Slip Dress",
        "sku": "W-SLK-M-01",
        "color": "Midnight",
        "size": "M",
        "stock": 12,
        "reservedStock": 0,
        "lowStockThreshold": 5,
        "availableStock": 12,
        "status": "in_stock" // "in_stock" | "low_stock" | "out_of_stock"
      },
      // ... more items
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 342,
      "totalPages": 7
    }
  }
}
```

---

### 16. Inventory Statistics API

**Endpoint:** `GET /api/admin/inventory/stats`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalSKUs": 342,
    "lowStockCount": 5,
    "outOfStockCount": 2,
    "inStockHealthyCount": 335,
    "totalStockValue": 125000.00
  }
}
```

---

### 17. Update Stock API

**Endpoint:** `PUT /api/admin/inventory/:variantId/stock`

**Request Body:**
```typescript
{
  "action": "set", // "set" | "add" | "subtract"
  "quantity": 25,
  "notes"?: string // Optional notes for audit
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "variantId": "variant-uuid",
    "stock": 25,
    "previousStock": 12,
    "action": "set",
    "status": "in_stock",
    "updatedAt": "2024-01-24T14:30:00Z"
  }
}
```

---

### 18. List Team Members API

**Endpoint:** `GET /api/admin/team`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user-uuid",
        "name": "Jordan Smith",
        "email": "jordan@allincloth.com",
        "role": "Admin", // "Admin" | "Ops" | "Support"
        "lastActive": "2024-01-24T14:30:00Z",
        "lastActiveHuman": "Now", // Human-readable
        "createdAt": "2023-01-15T10:30:00Z"
      },
      // ... more members
    ]
  }
}
```

---

### 19. Invite Team Member API

**Endpoint:** `POST /api/admin/team/invite`

**Request Body:**
```typescript
{
  "name": "John Doe",
  "email": "john@allincloth.com",
  "role": "Support" // "Admin" | "Ops" | "Support"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@allincloth.com",
    "role": "Support",
    "inviteSent": true,
    "inviteToken": "invite-token-uuid"
  }
}
```

---

### 20. Update Team Member Role API

**Endpoint:** `PUT /api/admin/team/:userId/role`

**Request Body:**
```typescript
{
  "role": "Ops" // "Admin" | "Ops" | "Support"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "role": "Ops",
    "updatedAt": "2024-01-24T14:30:00Z"
  }
}
```

---

### 21. Get Settings API

**Endpoint:** `GET /api/admin/settings`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "general": {
      "storeName": "All in cloth",
      "supportEmail": "support@allincloth.com",
      "storeDescription": "Redefining modern luxury..."
    },
    "shipping": {
      "standardRate": 15.00,
      "expressRate": 25.00,
      "freeShippingThreshold": 100.00
    },
    "tax": {
      "rate": 8.0,
      "type": "vat" // "vat" | "sales_tax"
    },
    "paymentMethods": {
      "stripe": {
        "enabled": true,
        "publicKey": "pk_...",
        "webhookSecret": "whsec_..."
      },
      "paypal": {
        "enabled": true,
        "clientId": "..."
      },
      "applePay": {
        "enabled": true
      },
      "googlePay": {
        "enabled": true
      }
    }
  }
}
```

---

### 22. Update Settings API

**Endpoint:** `PUT /api/admin/settings`

**Request Body:**
```typescript
{
  "general"?: {
    "storeName"?: string,
    "supportEmail"?: string,
    "storeDescription"?: string
  },
  "shipping"?: {
    "standardRate"?: number,
    "expressRate"?: number,
    "freeShippingThreshold"?: number
  },
  "tax"?: {
    "rate"?: number,
    "type"?: "vat" | "sales_tax"
  },
  "paymentMethods"?: {
    "stripe"?: { "enabled": boolean },
    "paypal"?: { "enabled": boolean },
    "applePay"?: { "enabled": boolean },
    "googlePay"?: { "enabled": boolean }
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    // ... updated settings object
  }
}
```

---

## Frontend Integration Guide

### 1. Using TanStack Query (React Query)

The project already uses TanStack Query for API calls. Here's how to integrate the new APIs:

#### Example: Dashboard Stats Hook

```typescript
// hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export function useDashboardStats(period: '7d' | '30d' | 'quarter' = '30d') {
  return useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => dashboardService.getStats(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}
```

#### Example: Products List Hook

```typescript
// hooks/useAdminProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';

export function useAdminProducts(filters: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'draft' | 'live';
}) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    queryFn: () => productService.listAdmin(filters),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => productService.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
```

### 2. Service Layer Implementation

Create service functions that wrap the API calls:

```typescript
// services/dashboardService.ts
import { apiClient } from './apiClient';

export const dashboardService = {
  async getStats(period: '7d' | '30d' | 'quarter' = '30d') {
    const response = await apiClient.get('/api/admin/dashboard/stats', {
      params: { period },
    });
    return response.data;
  },

  async getSalesChart(period: '7d' | '30d' | 'quarter' = '30d') {
    const response = await apiClient.get('/api/admin/dashboard/sales-chart', {
      params: { period },
    });
    return response.data;
  },

  async getInventoryAlerts(limit: number = 10) {
    const response = await apiClient.get('/api/admin/dashboard/inventory-alerts', {
      params: { limit },
    });
    return response.data;
  },
};
```

### 3. Component Integration Example

```typescript
// components/admin/Dashboard.tsx
'use client';

import { useDashboardStats, useSalesChart, useInventoryAlerts } from '@/hooks/useDashboard';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats('30d');
  const { data: salesChart } = useSalesChart('30d');
  const { data: alerts } = useInventoryAlerts(10);

  if (statsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Use stats.data, salesChart.data, alerts.data */}
    </div>
  );
}
```

### 4. Error Handling

Implement consistent error handling:

```typescript
// services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Implementation Priority

### Phase 1: Core Dashboard (Week 1)
1. ✅ Dashboard Statistics API
2. ✅ Sales Chart Data API
3. ✅ Inventory Alerts API
4. ✅ Recent Orders API (extend existing)

### Phase 2: Products Management (Week 2)
1. ✅ List Products API (Admin)
2. ✅ Get Product Details API
3. ✅ Create Product API (exists, verify)
4. ✅ Update Product API
5. ✅ Delete Product API
6. ✅ List Categories API

### Phase 3: Orders Management (Week 3)
1. ✅ List Orders API (Admin)
2. ✅ Get Order Details API
3. ✅ Update Order Status API
4. ✅ Export Orders CSV API
5. ✅ Generate Invoice API

### Phase 4: Customers & Inventory (Week 4)
1. ✅ List Customers API
2. ✅ Get Customer Details API
3. ✅ List Inventory API
4. ✅ Inventory Statistics API
5. ✅ Update Stock API

### Phase 5: Roles & Settings (Week 5)
1. ✅ Team Management APIs
2. ✅ Settings APIs

---

## Authentication & Authorization

All admin APIs must:
1. Require authentication (JWT token)
2. Verify admin role using `requireAdmin()` middleware
3. Return `401 Unauthorized` if not authenticated
4. Return `403 Forbidden` if not admin

Example middleware:
```typescript
// lib/auth.ts
export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.roles?.some(r => r.name === 'ADMIN' || r.name === 'OPS')) {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}
```

---

## Error Response Format

All APIs should return errors in this format:

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

---

## Notes

1. **Pagination**: Use cursor-based pagination for large datasets (orders, products)
2. **Caching**: Implement appropriate cache headers for dashboard stats
3. **Rate Limiting**: Add rate limiting for admin APIs
4. **Audit Logging**: Log all admin actions for audit trail
5. **Data Validation**: Validate all inputs using Zod or similar
6. **Type Safety**: Use TypeScript types throughout

---

## Next Steps

1. Review and approve this API architecture plan
2. Create database migrations if needed for new tables (settings, audit logs)
3. Implement APIs in priority order
4. Update frontend components to use new APIs
5. Add comprehensive error handling and loading states
6. Write integration tests for all APIs
7. Document API endpoints using OpenAPI/Swagger

