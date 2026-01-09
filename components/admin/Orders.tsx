'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { ordersActions } from '@/store/slices/orders/ordersSlice';
import { 
  selectOrders, 
  selectOrdersLoading, 
  selectOrdersError,
  selectOrdersPagination,
  selectSelectedOrder
} from '@/store/slices/orders/ordersSelectors';
import { Search, Filter, Download, FileText, X, Package, Truck, CheckCircle2, User, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';

const Orders: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const pagination = useAppSelector(selectOrdersPagination);
  const selectedOrder = useAppSelector(selectSelectedOrder);
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(ordersActions.fetchOrdersDataRequest({ 
      page: pagination.page, 
      limit: pagination.limit,
      status: activeTab !== 'All' ? activeTab as OrderStatus : undefined,
      search: searchTerm || undefined,
    }));
  }, [dispatch, pagination.page, pagination.limit, activeTab, searchTerm]);

  useEffect(() => {
    if (selectedOrderId) {
      dispatch(ordersActions.fetchOrderByIdRequest(selectedOrderId));
    }
  }, [dispatch, selectedOrderId]);

  const tabs = ['All', 'Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeTab !== 'All') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [orders, activeTab, searchTerm]);

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    dispatch(ordersActions.updateOrderStatusRequest({ id: orderId, status: newStatus }));
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Shipping'];
    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleDateString(),
      order.customer_name || 'N/A',
      order.customer_email || 'N/A',
      formatCurrency(order.total),
      order.status,
      order.shipping_method || 'Standard'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openDetailsModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage fulfillment and track payment status.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex overflow-x-auto space-x-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
            }}
            className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab} {activeTab === tab && `(${filteredOrders.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Invoice</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Loading orders...' : 'No orders found'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600">{order.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">{order.customer_name || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                            order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'delivered' ? 'bg-indigo-100 text-indigo-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <FileText size={18} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => openDetailsModal(order.id)}
                              className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline underline-offset-4"
                            >
                              View Details
                            </button>
                          </div>
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => dispatch(ordersActions.fetchOrdersDataRequest({ 
                      page: pagination.page - 1, 
                      limit: pagination.limit,
                      status: activeTab !== 'All' ? activeTab as OrderStatus : undefined,
                      search: searchTerm || undefined,
                    }))}
                    disabled={pagination.page === 1 || loading}
                    className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => dispatch(ordersActions.fetchOrdersDataRequest({ 
                      page: pagination.page + 1, 
                      limit: pagination.limit,
                      status: activeTab !== 'All' ? activeTab as OrderStatus : undefined,
                      search: searchTerm || undefined,
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

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif text-slate-900">{selectedOrder.id}</h2>
                <p className="text-sm text-slate-500 mt-1">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={closeDetailsModal}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <User size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Customer</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.customer_name || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{selectedOrder.customer_email || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <MapPin size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Shipping Address</span>
                    </div>
                    <p className="text-sm text-slate-900">{selectedOrder.shipping_address || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <CreditCard size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Payment Method</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <Truck size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Shipping Method</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.shipping_method || 'Standard'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
                    <div className="mt-2">
                      <select 
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value as OrderStatus)}
                        disabled={loading}
                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.product_name || 'Product'}</p>
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <p>Quantity: {item.quantity}</p>
                            {item.sku && <p>SKU: {item.sku}</p>}
                            {item.color && item.size && <p>{item.color} / {item.size}</p>}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency((item.price || 0) * item.quantity)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No items found</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-serif text-slate-900">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
