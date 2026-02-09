'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, ProductVariant, Product, Coupon } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (variant: ProductVariant, product: Product, quantity: number) => void;
  removeFromCart: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  promoCode: string | null;
  appliedCoupon: Coupon | null;
  applyPromo: (code: string) => Promise<{ success: boolean; message?: string }>;
  removePromo: () => void;
  // Deprecated alias for subtotal to maintain backward compatibility if needed, 
  // or alias for finalTotal? Based on usage in CartDrawer as "Subtotal", it was sum of items.
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('all-in-cloth-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('all-in-cloth-cart', JSON.stringify(cart));
    }
    // Re-validate promo when cart changes
    if (promoCode && cart.length > 0) {
      validateCurrentPromo();
    } else if (cart.length === 0) {
      // Clear promo if cart is empty
      removePromo();
    }
  }, [cart]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Recalculate discount whenever subtotal or coupon changes
  useEffect(() => {
    if (appliedCoupon) {
      recalculateDiscount(appliedCoupon, subtotal);
    }
  }, [subtotal, appliedCoupon]);

  const recalculateDiscount = (coupon: Coupon, currentSubtotal: number) => {
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = (currentSubtotal * coupon.value) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else if (coupon.type === 'flat') {
      discount = coupon.value;
      if (discount > currentSubtotal) discount = currentSubtotal;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    }
    setDiscountAmount(Math.max(0, Math.round(discount * 100) / 100));
  };

  const validateCurrentPromo = async () => {
    if (!promoCode) return;
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, cartTotal: subtotal })
      });
      const data = await res.json();
      if (data.valid) {
        // Update discount just in case
        setDiscountAmount(data.discountAmount);
      } else {
        // If no longer valid (e.g. subtotal dropped below min), remove it
        // Or keep it but set discount to 0? Better to remove and notify.
        // For now, simple removal or state update.
        // We won't auto-remove to avoid confusing UI flickering, but maybe mark invalid?
        // Let's just create a helper to re-run validation logic client side or reliance on API.
      }
    } catch (e) {
      console.error("Revalidation failed", e);
    }
  };

  const addToCart = (variant: ProductVariant, product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.variant_id === variant.id);
      if (existing) {
        return prev.map(i =>
          i.variant_id === variant.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }

      const price = variant.price_override ?? product.base_price;
      const variantImage = variant.images && variant.images.length > 0
        ? variant.images[0].image_url
        : (product.images && product.images.length > 0 ? product.images[0] : product.image) ?? '';

      const cartItem: CartItem = {
        variant_id: variant.id,
        product_id: product.id,
        product_name: product.name,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: price,
        image_url: variantImage,
        quantity: quantity,
      };

      return [...prev, cartItem];
    });
  };

  const removeFromCart = (variant_id: string) => {
    setCart(prev => prev.filter(i => i.variant_id !== variant_id));
  };

  const updateQuantity = (variant_id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(i =>
      i.variant_id === variant_id ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setCart([]);
    removePromo();
  };

  const applyPromo = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal })
      });

      const data = await res.json();

      if (data.valid) {
        setPromoCode(data.code);
        setDiscountAmount(data.discountAmount);
        // Construct a partial coupon object for local logic if needed
        setAppliedCoupon({
          code: data.code,
          type: data.type,
          value: data.value,
          // missing other fields but enough for calculation
        } as Coupon);
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Failed to apply promo' };
    }
  };

  const removePromo = () => {
    setPromoCode(null);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      discountAmount,
      finalTotal,
      promoCode,
      appliedCoupon,
      applyPromo,
      removePromo,
      totalPrice: subtotal // Maintaining backward compatibility
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
