# Admin Dashboard API Integration Guide

## Quick Reference for Frontend Developers

This guide provides practical examples for integrating the admin dashboard APIs into the frontend components.

---

## Setup

### 1. API Client Configuration

Create or update your API client to handle admin routes:

```typescript
// utils/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Service Layer Examples

### Dashboard Service

```typescript
// services/admin/dashboardService.ts
import apiClient from '@/utils/apiClient';

export const dashboardService = {
  async getStats(period: '7d' | '30d' | 'quarter' = '30d') {
    const { data } = await apiClient.get('/admin/dashboard/stats', {
      params: { period },
    });
    return data.data;
  },

  async getSalesChart(period: '7d' | '30d' | 'quarter' = '30d') {
    const { data } = await apiClient.get('/admin/dashboard/sales-chart', {
      params: { period },
    });
    return data.data;
  },

  async getInventoryAlerts(limit: number = 10) {
    const { data } = await apiClient.get('/admin/dashboard/inventory-alerts', {
      params: { limit },
    });
    return data.data;
  },
};
```

### Products Service (Admin)

```typescript
// services/admin/productService.ts
import apiClient from '@/utils/apiClient';

export const adminProductService = {
  async list(filters: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: 'draft' | 'live';
    sort?: string;
  }) {
    const { data } = await apiClient.get('/admin/products', {
      params: filters,
    });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/admin/products/${id}`);
    return data.data;
  },

  async create(productData: any) {
    const { data } = await apiClient.post('/admin/products', productData);
    return data.data;
  },

  async update(id: string, updates: any) {
    const { data } = await apiClient.put(`/admin/products/${id}`, updates);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await apiClient.delete(`/admin/products/${id}`);
    return data;
  },
};
```

### Orders Service (Admin)

```typescript
// services/admin/orderService.ts
import apiClient from '@/utils/apiClient';

export const adminOrderService = {
  async list(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { data } = await apiClient.get('/admin/orders', {
      params: filters,
    });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/admin/orders/${id}`);
    return data.data;
  },

  async updateStatus(id: string, status: string, notes?: string) {
    const { data } = await apiClient.put(`/admin/orders/${id}/status`, {
      status,
      notes,
    });
    return data.data;
  },

  async exportCSV(filters?: any) {
    const response = await apiClient.get('/admin/orders/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
```

### Customers Service (Admin)

```typescript
// services/admin/customerService.ts
import apiClient from '@/utils/apiClient';

export const adminCustomerService = {
  async list(filters: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { data } = await apiClient.get('/admin/customers', {
      params: filters,
    });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/admin/customers/${id}`);
    return data.data;
  },
};
```

### Inventory Service (Admin)

```typescript
// services/admin/inventoryService.ts
import apiClient from '@/utils/apiClient';

export const adminInventoryService = {
  async list(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  }) {
    const { data } = await apiClient.get('/admin/inventory', {
      params: filters,
    });
    return data.data;
  },

  async getStats() {
    const { data } = await apiClient.get('/admin/inventory/stats');
    return data.data;
  },

  async updateStock(variantId: string, action: 'set' | 'add' | 'subtract', quantity: number) {
    const { data } = await apiClient.put(`/admin/inventory/${variantId}/stock`, {
      action,
      quantity,
    });
    return data.data;
  },
};
```

### Settings Service

```typescript
// services/admin/settingsService.ts
import apiClient from '@/utils/apiClient';

export const adminSettingsService = {
  async get() {
    const { data } = await apiClient.get('/admin/settings');
    return data.data;
  },

  async update(settings: any) {
    const { data } = await apiClient.put('/admin/settings', settings);
    return data.data;
  },
};
```

---

## React Hooks with TanStack Query

### Dashboard Hooks

```typescript
// hooks/useAdminDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/admin/dashboardService';

export function useDashboardStats(period: '7d' | '30d' | 'quarter' = '30d') {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats', period],
    queryFn: () => dashboardService.getStats(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}

export function useSalesChart(period: '7d' | '30d' | 'quarter' = '30d') {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'sales-chart', period],
    queryFn: () => dashboardService.getSalesChart(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventoryAlerts(limit: number = 10) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'inventory-alerts', limit],
    queryFn: () => dashboardService.getInventoryAlerts(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Products Hooks

```typescript
// hooks/useAdminProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '@/services/admin/productService';

export function useAdminProducts(filters: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'draft' | 'live';
}) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    queryFn: () => adminProductService.list(filters),
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => adminProductService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: any) => adminProductService.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      adminProductService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminProductService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
```

### Orders Hooks

```typescript
// hooks/useAdminOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderService } from '@/services/admin/orderService';

export function useAdminOrders(filters: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: () => adminOrderService.list(filters),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => adminOrderService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminOrderService.updateStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', variables.id] });
    },
  });
}
```

---

## Component Integration Examples

### Dashboard Component

```typescript
// components/admin/Dashboard.tsx
'use client';

import { useDashboardStats, useSalesChart, useInventoryAlerts } from '@/hooks/useAdminDashboard';
import { useAdminOrders } from '@/hooks/useAdminOrders';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats('30d');
  const { data: salesChart, isLoading: chartLoading } = useSalesChart('30d');
  const { data: alerts, isLoading: alertsLoading } = useInventoryAlerts(10);
  const { data: recentOrders, isLoading: ordersLoading } = useAdminOrders({
    limit: 10,
    sort: 'created_at:desc',
  });

  if (statsLoading || chartLoading || alertsLoading || ordersLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Total Sales (Month)"
          value={`$${stats?.totalSales.value.toLocaleString()}`}
          trend={stats?.totalSales.trend}
        />
        {/* ... more stat cards */}
      </div>

      {/* Sales Chart */}
      <SalesChart data={salesChart?.dataPoints} />

      {/* Inventory Alerts */}
      <InventoryAlerts alerts={alerts?.alerts} />

      {/* Recent Orders */}
      <RecentOrdersTable orders={recentOrders?.orders} />
    </div>
  );
}
```

### Products List Component

```typescript
// components/admin/Products.tsx
'use client';

import { useState } from 'react';
import { useAdminProducts, useDeleteProduct } from '@/hooks/useAdminProducts';

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState<'draft' | 'live' | undefined>(undefined);

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 10,
    search: search || undefined,
    category: category !== 'All Categories' ? category : undefined,
    status,
  });

  const deleteProduct = useDeleteProduct();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      {/* Search and filters */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
      />

      {/* Products table */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Status</th>
            <th>Category</th>
            <th>Inventory</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.status}</td>
              <td>{product.categories.map(c => c.name).join(', ')}</td>
              <td>{product.totalStock} in stock</td>
              <td>${product.basePrice.toFixed(2)}</td>
              <td>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {data?.pagination.totalPages}</span>
        <button
          disabled={page === data?.pagination.totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Orders Component with Status Update

```typescript
// components/admin/Orders.tsx
'use client';

import { useState } from 'react';
import { useAdminOrders, useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders';

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrders({
    status: statusFilter !== 'All' ? statusFilter : undefined,
    limit: 20,
  });

  const { data: orderDetails } = useAdminOrder(selectedOrderId || '');
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({
      id: orderId,
      status: newStatus,
    });
  };

  return (
    <div>
      {/* Status filter tabs */}
      <div>
        {['All', 'Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'active' : ''}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <table>
        <tbody>
          {data?.orders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.customer.name}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>{order.status}</td>
              <td>
                <button onClick={() => setSelectedOrderId(order.id)}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Order Details Modal */}
      {selectedOrderId && orderDetails && (
        <OrderDetailsModal
          order={orderDetails}
          onStatusUpdate={(status) => handleStatusUpdate(selectedOrderId, status)}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
```

### Inventory Component with Stock Update

```typescript
// components/admin/Inventory.tsx
'use client';

import { useState } from 'react';
import { useAdminInventory, useAdminInventoryStats, useUpdateStock } from '@/hooks/useAdminInventory';

export default function AdminInventory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const { data, isLoading } = useAdminInventory({
    search: search || undefined,
    status: statusFilter !== 'All' ? statusFilter as any : undefined,
  });

  const { data: stats } = useAdminInventoryStats();
  const updateStock = useUpdateStock();

  const handleStockUpdate = async (
    variantId: string,
    action: 'set' | 'add' | 'subtract',
    quantity: number
  ) => {
    await updateStock.mutateAsync({
      variantId,
      action,
      quantity,
    });
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p>Total SKUs</p>
          <p className="text-3xl">{stats?.totalSKUs}</p>
        </div>
        <div>
          <p>Low Stock</p>
          <p className="text-3xl">{stats?.lowStockCount}</p>
        </div>
        <div>
          <p>In Stock Healthy</p>
          <p className="text-3xl">{stats?.inStockHealthyCount}</p>
        </div>
      </div>

      {/* Inventory table */}
      <table>
        <tbody>
          {data?.items.map((item) => (
            <tr key={item.variantId}>
              <td>{item.sku}</td>
              <td>{item.productName}</td>
              <td>{item.color} / {item.size}</td>
              <td>{item.stock}</td>
              <td>
                <button
                  onClick={() => {
                    const quantity = prompt('Enter quantity:');
                    if (quantity) {
                      handleStockUpdate(item.variantId, 'set', parseInt(quantity));
                    }
                  }}
                >
                  Update Stock
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Error Handling Pattern

Create a reusable error handler:

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Validation error: ${data.error?.message || 'Invalid request'}`;
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'Forbidden. You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error?.message || 'An error occurred';
    }
  }
  
  return 'Network error. Please check your connection.';
}
```

Use in components:

```typescript
const { data, error, isLoading } = useAdminProducts(filters);

if (error) {
  return <div className="error">{handleApiError(error)}</div>;
}
```

---

## Loading States

Create a reusable loading component:

```typescript
// components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}
```

---

## Best Practices

1. **Always use TanStack Query** for data fetching to get caching, refetching, and error handling
2. **Invalidate queries** after mutations to keep data fresh
3. **Use optimistic updates** for better UX when appropriate
4. **Handle loading and error states** in all components
5. **Type your API responses** using TypeScript interfaces
6. **Use pagination** for large lists to improve performance
7. **Debounce search inputs** to reduce API calls
8. **Cache dashboard stats** with appropriate stale times

---

## Next Steps

1. Implement the API routes following the specifications in `ADMIN_API_ARCHITECTURE.md`
2. Create service functions for each API endpoint
3. Create React hooks using TanStack Query
4. Update existing components to use the new hooks
5. Add error handling and loading states
6. Test all integrations thoroughly

