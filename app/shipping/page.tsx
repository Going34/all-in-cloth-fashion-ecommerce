'use client';

import React from 'react';
import { AlertCircle, RotateCcw, Truck, PackageCheck } from 'lucide-react';

export default function ShippingReturns() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-5xl font-serif">Shipping & Returns</h1>
        <p className="text-neutral-500 max-w-xl mx-auto italic text-lg">
          Excellence in delivery, transparency in our policy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-neutral-900 text-white p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="bg-white/10 p-4 rounded-full">
            <AlertCircle size={32} className="text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-serif">Our Exchange Policy</h2>
            <p className="text-neutral-300 leading-relaxed">
              At All in cloth, we strive for perfection. However, we understand that sizing issues or shipping errors may occur. 
              Please note our strict policy regarding returns:
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-bold uppercase tracking-widest text-white mb-2 underline decoration-white/20 underline-offset-4">Non-Refundable Status</p>
              <p className="text-sm text-white font-medium">
                Products that are large-sized or delivered incorrectly will <span className="underline underline-offset-2">not be refunded</span>. 
                Instead, they will be promptly exchanged for another product of equal or greater value.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 p-8 border border-neutral-100 rounded-2xl bg-neutral-50">
            <div className="flex items-center space-x-3 text-neutral-900 mb-2">
              <Truck size={24} />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Shipping Times</h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Standard shipping takes 3-5 business days within the continental India.
            </p>
          </div>

          <div className="space-y-4 p-8 border border-neutral-100 rounded-2xl bg-neutral-50">
            <div className="flex items-center space-x-3 text-neutral-900 mb-2">
              <PackageCheck size={24} />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Incorrect Items</h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              If you receive an item different from your order, please notify us within 48 hours of delivery. We will facilitate an exchange immediately.
            </p>
          </div>

          <div className="space-y-4 p-8 border border-neutral-100 rounded-2xl bg-neutral-50">
            <div className="flex items-center space-x-3 text-neutral-900 mb-2">
              <RotateCcw size={24} />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Size Exchanges</h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              If an item is too large, we offer exchanges for a smaller size (subject to availability) or another product in our collection.
            </p>
          </div>

          <div className="space-y-4 p-8 border border-neutral-100 rounded-2xl bg-neutral-50">
            <div className="flex items-center space-x-3 text-neutral-900 mb-2">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Damaged Goods</h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Manufacturing defects must be reported within 7 days. These items are eligible for priority exchange with free shipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

