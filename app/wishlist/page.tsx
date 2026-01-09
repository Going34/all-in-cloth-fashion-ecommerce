'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { wishlistActions } from '../../store/slices/wishlist/wishlistSlice';
import { selectWishlistItems, selectWishlistLoading, selectWishlistError } from '../../store/slices/wishlist/wishlistSelectors';
import { useCart } from '../../context/CartContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AccountLayout from '../../components/AccountLayout';
import { formatCurrency } from '../../utils/currency';

function WishlistContent() {
  const dispatch = useAppDispatch();
  const wishlist = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);
  const { addToCart } = useCart();

  useEffect(() => {
    dispatch(wishlistActions.fetchWishlistRequest());
  }, [dispatch]);

  const handleMoveToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product || !product.id) {
      console.error('Invalid product data');
      return;
    }

    const variants = product.variants || [];
    if (variants.length === 0) {
      alert('This product has no available variants. Please visit the product page to see available options.');
      return;
    }

    const activeVariants = variants.filter((v: any) => v.is_active !== false);
    const selectedVariant = activeVariants.length > 0 ? activeVariants[0] : variants[0];
    
    if (selectedVariant && selectedVariant.id) {
      try {
        addToCart(selectedVariant, product, 1);
        dispatch(wishlistActions.removeFromWishlistRequest(product.id));
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
      }
    } else {
      alert('Unable to add this item to cart. Please visit the product page to select a variant.');
    }
  };

  const handleRemoveFromWishlist = (productId: string) => {
    dispatch(wishlistActions.removeFromWishlistRequest(productId));
  };

  return (
    <AccountLayout>
      <div className="mb-12">
        <h1 className="text-4xl font-serif">Your Wishlist</h1>
        <p className="text-neutral-500 mt-2">Saved items for future inspiration ({wishlist.length})</p>
      </div>

      {loading && (
        <div className="py-24 text-center">
          <p className="text-neutral-500">Loading wishlist...</p>
        </div>
      )}

      {error && (
        <div className="py-24 text-center">
          <p className="text-red-500">Error loading wishlist: {error}</p>
        </div>
      )}

      {!loading && !error && wishlist.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-neutral-50 rounded-full">
              <Heart size={48} className="text-neutral-200" />
            </div>
          </div>
          <h2 className="text-2xl font-serif">Your wishlist is empty</h2>
          <p className="text-neutral-500 max-w-sm mx-auto">
            Explore our collections and save pieces that speak to you.
          </p>
          <Link 
            href="/shop" 
            className="inline-flex items-center space-x-2 bg-neutral-900 text-white px-8 py-3 font-medium hover:bg-neutral-800 transition-colors"
          >
            <span>Start Browsing</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : !loading && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map((product) => (
            <div key={product.id} className="group relative flex flex-col border border-neutral-100 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-100">
                <img 
                  src={product.image || product.images?.[0] || '/placeholder.png'} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.png';
                  }}
                />
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveFromWishlist(product.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full text-red-500 hover:bg-white transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </Link>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-neutral-900 truncate">{product.name}</h3>
                  <p className="text-sm font-semibold mt-1">
                    {formatCurrency(product.base_price)}
                  </p>
                </div>
                
                <button 
                  onClick={(e) => handleMoveToCart(e, product)}
                  disabled={!product.variants || product.variants.length === 0}
                  className="mt-auto w-full py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={14} />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AccountLayout>
  );
}

export default function Wishlist() {
  return (
    <ProtectedRoute>
      <WishlistContent />
    </ProtectedRoute>
  );
}

