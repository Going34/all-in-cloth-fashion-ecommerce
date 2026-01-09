'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X, Sparkles, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Collections', path: '/collections' },
    { name: 'Sustainability', path: '/about' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-neutral-600 p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl sm:text-3xl font-serif tracking-tighter hover:text-neutral-700 transition-colors">
              ALL IN CLOTH
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-neutral-900 ${
                  isActive(link.path) ? 'text-neutral-900' : 'text-neutral-500'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-2 sm:space-x-5">
            {/* <button className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors">
              <Search size={20} />
            </button> */}
            
            {isAuthenticated ? (
              <Link href="/account" className="flex items-center space-x-2 p-2 text-neutral-500 hover:text-neutral-900 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors overflow-hidden">
                  <User size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest hidden lg:inline">{user?.name?.split(' ')[0] || 'User'}</span>
              </Link>
            ) : (
              <Link href="/login" className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors">
                <LogIn size={20} />
              </Link>
            )}

            <button 
              onClick={onOpenCart}
              className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors relative"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-neutral-900 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-100 py-4 animate-in slide-in-from-top duration-300">
          <div className="px-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium text-neutral-900"
              >
                {link.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium text-neutral-900"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

