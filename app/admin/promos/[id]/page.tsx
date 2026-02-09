'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default function EditPromoPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        type: 'percent',
        value: 0,
        min_order_amount: 0,
        max_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_till: '',
        is_active: true
    });

    useEffect(() => {
        if (id) fetchPromo();
    }, [id]);

    const fetchPromo = async () => {
        try {
            const res = await fetch(`/api/admin/promos/${id}`);
            if (!res.ok) throw new Error('Failed to fetch promo');
            const data = await res.json();

            // Format dates for input type="datetime-local"
            const formatDate = (dateString: string | null) => {
                if (!dateString) return '';
                return new Date(dateString).toISOString().slice(0, 16);
            };

            setFormData({
                code: data.code,
                type: data.type,
                value: data.value,
                min_order_amount: data.min_order_amount || 0,
                max_discount: data.max_discount ?? '',
                usage_limit: data.usage_limit ?? '',
                valid_from: formatDate(data.valid_from),
                valid_till: formatDate(data.valid_till),
                is_active: data.is_active
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                ...formData,
                max_discount: formData.max_discount ? Number(formData.max_discount) : null,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                valid_from: formData.valid_from || null,
                valid_till: formData.valid_till || null,
            };

            const res = await fetch(`/api/admin/promos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update promo');
            }

            router.push('/admin/promos');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <AdminLayout>
        <div className="p-8 max-w-2xl mx-auto">
            <Link href="/admin/promos" className="flex items-center text-neutral-500 hover:text-black mb-6">
                <ArrowLeft size={16} className="mr-2" />
                Back to Promo Codes
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Promo Code</h1>
                <span className="text-sm text-neutral-500 pl-2">ID: {id}</span>
            </div>

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
                            className="w-full border rounded p-2 uppercase bg-neutral-100"
                            value={formData.code}
                            readOnly // Usually code shouldn't be changed after creation easily, or allow it but check duplicate
                            disabled
                        />
                        <p className="text-xs text-neutral-500 mt-1">Code cannot be changed once created.</p>
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
                        <label className="block text-sm font-medium mb-1">Max Discount ($)</label>
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
                        <label className="block text-sm font-medium mb-1">Usage Limit</label>
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
                        disabled={saving}
                        className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center"
                    >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
        </AdminLayout>
    );
}
