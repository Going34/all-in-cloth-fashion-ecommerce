export interface CustomerListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastOrder: string;
  joinDate: string;
  isActive: boolean;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerDetailsResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Array<{
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }>;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  isActive: boolean;
  orderHistory: Array<{
    id: string;
    orderNumber: string;
    date: string;
    total: number;
    status: string;
  }>;
}

