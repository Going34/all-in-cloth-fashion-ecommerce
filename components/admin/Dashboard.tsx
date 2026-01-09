'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dashboardActions } from '@/store/slices/dashboard/dashboardSlice';
import { 
  selectDashboardStats, 
  selectSalesChart,
  selectInventoryAlerts,
  selectDashboardLoading, 
  selectDashboardError,
  selectDashboardPeriod
} from '@/store/slices/dashboard/dashboardSelectors';
import { TrendingUp, ShoppingBag, Package, AlertCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectDashboardStats);
  const salesChart = useAppSelector(selectSalesChart);
  const inventoryAlerts = useAppSelector(selectInventoryAlerts);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const period = useAppSelector(selectDashboardPeriod);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'quarter'>('30d');

  useEffect(() => {
    dispatch(dashboardActions.fetchDashboardStatsRequest(selectedPeriod));
    dispatch(dashboardActions.fetchSalesChartRequest({ period: selectedPeriod }));
    dispatch(dashboardActions.fetchInventoryAlertsRequest(10));
  }, [dispatch, selectedPeriod]);

  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'quarter') => {
    setSelectedPeriod(newPeriod);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const displayStats = stats ? [
    { 
      label: 'Total Sales (Month)', 
      value: formatCurrency(stats.totalSales.value, { showDecimals: false }), 
      icon: DollarSign, 
      trend: stats.totalSales.trend?.percentage ? `${stats.totalSales.trend.percentage > 0 ? '+' : ''}${stats.totalSales.trend.percentage}%` : '0%', 
      isUp: stats.totalSales.trend?.direction === 'up' 
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders.count.toString(), 
      icon: Clock, 
      trend: stats.pendingOrders.trend?.change ? `${stats.pendingOrders.trend.change > 0 ? '+' : ''}${stats.pendingOrders.trend.change}` : '0', 
      isUp: stats.pendingOrders.trend?.direction === 'up' 
    },
    { 
      label: 'Low Stock SKU', 
      value: stats.lowStockSKUs.count.toString(), 
      icon: AlertCircle, 
      trend: stats.lowStockSKUs.trend?.change ? `${stats.lowStockSKUs.trend.change > 0 ? '+' : ''}${stats.lowStockSKUs.trend.change}` : '0', 
      isUp: false, 
      alert: stats.lowStockSKUs.hasAlert 
    },
    { 
      label: 'Active Customers', 
      value: stats.activeCustomers.count.toLocaleString(), 
      icon: TrendingUp, 
      trend: stats.activeCustomers.trend?.percentage ? `${stats.activeCustomers.trend.percentage > 0 ? '+' : ''}${stats.activeCustomers.trend.percentage}%` : '0%', 
      isUp: stats.activeCustomers.trend?.direction === 'up' 
    },
  ] : [];

  const salesChartData = salesChart?.dataPoints || [];
  const maxSales = salesChartData.length > 0 ? Math.max(...salesChartData.map(d => d.sales)) : 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Real-time business performance metrics.</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as '7d' | '30d' | 'quarter')}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-indigo-600" size={24} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.alert ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-serif text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Activity</h3>
          {salesChartData.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {salesChartData.map((dataPoint, i) => {
                const height = maxSales > 0 ? (dataPoint.sales / maxSales) * 100 : 0;
                return (
                  <div key={i} className="flex-1 space-y-2 group">
                    <div className="relative h-full bg-slate-50 rounded-t-lg overflow-hidden">
                      <div 
                        className="absolute bottom-0 w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-lg"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-tighter">
                      {new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No sales data available
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <Package size={20} className="mr-2 text-red-500" />
            Inventory Alerts
          </h3>
          <div className="space-y-4 flex-1">
            {inventoryAlerts.length > 0 ? (
              inventoryAlerts.slice(0, 3).map((item) => (
                <div key={item.variantId} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-slate-900 truncate pr-2">{item.productName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      item.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.sku}</p>
                    <p className="text-xs font-bold text-slate-700">Stock: {item.stock}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm text-center py-8">No inventory alerts</div>
            )}
          </div>
          <button className="mt-6 w-full py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            View All Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
