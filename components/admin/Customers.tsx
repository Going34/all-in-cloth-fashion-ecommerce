'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { customersActions } from '@/store/slices/customers/customersSlice';
import { 
  selectCustomers, 
  selectCustomersLoading, 
  selectCustomersError,
  selectCustomersPagination,
  selectSelectedCustomer
} from '@/store/slices/customers/customersSelectors';
import { Search, User, Mail, ShoppingBag, ChevronRight, X, Calendar, MapPin, Phone, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const Customers: React.FC = () => {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(selectCustomers);
  const loading = useAppSelector(selectCustomersLoading);
  const error = useAppSelector(selectCustomersError);
  const pagination = useAppSelector(selectCustomersPagination);
  const selectedCustomer = useAppSelector(selectSelectedCustomer);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(customersActions.fetchCustomersDataRequest({ 
      page: pagination.page, 
      limit: pagination.limit,
      search: searchTerm || undefined,
    }));
  }, [dispatch, pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    if (selectedCustomerId) {
      dispatch(customersActions.fetchCustomerByIdRequest(selectedCustomerId));
    }
  }, [dispatch, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    const searchLower = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  }, [customers, searchTerm]);

  const openDetailsModal = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCustomerId(null);
  };

  const handlePageChange = (newPage: number) => {
    dispatch(customersActions.fetchCustomersDataRequest({ 
      page: newPage, 
      limit: pagination.limit,
      search: searchTerm || undefined,
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-slate-900">Customers</h1>
        <p className="text-slate-500 mt-1">Detailed overview of your client base and order history.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {loading && customers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-500">{loading ? 'Loading customers...' : 'No customers found'}</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl uppercase">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{customer.name}</h3>
                        <div className="flex items-center text-sm text-slate-500 space-x-2">
                          <Mail size={14} />
                          <span>{customer.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 md:gap-16">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Orders</p>
                        <div className="flex items-center text-sm font-bold text-slate-900 space-x-2">
                          <ShoppingBag size={14} className="text-indigo-500" />
                          <span>{customer.totalOrders}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Order</p>
                        <p className="text-sm font-bold text-slate-600">{customer.lastOrder || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openDetailsModal(customer.id)}
                        className="bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                      >
                        View History
                      </button>
                      <button 
                        onClick={() => openDetailsModal(customer.id)}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
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

      {/* Customer Details Modal */}
      {isDetailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif text-slate-900">{selectedCustomer.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedCustomer.email}</p>
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
                      <span className="text-[10px] font-bold uppercase tracking-widest">Customer Info</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                        <Phone size={14} />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <MapPin size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Address</span>
                    </div>
                    {selectedCustomer.address ? (
                      <p className="text-sm text-slate-900">{selectedCustomer.address}</p>
                    ) : (
                      <p className="text-sm text-slate-400">No address on file</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                      <Calendar size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Member Since</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                      <p className="text-2xl font-serif text-slate-900">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Spent</p>
                      <p className="text-2xl font-serif text-indigo-900">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Order History</h3>
                {selectedCustomer.orderHistory && selectedCustomer.orderHistory.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.orderHistory.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-indigo-600">{order.id}</p>
                          <p className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            order.status === 'Paid' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No order history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
