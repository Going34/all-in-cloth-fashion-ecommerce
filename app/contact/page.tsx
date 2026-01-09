'use client';

import React, { useState } from 'react';
import { Mail, Store, Building2, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    inquiry_type: 'Bulk Order (50+ items)',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit inquiry');
      }

      setSubmitted(true);
      setFormData({
        full_name: '',
        business_name: '',
        email: '',
        inquiry_type: 'Bulk Order (50+ items)',
        message: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <CheckCircle2 size={64} className="text-neutral-900" />
        </div>
        <h1 className="text-3xl font-serif">Inquiry Received</h1>
        <p className="text-neutral-500 leading-relaxed">
          Thank you for reaching out. Our B2B partnership team will review your bulk order request and contact you within 24-48 business hours with a customized quote.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-8 text-neutral-900 font-bold uppercase tracking-widest border-b-2 border-neutral-900 pb-1"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">B2B Partnerships</span>
            <h1 className="text-5xl font-serif leading-tight">Bulk Orders & <br/>Wholesale Inquiries</h1>
            <p className="text-neutral-600 text-lg leading-relaxed max-w-lg">
              All in cloth partners with exclusive retailers and boutiques worldwide. If you're a shopkeeper looking to stock our collection, please use the form below.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center space-x-6 group">
              <div className="p-4 bg-neutral-50 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Store size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest">Shopkeepers</h4>
                <p className="text-sm text-neutral-500">Dedicated support for independent boutiques.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 group">
              <div className="p-4 bg-neutral-50 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest">Global Distribution</h4>
                <p className="text-sm text-neutral-500">Tiered pricing for large volume distribution.</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 group">
              <div className="p-4 bg-neutral-50 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest">Direct Contact</h4>
                <p className="text-sm text-neutral-500">partnerships@allincloth.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-100 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-neutral-100">
          <h2 className="text-2xl font-serif mb-8">Inquiry Form</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Full Name</label>
                <input 
                  id="full_name"
                  name="full_name"
                  required 
                  type="text" 
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-neutral-200 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="business_name" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Business Name</label>
                <input 
                  id="business_name"
                  name="business_name"
                  required 
                  type="text" 
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-neutral-200 outline-none transition-all" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Email Address</label>
              <input 
                id="email"
                name="email"
                required 
                type="email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-neutral-200 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="inquiry_type" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Inquiry Type</label>
              <select 
                id="inquiry_type"
                name="inquiry_type"
                value={formData.inquiry_type}
                onChange={handleChange}
                className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-neutral-200 outline-none transition-all"
              >
                <option>Bulk Order (50+ items)</option>
                <option>Wholesale Partnership</option>
                <option>Custom Production</option>
                <option>General Support</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Tell us about your needs</label>
              <textarea 
                id="message"
                name="message"
                required 
                rows={4} 
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-neutral-200 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Sending...' : 'Send Inquiry'}</span>
              {!loading && <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

