'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import AIStylist from '../components/AIStylist';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-neutral-900 selection:text-white">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-neutral-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-16">
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-serif tracking-tighter">ALL IN CLOTH</Link>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Redefining modern luxury through architectural silhouettes and ethical craftsmanship.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Collections</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="/shop?filter=new" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?category=Womenswear" className="hover:text-white transition-colors">Womenswear</Link></li>
              <li><Link href="/shop?category=Menswear" className="hover:text-white transition-colors">Menswear</Link></li>
              <li><Link href="/shop?category=Accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us (Bulk)</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">Order Tracking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Connect</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pinterest</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
          <p>© 2024 All in cloth. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      {/* <AIStylist /> */}
    </div>
  );
}

