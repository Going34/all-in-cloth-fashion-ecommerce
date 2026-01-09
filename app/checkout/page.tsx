'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ordersActions } from '../../store/slices/orders/ordersSlice';
import { selectOrdersLoading, selectOrdersError, selectSelectedOrder } from '../../store/slices/orders/ordersSelectors';
import { addressesActions } from '../../store/slices/addresses/addressesSlice';
import { selectAddresses, selectAddressesLoading, selectAddressesError, selectDefaultAddress } from '../../store/slices/addresses/addressesSelectors';
import { CheckCircle2, ChevronLeft, CreditCard, Truck, MapPin, Plus } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { formatCurrency } from '../../utils/currency';
import type { Address, AddressInput } from '../../types';

function CheckoutContent() {
  const { cart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const createdOrder = useAppSelector(selectSelectedOrder);
  const addresses = useAppSelector(selectAddresses);
  const addressesLoading = useAppSelector(selectAddressesLoading);
  const addressesError = useAppSelector(selectAddressesError);
  const defaultAddress = useAppSelector(selectDefaultAddress);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<AddressInput>({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    is_default: false,
  });
  const [addressValidationErrors, setAddressValidationErrors] = useState<Record<string, string>>({});
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  const shipping = 15;
  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + shipping + tax;

  useEffect(() => {
    dispatch(addressesActions.fetchAddressesRequest());
  }, [dispatch]);

  useEffect(() => {
    if (defaultAddress && !selectedAddressId && !useNewAddress) {
      setSelectedAddressId(defaultAddress.id);
    } else if (addresses.length > 0 && !selectedAddressId && !useNewAddress && !defaultAddress) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [defaultAddress, addresses, selectedAddressId, useNewAddress]);

  useEffect(() => {
    if (createdOrder && !loading && !error) {
      setIsSuccess(true);
      clearCart();
      setTimeout(() => {
        router.push('/');
      }, 4000);
    }
  }, [createdOrder, loading, error, clearCart, router]);

  const validateNewAddressForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newAddressForm.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!newAddressForm.street.trim()) {
      errors.street = 'Street address is required';
    }
    if (!newAddressForm.city.trim()) {
      errors.city = 'City is required';
    }
    if (!newAddressForm.state.trim()) {
      errors.state = 'State is required';
    }
    if (!newAddressForm.zip.trim()) {
      errors.zip = 'ZIP code is required';
    }
    if (!newAddressForm.country.trim()) {
      errors.country = 'Country is required';
    }
    if (!newAddressForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    setAddressValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (isCreatingAddress && addresses.length > 0) {
      const newlyCreatedAddress = addresses.find(addr => 
        addr.name === newAddressForm.name && 
        addr.street === newAddressForm.street &&
        addr.city === newAddressForm.city
      );
      
      if (newlyCreatedAddress) {
        setSelectedAddressId(newlyCreatedAddress.id);
        setUseNewAddress(false);
        setIsCreatingAddress(false);
        setAddressValidationErrors({});
        setNewAddressForm({
          name: '',
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          phone: '',
          is_default: false,
        });
      }
    }
  }, [addresses, isCreatingAddress, newAddressForm]);

  useEffect(() => {
    if (isCreatingAddress && addressesError && !addressesLoading) {
      setIsCreatingAddress(false);
    }
  }, [addressesError, isCreatingAddress, addressesLoading]);

  const handleCreateNewAddress = () => {
    if (!validateNewAddressForm()) {
      return;
    }

    setIsCreatingAddress(true);
    dispatch(addressesActions.createAddressRequest(newAddressForm));
  };

  const handlePlaceOrder = () => {
    let addressIdToUse: string | null = null;

    if (useNewAddress) {
      if (!validateNewAddressForm()) {
        return;
      }
      
      alert('Please save the address first by clicking "Save Address" button, then place your order.');
      return;
    } else {
      addressIdToUse = selectedAddressId;
    }

    if (!addressIdToUse) {
      alert('Please select or enter a shipping address');
      return;
    }

    const orderItems = cart.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    }));

    dispatch(ordersActions.createUserOrderRequest({
      items: orderItems,
      address_id: addressIdToUse,
      shipping: shipping,
    }));
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-serif">Order Confirmed!</h1>
        <p className="text-neutral-500">Thank you for your purchase. We've sent a confirmation email to your inbox and will notify you as soon as your order ships.</p>
        <div className="bg-neutral-50 p-6 rounded-lg text-sm text-left">
          <p className="font-bold mb-2">Order Summary</p>
          {createdOrder && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Order Number:</span>
              <span>{createdOrder.order_number || 'N/A'}</span>
            </div>
          )}
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Estimated Delivery:</span>
            <span>Oct 21 - Oct 24</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400">Redirecting to homepage...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif">Your cart is empty</h2>
        <button onClick={() => router.push('/shop')} className="mt-4 text-neutral-900 underline">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-2 mb-8 text-neutral-400">
        <button onClick={() => router.back()} className="hover:text-neutral-900 flex items-center space-x-1">
          <ChevronLeft size={16} />
          <span className="text-sm">Back to Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-neutral-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h2 className="text-xl font-medium">Shipping Address</h2>
              </div>
              <Link 
                href="/addresses" 
                className="text-sm text-neutral-600 hover:text-neutral-900 underline"
              >
                Manage Addresses
              </Link>
            </div>

            {addressesLoading && (
              <div className="py-8 text-center">
                <p className="text-neutral-500">Loading addresses...</p>
              </div>
            )}

            {addressesError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {addressesError.includes('loading') ? `Error loading addresses: ${addressesError}` : `Error: ${addressesError}`}
              </div>
            )}

            {!addressesLoading && !useNewAddress && (
              <div className="space-y-3">
                {addresses.length > 0 ? (
                  <>
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => {
                          setSelectedAddressId(address.id);
                          setUseNewAddress(false);
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin size={18} className="text-neutral-400" />
                              <p className="font-medium">{address.name}</p>
                              {address.is_default && (
                                <span className="text-xs px-2 py-0.5 bg-neutral-900 text-white rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-600">{address.street}</p>
                            <p className="text-sm text-neutral-600">
                              {address.city}, {address.state} {address.zip}
                            </p>
                            <p className="text-sm text-neutral-600">{address.country}</p>
                            <p className="text-sm text-neutral-600 mt-1">{address.phone}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddressId === address.id
                              ? 'border-neutral-900 bg-neutral-900'
                              : 'border-neutral-300'
                          }`}>
                            {selectedAddressId === address.id && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setUseNewAddress(true);
                        setSelectedAddressId(null);
                      }}
                      className="w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Add New Address</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">No saved addresses found</p>
                    <button
                      onClick={() => setUseNewAddress(true)}
                      className="px-6 py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {useNewAddress && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Enter New Address</h3>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => {
                        setUseNewAddress(false);
                        setAddressValidationErrors({});
                      }}
                      className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                    >
                      Use Saved Address
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAddressForm.name}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                        addressValidationErrors.name ? 'border-red-300' : 'border-neutral-200'
                      }`}
                    />
                    {addressValidationErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{addressValidationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddressForm.street}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                        addressValidationErrors.street ? 'border-red-300' : 'border-neutral-200'
                      }`}
                    />
                    {addressValidationErrors.street && (
                      <p className="text-xs text-red-600 mt-1">{addressValidationErrors.street}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                          addressValidationErrors.city ? 'border-red-300' : 'border-neutral-200'
                        }`}
                      />
                      {addressValidationErrors.city && (
                        <p className="text-xs text-red-600 mt-1">{addressValidationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddressForm.state}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                          addressValidationErrors.state ? 'border-red-300' : 'border-neutral-200'
                        }`}
                      />
                      {addressValidationErrors.state && (
                        <p className="text-xs text-red-600 mt-1">{addressValidationErrors.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        value={newAddressForm.zip}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, zip: e.target.value })}
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                          addressValidationErrors.zip ? 'border-red-300' : 'border-neutral-200'
                        }`}
                      />
                      {addressValidationErrors.zip && (
                        <p className="text-xs text-red-600 mt-1">{addressValidationErrors.zip}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddressForm.country}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, country: e.target.value })}
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                          addressValidationErrors.country ? 'border-red-300' : 'border-neutral-200'
                        }`}
                      />
                      {addressValidationErrors.country && (
                        <p className="text-xs text-red-600 mt-1">{addressValidationErrors.country}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newAddressForm.phone}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                        addressValidationErrors.phone ? 'border-red-300' : 'border-neutral-200'
                      }`}
                    />
                    {addressValidationErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{addressValidationErrors.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default_new"
                      checked={newAddressForm.is_default}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, is_default: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                    />
                    <label htmlFor="is_default_new" className="text-sm text-neutral-600">
                      Set as default address
                    </label>
                  </div>
                  <button
                    onClick={handleCreateNewAddress}
                    disabled={addressesLoading}
                    className="w-full py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addressesLoading ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-neutral-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="text-xl font-medium">Delivery Method</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-neutral-900 bg-neutral-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Truck size={20} />
                  <div>
                    <p className="font-medium">Standard Delivery</p>
                    <p className="text-xs text-neutral-500">3-5 Business Days</p>
                  </div>
                </div>
                <span className="font-semibold">{formatCurrency(15)}</span>
              </label>
              <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg opacity-50 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <div className="text-neutral-400"><Truck size={20} /></div>
                  <div>
                    <p className="font-medium">Express Courier</p>
                    <p className="text-xs text-neutral-500">1-2 Business Days</p>
                  </div>
                </div>
                <span className="font-semibold">{formatCurrency(45)}</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-neutral-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <h2 className="text-xl font-medium">Payment</h2>
            </div>
            <div className="p-6 border border-neutral-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center space-x-3">
                  <CreditCard size={24} />
                  <span className="font-medium">Credit / Debit Card</span>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-5 bg-neutral-100 border border-neutral-200 rounded text-[6px] flex items-center justify-center">VISA</div>
                  <div className="w-8 h-5 bg-neutral-100 border border-neutral-200 rounded text-[6px] flex items-center justify-center">MASTER</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <input type="text" placeholder="Card Number" className="md:col-span-4 p-3 border border-neutral-200 rounded-md" />
                <input type="text" placeholder="MM / YY" className="md:col-span-2 p-3 border border-neutral-200 rounded-md" />
                <input type="text" placeholder="CVC" className="md:col-span-2 p-3 border border-neutral-200 rounded-md" />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              Error placing order: {error}
            </div>
          )}
          <button 
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Place Order — ${formatCurrency(grandTotal)}`}
          </button>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-32 bg-neutral-50 p-8 rounded-2xl space-y-8">
            <h3 className="text-xl font-serif">Order Summary</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.variant_id} className="flex space-x-4">
                  <div className="w-20 h-24 bg-neutral-200 rounded overflow-hidden flex-shrink-0">
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm font-medium">{item.product_name}</h4>
                    <p className="text-xs text-neutral-500">{item.color} • {item.size}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Estimated Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-neutral-100 flex items-center space-x-4">
              <div className="bg-neutral-50 p-2 rounded">
                <Truck size={18} className="text-neutral-900" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase">Estimated Delivery</p>
                <p className="text-[10px] text-neutral-500">Oct 21 - Oct 24, 2023</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}

