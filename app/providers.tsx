'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { InventoryProvider } from '../context/InventoryContext';
import { WebhookProvider } from '../context/WebhookContext';
import GlobalToastContainer from '@/components/GlobalToastContainer';

export function Providers({ children }: { children: React.ReactNode }) {
	  return (
	    <Provider store={store}>
	      <AuthProvider>
	        <CartProvider>
	          <WishlistProvider>
	            <InventoryProvider>
	              <WebhookProvider>
	                {children}
	                <GlobalToastContainer />
	              </WebhookProvider>
	            </InventoryProvider>
	          </WishlistProvider>
	        </CartProvider>
	      </AuthProvider>
	    </Provider>
	  );
}
