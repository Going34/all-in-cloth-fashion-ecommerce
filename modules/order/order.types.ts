import type { Order, OrderItem, OrderStatus, OrderStatusHistory, Payment, Address } from '@/types';

export interface CreateOrderRequest {
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  address_id: string;
  promo_code?: string;
  coupon_code?: string; // Legacy support or alias
  payment_mode?: 'PREPAID' | 'COD' | 'PARTIAL_COD';
}


export interface EnrichedOrderItem extends OrderItem {
  image_url?: string;
  color?: string;
  size?: string;
  product_slug?: string;
  product_id?: string;
}

export interface OrderResponse extends Order {
  items: EnrichedOrderItem[];
  status_history?: OrderStatusHistory[];
  payment?: Payment | null;
  shipping_address?: Address | null;
}

export interface OrderListQuery {
  cursor?: string;
  limit?: number;
  direction?: 'next' | 'prev';
  status?: OrderStatus;
}

export interface AdminOrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'created_at:asc' | 'created_at:desc' | 'total:asc' | 'total:desc';
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  itemCount: number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderListResponse {
  orders: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

