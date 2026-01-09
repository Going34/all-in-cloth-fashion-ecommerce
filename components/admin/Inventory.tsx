'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { inventoryActions } from '@/store/slices/inventory/inventorySlice';
import { 
  selectInventory, 
  selectInventoryLoading, 
  selectInventoryError,
  selectInventoryPagination,
  selectInventoryStats
} from '@/store/slices/inventory/inventorySelectors';
import { Package, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, X, Save, Plus, Minus, Loader2 } from 'lucide-react';
import { InventoryItem } from '../../types';

const Inventory: React.FC = () => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector(selectInventory);
  const loading = useAppSelector(selectInventoryLoading);
  const error = useAppSelector(selectInventoryError);
  const pagination = useAppSelector(selectInventoryPagination);
  const stats = useAppSelector(selectInventoryStats);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockUpdate, setStockUpdate] = useState({ quantity: '', action: 'set' as 'set' | 'add' | 'subtract' });

  useEffect(() => {
    dispatch(inventoryActions.fetchInventoryDataRequest({ 
      page: pagination.page, 
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'All' ? statusFilter as 'in_stock' | 'low_stock' | 'out_of_stock' : undefined,
    }));
    dispatch(inventoryActions.fetchInventoryStatsRequest());
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      const statusMap: Record<string, string> = {
        'Normal': 'in_stock',
        'Low': 'low_stock',
        'Out of Stock': 'out_of_stock',
      };
      const mappedStatus = statusMap[statusFilter];
      if (mappedStatus) {
        filtered = filtered.filter(item => item.status === mappedStatus);
      }
    }

    return filtered;
  }, [inventory, searchTerm, statusFilter]);

  const displayStats = stats || {
    totalSKUs: inventory.length,
    lowStockCount: inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length,
    outOfStockCount: inventory.filter(item => item.status === 'out_of_stock').length,
    inStockHealthyCount: inventory.filter(item => item.status === 'in_stock').length,
  };

  const openUpdateModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockUpdate({ quantity: item.stock.toString(), action: 'set' });
    setIsUpdateModalOpen(true);
  };

  const handleStockUpdate = () => {
    if (!selectedItem || !stockUpdate.quantity) return;

    const quantity = parseInt(stockUpdate.quantity);
    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    dispatch(inventoryActions.updateStockRequest({
      variantId: selectedItem.variant_id,
      action: stockUpdate.action,
      quantity: quantity,
    }));

    setIsUpdateModalOpen(false);
    setSelectedItem(null);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setStatusFilter('All');
    dispatch(inventoryActions.fetchInventoryDataRequest({ page: 1, limit: pagination.limit }));
    dispatch(inventoryActions.fetchInventoryStatsRequest());
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track SKU-level quantity and configure low-stock alerts.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 text-slate-500 mb-2">
            <Package size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Total SKU Count</span>
          </div>
          <p className="text-3xl font-serif text-slate-900">{displayStats.totalSKUs}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 text-orange-600 mb-2">
            <AlertTriangle size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Low Stock Items</span>
          </div>
          <p className="text-3xl font-serif text-slate-900">{displayStats.lowStockCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 text-green-600 mb-2">
            <CheckCircle2 size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">In Stock Healthy</span>
          </div>
          <p className="text-3xl font-serif text-slate-900">{displayStats.inStockHealthyCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search SKU, Product Name, Color, or Size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>All</option>
            <option>Normal</option>
            <option>Low</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading && inventory.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">SKU Code</th>
                    <th className="px-6 py-4">Product & Variant</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Threshold</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Loading inventory...' : 'No inventory items found'}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.variant_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 font-mono tracking-tight">{item.sku}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{item.product_name}</span>
                            <span className="text-[10px] text-slate-500">{item.color} / {item.size}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            item.status === 'in_stock' ? 'bg-green-100 text-green-700' : 
                            item.status === 'low_stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.status === 'in_stock' ? 'Normal' : item.status === 'low_stock' ? 'Low' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-bold ${item.stock <= item.low_stock_threshold ? 'text-red-600' : 'text-slate-900'}`}>{item.stock}</span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${item.stock <= item.low_stock_threshold ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (item.stock / (item.low_stock_threshold * 4)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.low_stock_threshold}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openUpdateModal(item)}
                            className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 underline underline-offset-4"
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => dispatch(inventoryActions.fetchInventoryDataRequest({ 
                      page: pagination.page - 1, 
                      limit: pagination.limit,
                      search: searchTerm || undefined,
                      status: statusFilter !== 'All' ? statusFilter as 'in_stock' | 'low_stock' | 'out_of_stock' : undefined,
                    }))}
                    disabled={pagination.page === 1 || loading}
                    className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => dispatch(inventoryActions.fetchInventoryDataRequest({ 
                      page: pagination.page + 1, 
                      limit: pagination.limit,
                      search: searchTerm || undefined,
                      status: statusFilter !== 'All' ? statusFilter as 'in_stock' | 'low_stock' | 'out_of_stock' : undefined,
                    }))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Update Stock Modal */}
      {isUpdateModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">Update Stock</h3>
              <button 
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{selectedItem.product_name}</p>
                <p className="text-xs text-slate-500">{selectedItem.color} / {selectedItem.size} - {selectedItem.sku}</p>
                <p className="text-sm text-slate-600 mt-2">Current Stock: <span className="font-bold">{selectedItem.stock}</span></p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</label>
                <select 
                  value={stockUpdate.action}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, action: e.target.value as 'set' | 'add' | 'subtract' })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantity</label>
                <input 
                  type="number"
                  min="0"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter quantity"
                />
              </div>
              {stockUpdate.action !== 'set' && stockUpdate.quantity && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">New Stock:</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stockUpdate.action === 'add' 
                      ? selectedItem.stock + parseInt(stockUpdate.quantity || '0')
                      : Math.max(0, selectedItem.stock - parseInt(stockUpdate.quantity || '0'))
                    }
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStockUpdate}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={18} />
                <span>{loading ? 'Updating...' : 'Update'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
