import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

process.env.RAZORPAY_KEY_ID = 'test_key_id'
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret'
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
// Support alternative env variable names
process.env.RAZOR_API_KEY = 'test_key_id'
process.env.RAZOR_SECRET_KEY = 'test_key_secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
process.env.NODE_ENV = 'test'
process.env.AUTH_JWT_SECRET = 'test_jwt_secret'

global.Request = class Request {
  constructor(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body || null
    this.bodyUsed = false
    
    try {
      this.nextUrl = new URL(url)
    } catch {
      this.nextUrl = { searchParams: new URLSearchParams() }
    }
  }
  
  async json() {
    if (this.bodyUsed) {
      throw new Error('Body already read')
    }
    this.bodyUsed = true
    if (typeof this.body === 'string') {
      return JSON.parse(this.body || '{}')
    }
    return this.body || {}
  }
  
  async text() {
    if (this.bodyUsed) {
      throw new Error('Body already read')
    }
    this.bodyUsed = true
    return this.body || ''
  }
  
  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    })
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers || {})
    this.ok = this.status >= 200 && this.status < 300
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
  
  async text() {
    return this.body || ''
  }
  
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = {}
    if (init instanceof Headers) {
      init.forEach((value, key) => {
        this._headers[key.toLowerCase()] = value
      })
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value
      })
    } else {
      Object.entries(init).forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value
      })
    }
  }
  
  get(name) {
    return this._headers[name.toLowerCase()] || null
  }
  
  set(name, value) {
    this._headers[name.toLowerCase()] = value
  }
  
  has(name) {
    return name.toLowerCase() in this._headers
  }
  
  forEach(callback) {
    Object.entries(this._headers).forEach(([key, value]) => {
      callback(value, key, this)
    })
  }
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    get: jest.fn(() => undefined),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(() => false),
  })),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}))

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({ payload: {} }),
  compactDecrypt: jest.fn(),
  compactEncrypt: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  getDbClient: jest.fn(async () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}))

