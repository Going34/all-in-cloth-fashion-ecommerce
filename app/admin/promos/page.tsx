'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Coupon } from '@/types';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminPromosPage() {
    const [promos, setPromos] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const res = await fetch('/api/admin/promos');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPromos(data);
            }
        } catch (error) {
            console.error('Failed to fetch promos', error);
        } finally {
            setLoading(false);
        }
    };

    const deletePromo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo?')) return;

        try {
            await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
            fetchPromos();
        } catch (error) {
            console.error('Failed to delete promo', error);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <AdminLayout>
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Promo Codes</h1>
                <Link
                    href="/admin/promos/new"
                    className="bg-black text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-neutral-800"
                >
                    <Plus size={16} />
                    <span>Create New</span>
                </Link>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-neutral-50 border-b">
                        <tr>
                            <th className="p-4 font-medium">Code</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Value</th>
                            <th className="p-4 font-medium">Usage</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promos.map((promo) => (
                            <tr key={promo.id} className="border-b last:border-0 hover:bg-neutral-50">
                                <td className="p-4 font-mono font-medium">{promo.code}</td>
                                <td className="p-4 capitalize">{promo.type}</td>
                                <td className="p-4">
                                    {promo.type === 'percent' ? `${promo.value}%` : formatCurrency(promo.value)}
                                </td>
                                <td className="p-4">
                                    {promo.used_count} / {promo.usage_limit || '∞'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {promo.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <Link href={`/admin/promos/${promo.id}`} className="inline-block p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => deletePromo(promo.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {promos.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-neutral-500">
                                    No promo codes found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </AdminLayout>
    );
}
