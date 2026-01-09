import {
  getDashboardStats,
  getSalesChartData,
  getInventoryAlerts,
} from './dashboard.repository';
import type {
  DashboardStatsResponse,
  DashboardPeriod,
  SalesChartResponse,
  InventoryAlertsResponse,
} from './dashboard.types';

export async function getDashboardStatsService(period: DashboardPeriod = '30d'): Promise<DashboardStatsResponse> {
  return await getDashboardStats(period);
}

export async function getSalesChartService(
  period: DashboardPeriod = '30d',
  granularity: 'day' | 'week' | 'month' = 'day'
): Promise<SalesChartResponse> {
  return await getSalesChartData(period, granularity);
}

export async function getInventoryAlertsService(limit: number = 10): Promise<InventoryAlertsResponse> {
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  return await getInventoryAlerts(limit);
}

