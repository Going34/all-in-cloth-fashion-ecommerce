'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { productsActions } from '@/store/slices/products/productsSlice';
import { selectSelectedProduct, selectProductsLoading, selectProductsError } from '@/store/slices/products/productsSelectors';
import { wishlistActions } from '@/store/slices/wishlist/wishlistSlice';
import { selectWishlistItems, selectWishlistLoading, selectWishlistError } from '@/store/slices/wishlist/wishlistSelectors';
import { useCart } from '../../../context/CartContext';
import { Product, ProductVariant } from '../../../types';
import SizeGuide from '../../../components/SizeGuide';
import { formatCurrency } from '../../../utils/currency';
import { ToastContainer, Toast, ToastType } from '../../../components/ui/Toast';

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectSelectedProduct) as Product | null;
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  const { addToCart } = useCart();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const wishlistLoading = useAppSelector(selectWishlistLoading);
  const wishlistError = useAppSelector(selectWishlistError);

  // All state hooks must be called before any conditional returns
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(productsActions.fetchUserProductByIdRequest(id));
    }
    // Fetch wishlist when component mounts
    dispatch(wishlistActions.fetchWishlistRequest());
  }, [dispatch, id]);

  // Compute derived values using useMemo - must be before conditional returns
  const variants = useMemo(() => product?.variants || [], [product]);
  const availableVariants = useMemo(() => variants.filter(v => v.is_active), [variants]);
  
  const selectedVariant = useMemo(() => {
    if (availableVariants.length === 0) return null;
    return availableVariants[0];
  }, [availableVariants]);

  // Update selectedVariantId when selectedVariant changes
  useEffect(() => {
    if (selectedVariant?.id && !selectedVariantId) {
      setSelectedVariantId(selectedVariant.id);
    }
  }, [selectedVariant, selectedVariantId]);

  const currentVariant = useMemo(() => {
    return availableVariants.find(v => v.id === selectedVariantId) || selectedVariant;
  }, [availableVariants, selectedVariantId, selectedVariant]);

  const displayImages = useMemo(() => {
    if (!product) return [];
    if (currentVariant?.images && currentVariant.images.length > 0) {
      return currentVariant.images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)).map(img => img.image_url);
    }
    return product.images || (product.image ? [product.image] : []);
  }, [currentVariant, product]);

  const variantPrice = useMemo(() => {
    if (!product) return 0;
    return currentVariant 
      ? (currentVariant.price_override ?? product.base_price)
      : product.base_price;
  }, [currentVariant, product]);

  const uniqueColors = useMemo(() => {
    const colors = new Set(availableVariants.map(v => v.color));
    return Array.from(colors);
  }, [availableVariants]);

  const uniqueSizes = useMemo(() => {
    const sizes = new Set(availableVariants.map(v => v.size));
    return Array.from(sizes);
  }, [availableVariants]);

  const getVariantForColorSize = (color: string, size: string) => {
    return availableVariants.find(v => v.color === color && v.size === size);
  };

  const isVariantAvailable = (color: string, size: string) => {
    const variant = getVariantForColorSize(color, size);
    if (!variant) return false;
    const availableStock = variant.inventory ? variant.inventory.stock - (variant.inventory.reserved_stock ?? 0) : 0;
    return availableStock > 0;
  };

  const isFavorited = useMemo(() => {
    return product ? wishlistItems.some(p => p.id === product.id) : false;
  }, [product, wishlistItems]);

  // Toast management
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Event handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) handleNextImage();
    if (touchStart - touchEnd < -50) handlePrevImage();
    setTouchStart(null);
  };

  const handleAddToCart = () => {
    if (!currentVariant || !product) {
      showToast('Please select a variant', 'error');
      return;
    }
    setIsAdding(true);
    addToCart(currentVariant, product, quantity);
    showToast('Added to cart!', 'success');
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleWishlistToggle = async () => {
    if (!product || wishlistLoading) return;

    const wasInWishlist = isFavorited;
    
    try {
      if (wasInWishlist) {
        // Remove from wishlist
        dispatch(wishlistActions.removeFromWishlistRequest(product.id));
        showToast('Removed from wishlist', 'success');
      } else {
        // Add to wishlist
        dispatch(wishlistActions.addToWishlistRequest(product.id));
        showToast('Added to wishlist', 'success');
      }
    } catch (error) {
      showToast('Failed to update wishlist. Please try again.', 'error');
    }
  };

  // Show error toast if wishlist operation fails
  useEffect(() => {
    if (wishlistError) {
      showToast(wishlistError, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistError]);

  const handleShare = async () => {
    if (!product) {
      showToast('Product information not available', 'error');
      return;
    }

    const shareData = {
      title: product.name,
      text: product.description || `Check out ${product.name} on All in Cloth`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    // Try Web Share API first (works on mobile and some desktop browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        // Success is handled by the browser's native share dialog
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          // Fallback to clipboard if share fails
          try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              await navigator.clipboard.writeText(shareData.url);
              showToast('Link copied to clipboard!', 'success');
            } else {
              showToast('Sharing not available. Please copy the URL manually.', 'info');
            }
          } catch (clipboardError) {
            showToast('Failed to share. Please try again.', 'error');
          }
        }
      }
    } else {
      // Fallback to clipboard if Web Share API is not available
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          showToast('Link copied to clipboard!', 'success');
        } else {
          // Last resort: show URL in a prompt
          const url = shareData.url;
          if (typeof window !== 'undefined' && window.prompt) {
            window.prompt('Copy this link:', url);
            showToast('Please copy the URL from the prompt', 'info');
          } else {
            showToast('Sharing not supported in this browser', 'error');
          }
        }
      } catch (error) {
        showToast('Failed to copy link. Please try again.', 'error');
      }
    }
  };

  // Now we can do conditional returns after all hooks
  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif">Loading product...</h2>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif">Failed to load product</h2>
        <p className="text-neutral-500 mt-2">{error}</p>
        <button onClick={() => router.push('/shop')} className="mt-4 text-neutral-900 underline">Back to Shop</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif">Product not found</h2>
        <button onClick={() => router.push('/shop')} className="mt-4 text-neutral-900 underline">Back to Shop</button>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif">Product variants not available</h2>
        <p className="text-neutral-500 mt-2">This product has no available variants.</p>
        <button onClick={() => router.push('/shop')} className="mt-4 text-neutral-900 underline">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <div 
            className="relative aspect-[3/4] bg-neutral-100 overflow-hidden group rounded-lg"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-full h-full flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
              {displayImages.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`${product.name} view ${idx + 1}`} 
                  className="w-full h-full object-cover flex-shrink-0" 
                />
              ))}
            </div>

            <button 
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-white"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-white"
            >
              <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
              {displayImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImageIndex === idx ? 'bg-neutral-900 w-6' : 'bg-neutral-900/20 hover:bg-neutral-900/40'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {displayImages.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`aspect-square bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 transition-all border-2 ${
                  currentImageIndex === idx ? 'border-neutral-900 ring-2 ring-neutral-900/10' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start gap-3 sm:gap-0">
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {product.categories && product.categories.length > 0 ? product.categories.map(c => c.name).join(', ') : 'Uncategorized'}
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-serif tracking-tight pr-2">{product.name}</h1>
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                <button 
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading || !product}
                  className={`p-2.5 sm:p-3 border rounded-full transition-all touch-manipulation ${
                    isFavorited ? 'border-red-100 bg-red-50 text-red-500' : 'border-neutral-100 hover:bg-neutral-50 text-neutral-400'
                  } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={18} className="sm:w-5 sm:h-5" fill={isFavorited ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={handleShare}
                  disabled={!product}
                  className="p-2.5 sm:p-3 border border-neutral-100 rounded-full hover:bg-neutral-50 text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
                  aria-label="Share product"
                  title="Share product"
                >
                  <Share2 size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <p className="text-2xl sm:text-3xl font-semibold text-neutral-900">{formatCurrency(variantPrice)}</p>
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-full text-xs sm:text-sm text-neutral-600 w-fit">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="sm:w-[14px] sm:h-[14px]" fill={i < Math.floor(product.rating ?? 0) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="font-medium">{product.rating ?? 0}</span>
                <span className="text-neutral-300">|</span>
                <span className="text-[10px] sm:text-xs">{product.reviews ?? 0} reviews</span>
              </div>
            </div>

            <p className="text-neutral-600 leading-relaxed text-base sm:text-lg max-w-lg">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
            {uniqueColors.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-400">Color</p>
                  {currentVariant && (
                    <span className="text-xs sm:text-sm font-medium text-neutral-900">{currentVariant.color}</span>
                  )}
                </div>
                <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                  {uniqueColors.map((color) => {
                    const hasAvailableSize = uniqueSizes.some(size => isVariantAvailable(color, size));
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          const firstAvailableSize = uniqueSizes.find(size => isVariantAvailable(color, size));
                          if (firstAvailableSize) {
                            const variant = getVariantForColorSize(color, firstAvailableSize);
                            if (variant) setSelectedVariantId(variant.id);
                          }
                        }}
                        disabled={!hasAvailableSize}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all p-1 flex items-center justify-center flex-shrink-0 touch-manipulation ${
                          currentVariant?.color === color 
                            ? 'border-neutral-900 ring-2 sm:ring-4 ring-neutral-900/5' 
                            : 'border-transparent hover:border-neutral-200'
                        } ${!hasAvailableSize ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <div className="w-full h-full rounded-full shadow-inner bg-neutral-800" style={{ backgroundColor: color.toLowerCase() }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {uniqueSizes.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-400">Select Size</p>
                  <button 
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-[9px] sm:text-[10px] text-neutral-900 font-bold uppercase tracking-widest flex items-center space-x-1 hover:text-neutral-500 transition-colors border-b border-neutral-200 pb-0.5 whitespace-nowrap touch-manipulation"
                  >
                    <span>{showSizeGuide ? 'Hide' : 'View'} Size Guide</span>
                    {showSizeGuide ? <ChevronUp size={11} className="sm:w-3 sm:h-3" /> : <ChevronDown size={11} className="sm:w-3 sm:h-3" />}
                  </button>
                </div>
                
                {showSizeGuide && (
                  <div className="mb-3 sm:mb-4">
                    <SizeGuide />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {uniqueSizes.map((size) => {
                    const selectedColorForSize = currentVariant?.color || uniqueColors[0];
                    const variant = getVariantForColorSize(selectedColorForSize, size);
                    const isAvailable = variant ? isVariantAvailable(selectedColorForSize, size) : false;
                    const isSelected = currentVariant?.size === size && currentVariant?.color === selectedColorForSize;
                    
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (variant && isAvailable) {
                            setSelectedVariantId(variant.id);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`min-w-[3.5rem] sm:min-w-[4rem] px-4 sm:px-6 py-2.5 sm:py-3 border text-xs sm:text-sm font-bold transition-all rounded-lg touch-manipulation ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg shadow-neutral-200' 
                            : isAvailable
                            ? 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-900'
                            : 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2 sm:pt-4">
              <div className="flex items-center border border-neutral-200 rounded-xl h-14 sm:h-16 bg-neutral-50/50 w-full sm:w-auto justify-between sm:justify-start">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 sm:px-5 hover:bg-neutral-100 active:bg-neutral-200 transition-colors h-full touch-manipulation"
                >
                  <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <span className="w-12 text-center font-bold text-base sm:text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 sm:px-5 hover:bg-neutral-100 active:bg-neutral-200 transition-colors h-full touch-manipulation"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={isAdding || !currentVariant}
                className={`w-full sm:flex-1 h-14 sm:h-16 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-center space-x-2 sm:space-x-3 touch-manipulation ${
                  isAdding 
                    ? 'bg-green-600 text-white translate-y-[-2px]' 
                    : currentVariant
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl shadow-neutral-200 hover:translate-y-[-2px] active:translate-y-0'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isAdding ? (
                  <span>Item Added to Bag</span>
                ) : (
                  <>
                    <span>Add to Bag</span>
                    <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:inline" />
                    <span>{formatCurrency(variantPrice * quantity)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 py-6 sm:py-10 border-t border-neutral-100 mt-6 sm:mt-10">
            <div className="flex items-center space-x-3 text-neutral-600">
              <div className="p-2 bg-neutral-50 rounded-lg flex-shrink-0"><Truck size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Free Delivery</p>
                <p className="text-[8px] sm:text-[9px] text-neutral-400">On orders over {formatCurrency(150)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-neutral-600">
              <div className="p-2 bg-neutral-50 rounded-lg flex-shrink-0"><RotateCcw size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Easy Exchange</p>
                <p className="text-[8px] sm:text-[9px] text-neutral-400">30-day window</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-neutral-600">
              <div className="p-2 bg-neutral-50 rounded-lg flex-shrink-0"><ShieldCheck size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Secure Checkout</p>
                <p className="text-[8px] sm:text-[9px] text-neutral-400">SSL Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
