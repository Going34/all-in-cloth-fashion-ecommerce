'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { InventoryProvider } from '../context/InventoryContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <InventoryProvider>
              {children}
            </InventoryProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}
