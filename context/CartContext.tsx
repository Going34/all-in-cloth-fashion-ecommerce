'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, ProductVariant, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (variant: ProductVariant, product: Product, quantity: number) => void;
  removeFromCart: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('all-in-cloth-cart', JSON.stringify(cart));
    }
  }, [cart]);

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

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
