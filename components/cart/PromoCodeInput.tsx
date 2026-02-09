'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Loader2, X, Tag } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export const PromoCodeInput: React.FC = () => {
    const { applyPromo, removePromo, promoCode, discountAmount, appliedCoupon } = useCart();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleApply = async () => {
        if (!code.trim()) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const result = await applyPromo(code.trim());

        setIsLoading(false);

        if (result.success) {
            setSuccess('Promo code applied!');
            setCode('');
        } else {
            setError(result.message || 'Invalid promo code');
        }
    };

    const handleRemove = () => {
        removePromo();
        setError(null);
        setSuccess(null);
        setCode('');
    };

    if (promoCode) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Tag size={16} className="text-green-600" />
                    <div>
                        <p className="text-sm font-medium text-green-800">
                            Code: <span className="font-bold">{promoCode}</span>
                        </p>
                        <p className="text-xs text-green-600">
                            Discount: -{formatCurrency(discountAmount)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRemove}
                    className="text-gray-400 hover:text-red-500 p-1"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                />
                <button
                    onClick={handleApply}
                    disabled={isLoading || !code.trim()}
                    className="bg-neutral-900 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors min-w-[80px] flex items-center justify-center"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-green-500">{success}</p>}
        </div>
    );
};
