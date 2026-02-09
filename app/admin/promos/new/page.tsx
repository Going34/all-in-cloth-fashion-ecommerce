'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default function NewPromoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        type: 'percent', // percent | flat
        value: 0,
        min_order_amount: 0,
        max_discount: '', // Optional
        usage_limit: '',  // Optional
        valid_from: '',
        valid_till: '',
        is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                // Convert optional strings to null/number
                max_discount: formData.max_discount ? Number(formData.max_discount) : null,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                valid_from: formData.valid_from || null,
                valid_till: formData.valid_till || null,
            };

            const res = await fetch('/api/admin/promos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create promo');
            }

            router.push('/admin/promos');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
        <div className="p-8 max-w-2xl mx-auto">
            <Link href="/admin/promos" className="flex items-center text-neutral-500 hover:text-black mb-6">
                <ArrowLeft size={16} className="mr-2" />
                Back to Promo Codes
            </Link>

            <h1 className="text-2xl font-bold mb-6">Create New Promo Code</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 border rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Promo Code</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2 uppercase"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. SAVE20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat Amount ($)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Value</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="w-full border rounded p-2"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Min Order Amount ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full border rounded p-2"
                            value={formData.min_order_amount}
                            onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Max Discount ($) <span className="text-neutral-400 font-normal">(Optional)</span></label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full border rounded p-2"
                            value={formData.max_discount}
                            onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                            placeholder="No limit"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Usage Limit <span className="text-neutral-400 font-normal">(Optional)</span></label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border rounded p-2"
                            value={formData.usage_limit}
                            onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                            placeholder="Unlimited"
                        />
                    </div>

                    <div className="col-span-2 flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Valid From</label>
                            <input
                                type="datetime-local"
                                className="w-full border rounded p-2"
                                value={formData.valid_from}
                                onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Valid Till</label>
                            <input
                                type="datetime-local"
                                className="w-full border rounded p-2"
                                value={formData.valid_till}
                                onChange={e => setFormData({ ...formData, valid_till: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-2 flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="mr-2"
                            checked={formData.is_active}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Promo Code'}
                    </button>
                </div>
            </form>
        </div>
        </AdminLayout>
    );
}
