'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { productsActions } from '../store/slices/products/productsSlice';
import { selectProducts, selectProductsLoading, selectProductsError } from '../store/slices/products/productsSelectors';
import { Product } from '../types';
import { formatCurrency } from '../utils/currency';

export default function Home() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);

  useEffect(() => {
    dispatch(productsActions.fetchUserProductsRequest({ status: 'live', limit: 20 }));
  }, [dispatch]);

  const featured = products
    .filter((p: Product) => p.featured || p.status === 'live')
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    })
    .slice(0, 6);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000" 
          alt="Hero Fashion" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl text-white space-y-6 animate-in fade-in slide-in-from-bottom duration-1000">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif leading-[1] ">Define Your <br/> Aesthetic</h1>
            <p className="text-lg sm:text-xl font-light tracking-wide max-w-xl mx-auto">
              Curated collections that blend modern architecture with timeless elegance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/shop" className="bg-white text-neutral-900 px-10 py-4 font-medium hover:bg-neutral-100 transition-all flex items-center space-x-2">
                <span>Shop New Arrivals</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/collections" className="border border-white/40 text-white backdrop-blur-sm px-10 py-4 font-medium hover:bg-white/10 transition-all">
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">The Spotlight</span>
            <h2 className="text-3xl sm:text-4xl font-serif">Season Essentials</h2>
          </div>
          <Link href="/shop" className="text-neutral-900 font-medium flex items-center space-x-2 border-b-2 border-neutral-900 pb-1 hover:text-neutral-600 hover:border-neutral-600 transition-all">
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-neutral-500">Loading featured products...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading products: {error}</p>
          </div>
        )}
        {!loading && !error && featured.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">No featured products available</p>
          </div>
        )}
        {!loading && !error && featured.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {featured.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="group"
            >
              <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden mb-4">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <button className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur py-3 text-sm font-medium opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                  Quick View
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-neutral-900 group-hover:underline underline-offset-4">{product.name}</h3>
                  <p className="font-semibold">{formatCurrency(product.base_price)}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span>{product.rating}</span>
                  <span className="text-neutral-300">|</span>
                  <span>{product.reviews} Reviews</span>
                </div>
              </div>
            </Link>
            ))}
          </div>
        )}
      </section>

      {/* Categories / Narrative */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-serif leading-[1]">Crafted for the <br/> Modern Individual</h2>
            <p className="text-neutral-600 leading-relaxed text-lg">
              Every piece in our collection is born from a meticulous design process that prioritizes 
              longevity, comfort, and distinct visual language. We believe fashion should be 
              as enduring as it is evocative.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Heritage</h4>
                <p className="text-sm text-neutral-500">Founded on artisanal principles of tailoring and fit.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Conscious</h4>
                <p className="text-sm text-neutral-500">85% of our fabrics are sustainably sourced or recycled.</p>
              </div>
            </div>
            <Link href="/about" className="inline-block px-8 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
              Our Story
            </Link>
          </div>
          <div className="relative aspect-[4/5]">
            <img 
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800" 
              alt="Model with jacket" 
              className="w-full h-full object-cover shadow-2xl"
            />
            <div className="absolute -bottom-8 -left-8 bg-white p-8 hidden lg:block shadow-xl max-w-xs">
              <p className="text-sm italic font-serif">&ldquo;All in cloth redefined my approach to layering. The materials are simply unmatched.&rdquo;</p>
              <p className="text-xs font-bold mt-4 uppercase tracking-tighter">— Elena Vance, Art Director</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      {/* <section className="max-w-5xl mx-auto px-4 text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif">Join the Inner Circle</h2>
          <p className="text-neutral-500">Sign up for exclusive early access to drops and private seasonal sales.</p>
        </div>
        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-1 px-4 py-3 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
          <button className="bg-neutral-900 text-white px-8 py-3 font-medium hover:bg-neutral-800 transition-colors">
            Subscribe
          </button>
        </form>
      </section> */}
    </div>
  );
}
