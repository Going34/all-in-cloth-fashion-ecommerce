'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { settingsActions } from '@/store/slices/settings/settingsSlice';
import { 
  selectSettings, 
  selectSettingsLoading, 
  selectSettingsError
} from '@/store/slices/settings/settingsSelectors';
import { Store, CreditCard, Truck, Globe, Calculator, ShieldCheck, Save, Edit2, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const loading = useAppSelector(selectSettingsLoading);
  const error = useAppSelector(selectSettingsError);
  
  const [localSettings, setLocalSettings] = useState({
    general: {
      storeName: '',
      supportEmail: '',
      storeDescription: '',
    },
    shipping: {
      standardRate: 0,
      expressRate: 0,
      freeShippingThreshold: 0,
    },
    tax: {
      rate: 0,
      type: 'vat' as 'vat' | 'sales_tax',
    },
    paymentMethods: {
      stripe: { enabled: false },
      paypal: { enabled: false },
      razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
      applePay: { enabled: false },
      googlePay: { enabled: false },
    },
  });

  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [tempShippingRate, setTempShippingRate] = useState('0');
  const [tempTaxRate, setTempTaxRate] = useState('0');

  useEffect(() => {
    dispatch(settingsActions.fetchSettingsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      const paymentMethodsFromSettings =
        settings.paymentMethods && typeof settings.paymentMethods === 'object'
          ? (settings.paymentMethods as Record<string, unknown>)
          : undefined;

      setLocalSettings((prev) => ({
        ...prev,
        ...settings,
        shipping: {
          ...prev.shipping,
          ...settings.shipping,
          standardRate: settings.shipping.standardRate,
          expressRate: settings.shipping.expressRate ?? 0,
          freeShippingThreshold: settings.shipping.freeShippingThreshold ?? 0,
        },
        paymentMethods: {
          ...prev.paymentMethods,
          ...(paymentMethodsFromSettings as unknown as Partial<typeof prev.paymentMethods>),
          razorpay: {
            ...prev.paymentMethods.razorpay,
            ...((paymentMethodsFromSettings?.razorpay as Partial<typeof prev.paymentMethods.razorpay>) ?? {}),
          },
        },
      }));
      setTempShippingRate(settings.shipping.standardRate.toString());
      setTempTaxRate(settings.tax.rate.toString());
    }
  }, [settings]);

  const handleSave = () => {
    dispatch(settingsActions.updateSettingsRequest(localSettings));
  };

  const handleShippingSave = () => {
    const rate = parseFloat(tempShippingRate);
    if (!isNaN(rate) && rate >= 0) {
      const updatedSettings = {
        ...localSettings,
        shipping: {
          ...localSettings.shipping,
          standardRate: rate,
        },
      };
      setLocalSettings(updatedSettings);
      setIsEditingShipping(false);
    } else {
      alert('Please enter a valid shipping rate');
    }
  };

  const handleTaxSave = () => {
    const rate = parseFloat(tempTaxRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      const updatedSettings = {
        ...localSettings,
        tax: {
          ...localSettings.tax,
          rate: rate,
        },
      };
      setLocalSettings(updatedSettings);
      setIsEditingTax(false);
    } else {
      alert('Please enter a valid tax rate (0-100)');
    }
  };

  const togglePaymentMethod = (method: 'stripe' | 'paypal' | 'razorpay' | 'applePay' | 'googlePay') => {
    setLocalSettings({
      ...localSettings,
      paymentMethods: {
        ...localSettings.paymentMethods,
        [method]: {
          ...localSettings.paymentMethods[method],
          enabled: !localSettings.paymentMethods[method].enabled,
        },
      },
    });
  };

  const updateRazorpayConfig = (field: 'keyId' | 'keySecret' | 'webhookSecret', value: string) => {
    setLocalSettings({
      ...localSettings,
      paymentMethods: {
        ...localSettings.paymentMethods,
        razorpay: {
          ...localSettings.paymentMethods.razorpay,
          [field]: value,
        },
      },
    });
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-bold">Error loading settings</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h1 className="text-3xl font-serif text-slate-900">Store Settings</h1>
        <p className="text-slate-500 mt-1">Configure your brand details, taxes, shipping, and payment rules.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center space-x-3 text-slate-900 mb-2">
            <Store size={20} className="text-indigo-600" />
            <h3 className="font-bold text-lg">General Brand Info</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Store Name</label>
              <input 
                type="text" 
                value={localSettings.general.storeName}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  general: { ...localSettings.general, storeName: e.target.value }
                })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Support Email</label>
              <input 
                type="email" 
                value={localSettings.general.supportEmail}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  general: { ...localSettings.general, supportEmail: e.target.value }
                })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Store Description</label>
              <textarea 
                rows={3} 
                value={localSettings.general.storeDescription}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  general: { ...localSettings.general, storeDescription: e.target.value }
                })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center space-x-3 text-slate-900 mb-2">
            <Truck size={20} className="text-indigo-600" />
            <h3 className="font-bold text-lg">Shipping & Logistics</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg"><Globe size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Standard Shipping Rate</p>
                  <p className="text-xs text-slate-500">Fixed rate for all domestic orders.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isEditingShipping ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      step="0.01"
                      value={tempShippingRate}
                      onChange={(e) => setTempShippingRate(e.target.value)}
                      className="w-20 bg-white border border-slate-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleShippingSave}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingShipping(false);
                        setTempShippingRate(localSettings.shipping.standardRate.toString());
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(localSettings.shipping.standardRate)}</span>
                    <button 
                      onClick={() => {
                        setIsEditingShipping(true);
                        setTempShippingRate(localSettings.shipping.standardRate.toString());
                      }}
                      className="text-xs font-bold uppercase text-indigo-600 hover:underline flex items-center space-x-1"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg"><Calculator size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Tax Configuration (VAT/Sales Tax)</p>
                  <p className="text-xs text-slate-500">Applied based on customer shipping location.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isEditingTax ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      step="0.1"
                      value={tempTaxRate}
                      onChange={(e) => setTempTaxRate(e.target.value)}
                      className="w-20 bg-white border border-slate-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-sm text-slate-500">%</span>
                    <button 
                      onClick={handleTaxSave}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingTax(false);
                        setTempTaxRate(localSettings.tax.rate.toString());
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-slate-900">{localSettings.tax.rate.toFixed(1)}%</span>
                    <button 
                      onClick={() => {
                        setIsEditingTax(true);
                        setTempTaxRate(localSettings.tax.rate.toString());
                      }}
                      className="text-xs font-bold uppercase text-indigo-600 hover:underline flex items-center space-x-1"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center space-x-3 text-slate-900 mb-2">
            <CreditCard size={20} className="text-indigo-600" />
            <h3 className="font-bold text-lg">Payment Methods</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'stripe', label: 'Stripe Checkout' },
              { key: 'paypal', label: 'PayPal Express' },
              { key: 'razorpay', label: 'Razorpay' },
              { key: 'applePay', label: 'Apple Pay' },
              { key: 'googlePay', label: 'Google Pay' }
            ].map((method) => (
              <div key={method.key} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <span className="text-sm font-medium text-slate-700">{method.label}</span>
                <label className="relative flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={localSettings.paymentMethods[method.key as keyof typeof localSettings.paymentMethods].enabled}
                    onChange={() => togglePaymentMethod(method.key as 'stripe' | 'paypal' | 'razorpay' | 'applePay' | 'googlePay')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>

          {localSettings.paymentMethods.razorpay.enabled && (
            <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-semibold text-slate-900">Razorpay Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Key ID
                  </label>
                  <input
                    type="text"
                    value={localSettings.paymentMethods.razorpay.keyId || ''}
                    onChange={(e) => updateRazorpayConfig('keyId', e.target.value)}
                    placeholder="rzp_test_..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Your Razorpay Key ID from the dashboard</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Key Secret
                  </label>
                  <input
                    type="password"
                    value={localSettings.paymentMethods.razorpay.keySecret || ''}
                    onChange={(e) => updateRazorpayConfig('keySecret', e.target.value)}
                    placeholder="Enter your key secret"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Your Razorpay Key Secret (keep this secure)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={localSettings.paymentMethods.razorpay.webhookSecret || ''}
                    onChange={(e) => updateRazorpayConfig('webhookSecret', e.target.value)}
                    placeholder="Enter webhook secret"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Webhook secret for verifying webhook signatures (recommended for production)</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
