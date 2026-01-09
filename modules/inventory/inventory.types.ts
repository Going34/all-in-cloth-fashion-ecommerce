export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InventoryStatus;
}

export interface InventoryListItem {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  availableStock: number;
  status: InventoryStatus;
}

export interface InventoryListResponse {
  items: InventoryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryStatsResponse {
  totalSKUs: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockHealthyCount: number;
  totalStockValue?: number;
}

export interface UpdateStockRequest {
  action: 'set' | 'add' | 'subtract';
  quantity: number;
  notes?: string;
}

