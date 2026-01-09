'use client';

import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { formatCurrency } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h2 className="text-xl font-medium">Shopping Cart</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <ShoppingBag size={48} className="text-neutral-200" />
                <div>
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-neutral-500">Discover something you love.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variant_id} className="flex space-x-4">
                  <div className="w-24 h-32 bg-neutral-100 overflow-hidden flex-shrink-0">
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium">{item.product_name}</h3>
                        <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {item.color} / {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-neutral-200">
                        <button 
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="p-1 hover:bg-neutral-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.variant_id)}
                        className="text-xs text-neutral-400 hover:text-red-500 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-neutral-100 space-y-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-neutral-500">Shipping and taxes calculated at checkout.</p>
              <Link 
                href="/checkout" 
                onClick={onClose}
                className="block w-full py-4 bg-neutral-900 text-white text-center font-medium hover:bg-neutral-800 transition-colors"
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
