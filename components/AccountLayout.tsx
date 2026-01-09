'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Package, Heart, MapPin, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const menuItems = [
    { label: 'Orders', icon: Package, path: '/account' },
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Addresses', icon: MapPin, path: '/addresses' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-neutral-500 mt-2 text-sm sm:text-base">Manage your orders and account preferences.</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 shrink-0 border border-red-200 flex items-center gap-2"
          aria-label="Sign out"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline font-medium">Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1">
          <div className="hidden lg:block space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-neutral-900 text-white shadow-md' 
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-3 mb-8">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border-2 ${
                    isActive 
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg' 
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                  }`}
                >
                  <item.icon size={22} className="mb-1.5" />
                  <span className="font-medium text-sm text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}

