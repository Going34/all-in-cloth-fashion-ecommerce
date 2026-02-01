'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, Search, ChevronDown, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { productsActions } from '../../store/slices/products/productsSlice';
import { categoriesActions } from '../../store/slices/categories/categoriesSlice';
import { selectProducts, selectProductsLoading, selectProductsError, selectProductsLoaded, selectProductsCache } from '../../store/slices/products/productsSelectors';
import { selectCategories } from '../../store/slices/categories/categoriesSelectors';
import { Category, Product } from '../../types';
import { formatCurrency, formatPriceRange } from '../../utils/currency';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const productsLoading = useAppSelector(selectProductsLoading);
  const productsError = useAppSelector(selectProductsError);
  const productsLoaded = useAppSelector(selectProductsLoaded);
  const productsCache = useAppSelector(selectProductsCache);
  const categories = useAppSelector(selectCategories);
  
  const categoryParam = searchParams.get('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryParam || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    dispatch(categoriesActions.fetchCategoriesDataRequest());
  }, [dispatch]);

  // Update selected category from URL params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== selectedCategoryId) {
      setSelectedCategoryId(cat || null);
    }
  }, [searchParams, selectedCategoryId]);

  // Handle product fetching
  useEffect(() => {
    const cat = searchParams.get('category');
    
    // Only fetch if products haven't been loaded yet
    if (!productsLoaded || Object.keys(productsCache).length === 0) {
      const filters: { status: 'live'; categoryId?: string } = { status: 'live' };
      if (cat) {
        filters.categoryId = cat;
      }
      dispatch(productsActions.fetchUserProductsRequest(filters));
    } else {
      // Products already loaded, just filter from Redux state
      const filters: { status: 'live'; categoryId?: string } = { status: 'live' };
      if (cat) {
        filters.categoryId = cat;
      }
      // Dispatch with filters to trigger filtering in saga (which will use cache)
      dispatch(productsActions.fetchUserProductsRequest(filters));
    }
  }, [dispatch, searchParams, productsLoaded, productsCache, selectedCategoryId]);

  const getProductPrice = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .filter(v => v.is_active)
        .map(v => v.price_override ?? product.base_price);
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }
    return product.base_price;
  };

  const getProductPriceRange = (product: Product): { min: number; max: number } | null => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .filter(v => v.is_active)
        .map(v => v.price_override ?? product.base_price);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min !== max ? { min, max } : null;
      }
    }
    return null;
  };

  const matchesCategory = (product: Product, categoryId: string | null): boolean => {
    if (!categoryId) return true;
    if (!product.categories || product.categories.length === 0) return false;
    return product.categories.some(cat => cat.id === categoryId);
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const product = p as Product;
      const isNewArrival = searchParams.get('filter') === 'new' ? product.featured : true;
      const matchesCat = matchesCategory(product, selectedCategoryId);
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch && isNewArrival;
    });
    
    return filtered.sort((a, b) => {
      const productA = a as Product;
      const productB = b as Product;
      const priceA = getProductPrice(productA);
      const priceB = getProductPrice(productB);
      
      if (sortBy === 'Price: Low-High') return priceA - priceB;
      if (sortBy === 'Price: High-Low') return priceB - priceA;
      if (sortBy === 'Top Rated') return (productB.rating ?? 0) - (productA.rating ?? 0);
      return 0;
    });
  }, [products, selectedCategoryId, searchQuery, sortBy, searchParams]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    const params = new URLSearchParams(searchParams.toString());
    if (!categoryId) {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    
    // Products are already loaded, just filter from Redux state
    const filters: { status: 'live'; categoryId?: string } = { status: 'live' };
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    // Dispatch to trigger filtering in saga (which will use cache)
    dispatch(productsActions.fetchUserProductsRequest(filters));
    
    router.push(`/shop?${params.toString()}`);
  };

  const allCategories: Category[] = useMemo(() => {
    return Array.isArray(categories) ? categories : [];
  }, [categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-2 mb-12">
        <h1 className="text-4xl font-serif">
          {searchParams.get('filter') === 'new' 
            ? 'New Arrivals' 
            : !selectedCategoryId 
            ? 'Full Collection' 
            : allCategories.find(c => c.id === selectedCategoryId)?.name || 'Full Collection'}
        </h1>
        <p className="text-neutral-500">Browsing {filteredProducts.length} results</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-neutral-100">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategoryId
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search catalog..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-neutral-50 border-none rounded-md text-sm focus:ring-1 focus:ring-neutral-200 outline-none w-full md:w-64"
            />
          </div>
          <div className="relative group">
            <button className="flex items-center space-x-2 text-sm font-medium border border-neutral-200 px-4 py-2 rounded-md hover:border-neutral-900 transition-colors">
              <span>Sort: {sortBy}</span>
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-100 shadow-xl rounded-md opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-10 overflow-hidden">
              {['Newest', 'Top Rated', 'Price: Low-High', 'Price: High-Low'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {productsLoading && (
        <div className="py-24 text-center">
          <h3 className="text-xl font-medium">Loading products...</h3>
        </div>
      )}
      {productsError && (
        <div className="py-24 text-center">
          <h3 className="text-xl font-medium text-red-500">Error loading products</h3>
          <p className="text-neutral-500 mt-2">{productsError}</p>
        </div>
      )}
      {!productsLoading && !productsError && filteredProducts.length === 0 ? (
        <div className="py-24 text-center">
          <h3 className="text-xl font-medium">No products found</h3>
          <p className="text-neutral-500 mt-2">Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => {handleCategoryChange(null); setSearchQuery(''); router.push('/shop');}}
            className="mt-6 text-neutral-900 underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredProducts.map((product) => {
            const p = product as Product;
            const priceRange = getProductPriceRange(p);
            const displayPrice = priceRange 
              ? formatPriceRange(priceRange.min, priceRange.max)
              : formatCurrency(getProductPrice(p));
            const categoryName = p.categories && p.categories.length > 0 
              ? p.categories.map(c => c.name).join(', ')
              : 'Uncategorized';
            
            return (
              <Link key={p.id} href={`/product/${p.id}`} className="group space-y-4">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                      {categoryName}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                  <h3 className="text-lg font-medium text-neutral-900 group-hover:underline">{p.name}</h3>
                  {(p.rating || p.reviews) && (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < Math.floor(p.rating ?? 0) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-400">({p.reviews ?? 0})</span>
                    </div>
                  )}
                </div>
                <p className="text-lg font-semibold">{displayPrice}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-2 mb-12">
          <h1 className="text-4xl font-serif">Full Collection</h1>
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
