export interface SettingsResponse {
  general: {
    storeName: string;
    supportEmail: string;
    storeDescription: string;
  };
  shipping: {
    standardRate: number;
    expressRate?: number;
    freeShippingThreshold?: number;
  };
  tax: {
    rate: number;
    type: 'vat' | 'sales_tax';
  };
  paymentMethods: {
    stripe: {
      enabled: boolean;
      publicKey?: string;
      webhookSecret?: string;
    };
    paypal: {
      enabled: boolean;
      clientId?: string;
    };
    applePay: {
      enabled: boolean;
    };
    googlePay: {
      enabled: boolean;
    };
  };
}

export interface UpdateSettingsRequest {
  general?: {
    storeName?: string;
    supportEmail?: string;
    storeDescription?: string;
  };
  shipping?: {
    standardRate?: number;
    expressRate?: number;
    freeShippingThreshold?: number;
  };
  tax?: {
    rate?: number;
    type?: 'vat' | 'sales_tax';
  };
  paymentMethods?: {
    stripe?: { enabled: boolean };
    paypal?: { enabled: boolean };
    applePay?: { enabled: boolean };
    googlePay?: { enabled: boolean };
  };
}

