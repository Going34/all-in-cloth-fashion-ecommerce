import { ValidationError } from '@/lib/errors';
import { findInventoryItems, getInventoryStats, updateStock as updateStockRepo } from './inventory.repository';
import type { InventoryListQuery, InventoryListResponse, InventoryStatsResponse, UpdateStockRequest, InventoryListItem } from './inventory.types';

export async function listInventory(query: InventoryListQuery): Promise<InventoryListResponse> {
  const page = query.page || 1;
  const limit = query.limit || 50;

  const result = await findInventoryItems({
    page,
    limit,
    search: query.search,
    status: query.status,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    items: result.items,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
    },
  };
}

export async function getInventoryStatsService(): Promise<InventoryStatsResponse> {
  return await getInventoryStats();
}

export async function updateStockService(
  variantId: string,
  request: UpdateStockRequest
): Promise<InventoryListItem> {
  if (request.quantity < 0) {
    throw new ValidationError('Quantity must be non-negative');
  }

  if (request.action !== 'set' && request.action !== 'add' && request.action !== 'subtract') {
    throw new ValidationError('Action must be set, add, or subtract');
  }

  return await updateStockRepo(variantId, request.action, request.quantity);
}

