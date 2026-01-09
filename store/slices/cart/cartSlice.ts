import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, ProductVariant, Product } from '@/types';

export interface CartState {
  items: CartItem[];
}

const getInitialCart = (): CartItem[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('all-in-cloth-cart');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

const initialState: CartState = {
  items: getInitialCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ variant: ProductVariant; product: Product; quantity: number }>) => {
      const { variant, product, quantity } = action.payload;
      const existing = state.items.find((i) => i.variant_id === variant.id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        const price = variant.price_override ?? product.base_price;
        const variantImage =
          variant.images && variant.images.length > 0
            ? variant.images[0].image_url
            : product.images && product.images.length > 0
            ? product.images[0]
            : product.image ?? '';

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

        state.items.push(cartItem);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('all-in-cloth-cart', JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.variant_id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('all-in-cloth-cart', JSON.stringify(state.items));
      }
    },
    updateQuantity: (state, action: PayloadAction<{ variant_id: string; quantity: number }>) => {
      if (action.payload.quantity < 1) return;
      const item = state.items.find((i) => i.variant_id === action.payload.variant_id);
      if (item) {
        item.quantity = action.payload.quantity;
        if (typeof window !== 'undefined') {
          localStorage.setItem('all-in-cloth-cart', JSON.stringify(state.items));
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      if (typeof window !== 'undefined') {
        localStorage.setItem('all-in-cloth-cart', JSON.stringify(state.items));
      }
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;

