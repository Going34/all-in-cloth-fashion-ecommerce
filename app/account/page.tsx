'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ordersActions } from '../../store/slices/orders/ordersSlice';
import { selectOrders, selectOrdersLoading, selectOrdersError } from '../../store/slices/orders/ordersSelectors';
import { addressesActions } from '../../store/slices/addresses/addressesSlice';
import { selectDefaultAddress } from '../../store/slices/addresses/addressesSelectors';
import { userDataActions } from '../../store/slices/userData/userDataSlice';
import { selectUserDataLoaded } from '../../store/slices/userData/userDataSelectors';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AccountLayout from '../../components/AccountLayout';
import { formatCurrency } from '../../utils/currency';

function AccountContent() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const defaultAddress = useAppSelector(selectDefaultAddress);
  const userDataLoaded = useAppSelector(selectUserDataLoaded);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Use unified userData fetch instead of separate calls
      dispatch(userDataActions.fetchUserDataRequest());
    }
  }, [dispatch, user?.id]);

  return (
    <AccountLayout>
      <div className="space-y-8">
          <section className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-medium">Recent Orders</h3>
              <button className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors">View All</button>
            </div>
            {loading && (
              <div className="p-6 text-center">
                <p className="text-neutral-500">Loading orders...</p>
              </div>
            )}
            {error && (
              <div className="p-6 text-center">
                <p className="text-red-500">Error loading orders: {error}</p>
              </div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-neutral-500">No orders found</p>
              </div>
            )}
            {!loading && !error && orders.length > 0 && (
              <div className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Package size={24} className="text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-neutral-500">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-neutral-400">Total Price</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {order.status}
                      </span>
                    </div>
                    <button className="text-neutral-300 hover:text-neutral-900">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-neutral-100 rounded-xl space-y-4">
              <h3 className="font-medium">Primary Address</h3>
              {defaultAddress ? (
                <div className="text-sm text-neutral-500 space-y-1">
                  <p>{defaultAddress.street}</p>
                  <p>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}</p>
                  <p>{defaultAddress.country}</p>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  <p>No default address set</p>
                </div>
              )}
              <Link href="/addresses" className="text-sm text-neutral-900 font-medium underline underline-offset-4">Manage Addresses</Link>
            </div>
            <div className="p-6 border border-neutral-100 rounded-xl space-y-4">
              <h3 className="font-medium">Wishlist Status</h3>
              <p className="text-sm text-neutral-500">You have items waiting in your curated collection.</p>
              <Link href="/wishlist" className="text-sm text-neutral-900 font-medium underline underline-offset-4">View Wishlist</Link>
            </div>
          </section>
      </div>
    </AccountLayout>
  );
}

export default function Account() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

