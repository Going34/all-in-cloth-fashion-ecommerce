'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Package, Truck, CheckCircle, Clock,
    MapPin, CreditCard, AlertCircle, Calendar, User, DollarSign
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccountLayout from '@/components/AccountLayout';
import { formatCurrency } from '@/utils/currency';
import type { OrderResponse, EnrichedOrderItem } from '@/modules/order/order.types';
import type { OrderStatus } from '@/types';

// Helper to format date
const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusStep = (status: OrderStatus) => {
    switch (status) {
        case 'pending': return 1;
        case 'paid': return 2;
        case 'shipped': return 3;
        case 'delivered': return 4;
        case 'cancelled': return -1;
        default: return 0;
    }
};

const Timeline = ({ status, history }: { status: OrderStatus, history: any[] }) => {
    const currentStep = getStatusStep(status);

    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4 text-red-700">
                <AlertCircle size={24} />
                <div>
                    <p className="font-semibold">Order Cancelled</p>
                    <p className="text-sm opacity-80">This order has been cancelled.</p>
                </div>
            </div>
        );
    }

    const steps = [
        { label: 'Order Placed', icon: Clock, step: 1 },
        { label: 'Processing', icon: Package, step: 2 }, // approximating 'paid' as processing
        { label: 'Shipped', icon: Truck, step: 3 },
        { label: 'Delivered', icon: CheckCircle, step: 4 },
    ];

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 -z-10 rounded-full" />

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 -z-10 transition-all duration-500 rounded-full"
                    style={{ width: `${((Math.max(1, currentStep) - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s, index) => {
                    const isActive = currentStep >= s.step;
                    const isCompleted = currentStep > s.step;

                    return (
                        <div key={s.label} className="flex flex-col items-center gap-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white
                  ${isActive ? 'border-green-600 text-green-600' : 'border-neutral-300 text-neutral-300'}
                  ${isCompleted ? 'bg-green-600 !text-white !border-green-600' : ''}
                `}
                            >
                                <s.icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id || !user) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/orders/${id}`);

                if (!response.ok) {
                    if (response.status === 404) throw new Error('Order not found');
                    if (response.status === 401) throw new Error('Unauthorized');
                    throw new Error('Failed to fetch order');
                }

                const data = await response.json();
                // Assuming successResponse wrapper: { success: true, data: ... } or just data
                // API route returns successResponse(order) which is { success: true, data: order, ... }
                // Let's assume standard response wrapper or check field
                const orderData = data.data || data;
                setOrder(orderData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchOrder();
        }
    }, [id, user, authLoading]);

    // Loading State
    if (authLoading || loading) {
        return (
            <AccountLayout>
                <div className="space-y-6 animate-pulse">
                    <div className="h-8 bg-neutral-100 w-1/3 rounded-lg" />
                    <div className="h-24 bg-neutral-100 rounded-xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-64 bg-neutral-100 rounded-xl" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-48 bg-neutral-100 rounded-xl" />
                            <div className="h-48 bg-neutral-100 rounded-xl" />
                        </div>
                    </div>
                </div>
            </AccountLayout>
        );
    }

    // Error State
    if (error || !order) {
        return (
            <AccountLayout>
                <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900">Unable to load order</h2>
                    <p className="text-neutral-500 max-w-md mx-auto">{error || 'Order not found'}</p>
                    <Link
                        href="/account"
                        className="inline-flex items-center text-sm font-medium text-neutral-900 hover:text-neutral-700 underline underline-offset-4"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Orders
                    </Link>
                </div>
            </AccountLayout>
        );
    }

    return (
        <AccountLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                            <Link href="/account" className="hover:text-neutral-900 flex items-center gap-1">
                                <ArrowLeft size={14} />
                                Orders
                            </Link>
                            <span>/</span>
                            <span>#{order.order_number}</span>
                        </div>
                        <h1 className="text-2xl font-serif">Order #{order.order_number}</h1>
                        <p className="text-neutral-500 text-sm flex items-center gap-2">
                            <Calendar size={14} />
                            Placed on {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Action buttons could go here, e.g. Invoice, Help */}
                        {order.status === 'delivered' && (
                            <button className="text-sm bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">
                                Write a Review
                            </button>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white border border-neutral-100 rounded-xl p-6 md:p-8">
                    <Timeline status={order.status} history={order.status_history || []} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Items */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-neutral-100">
                                <h3 className="font-medium flex items-center gap-2">
                                    <Package size={18} className="text-neutral-400" />
                                    Items ({order.items.length})
                                </h3>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-6 flex gap-4 sm:gap-6">
                                        <div className="relative w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.product_name_snapshot}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-neutral-900 line-clamp-2">{item.product_name_snapshot}</h4>
                                                    <p className="text-sm text-neutral-500 mt-1">{item.sku_snapshot}</p>
                                                </div>
                                                <p className="font-medium whitespace-nowrap">{formatCurrency(item.price_snapshot)}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
                                                {item.color && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400">Color:</span>
                                                        <span>{item.color}</span>
                                                    </div>
                                                )}
                                                {item.size && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400">Size:</span>
                                                        <span>{item.size}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-400">Qty:</span>
                                                    <span>{item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar - Summary & Address */}
                    <div className="space-y-8">
                        {/* Price Breakdown */}
                        <section className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-neutral-100">
                                <h3 className="font-medium flex items-center gap-2">
                                    <DollarSign size={18} className="text-neutral-400" />
                                    Order Summary
                                </h3>
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div className="flex justify-between text-neutral-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discount !== undefined && order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-neutral-600">
                                    <span>Shipping</span>
                                    <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600">
                                    <span>Tax</span>
                                    <span>{formatCurrency(order.tax)}</span>
                                </div>
                                <div className="border-t border-neutral-100 pt-3 mt-3 flex justify-between font-semibold text-base text-neutral-900">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>

                            <div className="bg-neutral-50 p-4 border-t border-neutral-100 mx-6 mb-6 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-neutral-500" />
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900">Payment Method</p>
                                        <p className="text-xs text-neutral-500 capitalize">
                                            {order.payment?.method?.replace(/_/g, ' ') || 'Online Payment'}
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
                        ${order.payment?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                                            {order.payment?.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Customer Details */}
                        <section className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-neutral-100">
                                <h3 className="font-medium flex items-center gap-2">
                                    <User size={18} className="text-neutral-400" />
                                    Customer Details
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Shipping Address */}
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MapPin size={14} /> Shipping Address
                                    </h4>
                                    {order.shipping_address ? (
                                        <div className="text-sm text-neutral-600 space-y-1">
                                            <p className="font-medium text-neutral-900">{order.shipping_address.name}</p>
                                            <p>{order.shipping_address.street}</p>
                                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                                            <p>{order.shipping_address.country}</p>
                                            <p className="mt-2 text-neutral-500">{order.shipping_address.phone}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-400 italic">No shipping address available</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AccountLayout>
    );
}
