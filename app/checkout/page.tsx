'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { PromoCodeInput } from '../../components/cart/PromoCodeInput';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectOrdersLoading, selectOrdersError, selectSelectedOrder } from '../../store/slices/orders/ordersSelectors';
import { addressesActions } from '../../store/slices/addresses/addressesSlice';
import { selectAddresses, selectAddressesLoading, selectAddressesError, selectDefaultAddress } from '../../store/slices/addresses/addressesSelectors';
import { CheckCircle2, ChevronLeft, CreditCard, Truck, MapPin, Plus, Loader2 } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { formatCurrency } from '../../utils/currency';
import type { AddressInput } from '../../types';

type RazorpayCheckoutInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

function CheckoutContent() {
  const { user } = useAuth();
  const { cart, totalPrice, clearCart, subtotal, discountAmount, finalTotal, promoCode } = useCart();
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayScriptLoaded = useRef(false);
  const redirectStarted = useRef(false);
  const orderIdRef = useRef<string | null>(null);
  const paymentCompletedRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'PARTIAL_COD'>('PREPAID');
  const advanceAmount = 70;

  const shipping = 0;
  // Calculate tax on the discounted total
  // Tax included in price
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = 0; 
  const grandTotal = taxableAmount + shipping + tax;

  const paymentAmount = paymentMode === 'PARTIAL_COD' ? advanceAmount : grandTotal;
  const remainingAmount = paymentMode === 'PARTIAL_COD' ? grandTotal - advanceAmount : 0;

  const getDeliveryDateRange = (includeYear = true) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 5);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);

    if (includeYear) {
      const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      const endStr = end.toLocaleDateString('en-US', options);
      return `${startStr} - ${endStr}`;
    }
  };

  useEffect(() => {
    if (isSuccess) return;
    dispatch(addressesActions.fetchAddressesRequest());
  }, [dispatch, isSuccess]);

  useEffect(() => {
    if (isSuccess) return;
    if (defaultAddress && !selectedAddressId && !useNewAddress) {
      setSelectedAddressId(defaultAddress.id);
    } else if (addresses.length > 0 && !selectedAddressId && !useNewAddress && !defaultAddress) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [defaultAddress, addresses, selectedAddressId, useNewAddress, isSuccess]);

  useEffect(() => {
    if (isSuccess || redirectStarted.current) return;
    if (createdOrder && !loading && !error && createdOrder.status === 'paid') {
      setIsSuccess(true);
      redirectStarted.current = true;
      clearCart();
      setTimeout(() => {
        router.push('/');
      }, 4000);
    }
  }, [createdOrder, loading, error, clearCart, router, isSuccess]);

  useEffect(() => {
    if (razorpayScriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
      razorpayScriptLoaded.current = true;
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setPaymentError('Failed to load payment gateway. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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

  const handlePlaceOrder = async () => {
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

    if (!razorpayLoaded) {
      setPaymentError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const orderItems = cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          address_id: addressIdToUse,
          shipping: shipping,
          promo_code: promoCode || undefined, // Send promo code if applied
          payment_mode: paymentMode,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const order = orderData.data;
      orderIdRef.current = order?.id || null;
      paymentCompletedRef.current = false;
      cancelRequestedRef.current = false;

      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          // Send payment mode and advance amount so backend can
          // correctly charge only the advance for Partial COD
          payment_mode: paymentMode,
          advance_amount: paymentMode === 'PARTIAL_COD' ? advanceAmount : undefined,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error?.message || 'Failed to initialize payment');
      }

      const paymentData = await paymentResponse.json();
      const paymentConfig = paymentData.data;

      const addressDetails = useNewAddress 
        ? newAddressForm 
        : addresses.find(a => a.id === selectedAddressId);
      
      const prefillPhone = addressDetails?.phone || user?.phone || '';
      // Ensure phone number has country code for Razorpay if possible, 
      // but usually just digits works if user is in India. 
      // Sometimes Razorpay prefers +91. Let's assume input is clean or just pass as is.
      
      const options = {
        key: paymentConfig.key_id,
        amount: paymentConfig.amount,
        currency: paymentConfig.currency,
        name: paymentConfig.name,
        description: paymentConfig.description,
        order_id: paymentConfig.razorpay_order_id,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            setIsProcessingPayment(true);
            setPaymentError(null);

            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error?.message || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            if (verifyData.data.success) {
              paymentCompletedRef.current = true;
              if (!redirectStarted.current) {
                redirectStarted.current = true;
                setIsSuccess(true);
                clearCart();
                setTimeout(() => {
                  router.push('/');
                }, 3000);
              }
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch (error: unknown) {
            console.error('Payment verification error:', error);
            setPaymentError(
              error instanceof Error
                ? error.message
                : 'Payment verification failed. Please contact support.'
            );
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: addressDetails?.name || user?.name || '',
          email: user?.email || '',
          contact: prefillPhone,
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setPaymentError('Payment was cancelled');
            const orderId = orderIdRef.current;
            if (!orderId || paymentCompletedRef.current || cancelRequestedRef.current) {
              return;
            }
            cancelRequestedRef.current = true;
            fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' }).catch(() => { });
          },
        },
      };

      const razorpay = new window.Razorpay(options as Record<string, unknown>);
      razorpay.open();
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-serif">Order Confirmed!</h1>
        <p className="text-neutral-500">Thank you for your purchase. We have sent a confirmation email to your inbox and will notify you as soon as your order ships.</p>
        <div className="bg-neutral-50 p-6 rounded-lg text-sm text-left">
          <p className="font-bold mb-2">Order Summary</p>
          {createdOrder && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Order Number:</span>
              <span>{createdOrder.order_number || 'N/A'}</span>
            </div>
          )}
          {createdOrder && createdOrder.payment_mode === 'PARTIAL_COD' && (
            <div className="flex justify-between py-1 text-neutral-600 font-medium bg-yellow-50 p-2 rounded mt-2">
              <span>Remaining Amount (Pay on Delivery):</span>
              <span>{formatCurrency(createdOrder.remaining_balance || 0)}</span>
            </div>
          )}
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Estimated Delivery:</span>
            <span>{getDeliveryDateRange(false)}</span>
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
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === address.id
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
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === address.id
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
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.name ? 'border-red-300' : 'border-neutral-200'
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
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.street ? 'border-red-300' : 'border-neutral-200'
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
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.city ? 'border-red-300' : 'border-neutral-200'
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
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.state ? 'border-red-300' : 'border-neutral-200'
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
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.zip ? 'border-red-300' : 'border-neutral-200'
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
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.country ? 'border-red-300' : 'border-neutral-200'
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
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 ${addressValidationErrors.phone ? 'border-red-300' : 'border-neutral-200'
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
                <span className="font-semibold text-green-600">Free</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-neutral-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <h2 className="text-xl font-medium">Payment Method</h2>
            </div>

            <div className="space-y-4">
              {/* Prepaid Option */}
              <div
                onClick={() => setPaymentMode('PREPAID')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${paymentMode === 'PREPAID' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200'}`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMode === 'PREPAID' ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'}`}>
                    {paymentMode === 'PREPAID' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="font-medium">Full Payment (Prepaid)</span>
                </div>
                {paymentMode === 'PREPAID' && (
                  <div className="pl-8 text-sm text-neutral-600 space-y-2">
                    <p>Pay the full amount now using Credit/Debit Card, UPI, or Netbanking.</p>
                    <div className="flex items-center space-x-2">
                      <CreditCard size={16} />
                      <span>Secure Payment by Razorpay</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Partial COD Option */}
              <div
                onClick={() => setPaymentMode('PARTIAL_COD')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${paymentMode === 'PARTIAL_COD' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMode === 'PARTIAL_COD' ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'}`}>
                      {paymentMode === 'PARTIAL_COD' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className="font-medium">Partial Cash on Delivery</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Pay ₹70 Now</span>
                </div>
                {paymentMode === 'PARTIAL_COD' && (
                  <div className="pl-8 text-sm text-neutral-600 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <p>Pay <span className="font-bold">₹70</span> advance now to confirm your order.</p>
                    <p>The remaining amount of <span className="font-bold">{formatCurrency(grandTotal - advanceAmount)}</span> will be collected at the time of delivery.</p>
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-yellow-800 text-xs">
                      <p>⚠ The advance payment of ₹70 is non-refundable if you cancel the order after dispatch.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(error || paymentError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error || paymentError}
            </div>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={loading || isProcessingPayment || !razorpayLoaded}
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Creating Order...</span>
              </>
            ) : (
              paymentMode === 'PARTIAL_COD'
                ? `Pay Advance ₹70 & Place Order`
                : `Pay ${formatCurrency(grandTotal)}`
            )}
          </button>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-32 bg-neutral-50 p-8 rounded-2xl space-y-8">
            <h3 className="text-xl font-serif">Order Summary</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.variant_id} className="flex space-x-4">
                  <div className="w-20 h-24 bg-neutral-200 rounded overflow-hidden shrink-0">
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
              <PromoCodeInput />

              <div className="flex justify-between text-neutral-600 pt-4">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium my-2">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Estimated Tax</span>
                <span className="text-neutral-500">Included</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-neutral-200 mt-4">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>

              {paymentMode === 'PARTIAL_COD' && (
                <div className="bg-neutral-50 p-3 rounded border border-neutral-200 mt-2 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>To Pay Now:</span>
                    <span>{formatCurrency(advanceAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Due on Delivery:</span>
                    <span>{formatCurrency(Math.max(0, grandTotal - advanceAmount))}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-neutral-100 flex items-center space-x-4">
              <div className="bg-neutral-50 p-2 rounded">
                <Truck size={18} className="text-neutral-900" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase">Estimated Delivery</p>
                <p className="text-[10px] text-neutral-500">{getDeliveryDateRange(true)}</p>
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


