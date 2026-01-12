'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Trash2, Edit2, CheckCircle2, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addressesActions } from '../../store/slices/addresses/addressesSlice';
import { selectAddresses, selectAddressesLoading, selectAddressesError } from '../../store/slices/addresses/addressesSelectors';
import type { Address, AddressInput } from '../../types';
import ProtectedRoute from '../../components/ProtectedRoute';
import AccountLayout from '../../components/AccountLayout';

function AddressesContent() {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const loading = useAppSelector(selectAddressesLoading);
  const error = useAppSelector(selectAddressesError);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressInput>({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    is_default: false,
  });

  useEffect(() => {
    dispatch(addressesActions.fetchAddressesRequest());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      dispatch(addressesActions.updateAddressRequest({
        id: editingAddress.id,
        updates: formData,
      }));
    } else {
      dispatch(addressesActions.createAddressRequest(formData));
    }
    setIsAdding(false);
    setEditingAddress(null);
    setFormData({
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
      is_default: false,
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      is_default: address.is_default || false,
    });
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      dispatch(addressesActions.deleteAddressRequest(id));
    }
  };

  const handleSetDefault = (id: string) => {
    dispatch(addressesActions.setDefaultAddressRequest(id));
  };

  return (
    <AccountLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif">Shipping Addresses</h1>
          <p className="text-neutral-500">Manage your delivery locations for a faster checkout.</p>
        </div>
        <button 
          onClick={() => {
            setEditingAddress(null);
            setFormData({
              name: '',
              street: '',
              city: '',
              state: '',
              zip: '',
              country: '',
              phone: '',
              is_default: false,
            });
            setIsAdding(true);
          }}
          className="bg-neutral-900 text-white px-6 py-3 font-medium flex items-center space-x-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus size={18} />
          <span>Add New Address</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center">
          <p className="text-neutral-500">Loading addresses...</p>
        </div>
      )}

      {error && (
        <div className="py-12 text-center">
          <p className="text-red-500">Error loading addresses: {error}</p>
        </div>
      )}

      {!loading && !error && addresses.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-neutral-500">No addresses found. Add your first address to get started.</p>
        </div>
      )}

      {!loading && !error && addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map((address) => (
          <div 
            key={address.id} 
            className={`p-6 border rounded-2xl relative transition-all ${
              address.is_default ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 bg-white hover:border-neutral-300'
            }`}
          >
            {address.is_default && (
              <div className="absolute -top-3 left-6 px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                Default
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white rounded-xl border border-neutral-100">
                <MapPin size={24} className="text-neutral-400" />
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEdit(address)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(address.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-8">
              <p className="font-bold text-lg">{address.name}</p>
              <p className="text-neutral-600">{address.street}</p>
              <p className="text-neutral-600">{address.city}, {address.state} {address.zip}</p>
              <p className="text-neutral-600 font-medium">{address.country}</p>
              <p className="text-neutral-600">{address.phone}</p>
            </div>

            {!address.is_default && (
              <button 
                onClick={() => handleSetDefault(address.id)}
                className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Set as Default
              </button>
            )}
          </div>
        ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 sm:p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingAddress(null);
                  setFormData({
                    name: '',
                    street: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                    phone: '',
                    is_default: false,
                  });
                }} 
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X size={24} />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
              />
              <input 
                type="text" 
                placeholder="Street Address" 
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
                className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="City" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
                <input 
                  type="text" 
                  placeholder="State" 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="ZIP Code" 
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  required
                  className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
                <input 
                  type="text" 
                  placeholder="Country" 
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
              </div>
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
              />
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                />
                <label htmlFor="is_default" className="text-sm text-neutral-600">Set as default address</label>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-neutral-900 text-white font-bold uppercase tracking-widest rounded-xl mt-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

export default function Addresses() {
  return (
    <ProtectedRoute>
      <AddressesContent />
    </ProtectedRoute>
  );
}

